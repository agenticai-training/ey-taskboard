using Moq;
using TaskBoard.Api.Models;
using TaskBoard.Api.Repositories;
using TaskBoard.Api.Services;
using Xunit;

namespace TaskBoard.Api.Tests;

public class TaskServiceTests
{
    private readonly Mock<ITaskRepository> _repo = new();
    private readonly Mock<ICommentRepository> _comments = new();
    private readonly TaskService _sut;

    public TaskServiceTests()
    {
        _comments.Setup(c => c.CountByTaskIdsAsync(It.IsAny<IReadOnlyCollection<int>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Dictionary<int, int>());
        _sut = new TaskService(_repo.Object, _comments.Object);
    }

    private static TaskItem Sample(int id = 1, string status = TaskStatuses.Todo) => new()
    {
        Id = id,
        Title = "Sample",
        Status = status,
        CreatedAt = DateTime.UtcNow,
        UpdatedAt = DateTime.UtcNow,
    };

    [Fact]
    public async Task ListAsync_PassesStatusFilterToRepository()
    {
        _repo.Setup(r => r.ListAsync("done", null, It.IsAny<CancellationToken>()))
             .ReturnsAsync(new List<TaskItem> { Sample(1, TaskStatuses.Done) });

        var result = await _sut.ListAsync("done");

        Assert.Single(result);
        _repo.Verify(r => r.ListAsync("done", null, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task ListAsync_RejectsUnknownStatus()
    {
        await Assert.ThrowsAsync<InvalidStatusException>(() => _sut.ListAsync("archived"));
    }

    [Theory]
    [InlineData(null, null)]
    [InlineData("  ", null)]
    [InlineData("ab", null)]
    [InlineData("  ab  ", null)]
    [InlineData("abc", "abc")]
    [InlineData("  wire  ", "wire")]
    public void NormalizeQuery_AppliesTrimMinLengthAndTruncate(string? input, string? expected)
    {
        Assert.Equal(expected, TaskService.NormalizeQuery(input));
    }

    [Fact]
    public void NormalizeQuery_TruncatesTo200()
    {
        var longQuery = new string('x', 250);
        Assert.Equal(new string('x', 200), TaskService.NormalizeQuery(longQuery));
    }

    [Fact]
    public async Task ListAsync_PassesNormalizedQueryToRepository()
    {
        _repo.Setup(r => r.ListAsync(null, "WIRE", It.IsAny<CancellationToken>()))
             .ReturnsAsync(new List<TaskItem> { Sample() });

        await _sut.ListAsync(null, "  WIRE  ");

        _repo.Verify(r => r.ListAsync(null, "WIRE", It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task ListAsync_TreatsShortQueryAsInactive()
    {
        _repo.Setup(r => r.ListAsync(null, null, It.IsAny<CancellationToken>()))
             .ReturnsAsync(new List<TaskItem>());

        await _sut.ListAsync(null, "ab");

        _repo.Verify(r => r.ListAsync(null, null, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task ListAsync_PassesStatusAndSearchTogether()
    {
        _repo.Setup(r => r.ListAsync("in-progress", "ana", It.IsAny<CancellationToken>()))
             .ReturnsAsync(new List<TaskItem> { Sample(1, TaskStatuses.InProgress) });

        var result = await _sut.ListAsync("in-progress", "ana");

        Assert.Single(result);
        _repo.Verify(
            r => r.ListAsync("in-progress", "ana", It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetAsync_ThrowsWhenMissing()
    {
        _repo.Setup(r => r.GetAsync(99, It.IsAny<CancellationToken>())).ReturnsAsync((TaskItem?)null);
        await Assert.ThrowsAsync<TaskNotFoundException>(() => _sut.GetAsync(99));
    }

    [Fact]
    public async Task CreateAsync_DefaultsStatusToTodo()
    {
        _repo.Setup(r => r.AddAsync(It.IsAny<TaskItem>(), It.IsAny<CancellationToken>()))
             .ReturnsAsync((TaskItem t, CancellationToken _) => { t.Id = 5; return t; });

        var result = await _sut.CreateAsync(new CreateTaskRequest { Title = "New", Status = "" });

        Assert.Equal(TaskStatuses.Todo, result.Status);
        Assert.Equal(5, result.Id);
    }

    [Fact]
    public async Task CreateAsync_RejectsInvalidStatus()
    {
        await Assert.ThrowsAsync<InvalidStatusException>(
            () => _sut.CreateAsync(new CreateTaskRequest { Title = "New", Status = "blocked" }));
    }

    [Fact]
    public async Task UpdateAsync_AppliesChanges()
    {
        _repo.Setup(r => r.GetAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(Sample(1));
        _repo.Setup(r => r.UpdateAsync(It.IsAny<TaskItem>(), It.IsAny<CancellationToken>()))
             .ReturnsAsync((TaskItem t, CancellationToken _) => t);

        var result = await _sut.UpdateAsync(1, new UpdateTaskRequest
        {
            Title = "Changed",
            Status = TaskStatuses.InProgress,
            Assignee = "Ana",
        });

        Assert.Equal("Changed", result.Title);
        Assert.Equal(TaskStatuses.InProgress, result.Status);
        Assert.Equal("Ana", result.Assignee);
    }

    [Fact]
    public async Task DeleteAsync_ThrowsWhenMissing()
    {
        _repo.Setup(r => r.GetAsync(7, It.IsAny<CancellationToken>())).ReturnsAsync((TaskItem?)null);
        await Assert.ThrowsAsync<TaskNotFoundException>(() => _sut.DeleteAsync(7));
    }

    [Fact]
    public async Task DeleteAsync_RemovesExistingTask()
    {
        var task = Sample(3);
        _repo.Setup(r => r.GetAsync(3, It.IsAny<CancellationToken>())).ReturnsAsync(task);

        await _sut.DeleteAsync(3);

        _repo.Verify(r => r.DeleteAsync(task, It.IsAny<CancellationToken>()), Times.Once);
    }
}
