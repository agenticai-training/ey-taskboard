package com.honeywell.taskboard.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.honeywell.taskboard.dto.CreateTaskRequest;
import com.honeywell.taskboard.dto.TaskResponse;
import com.honeywell.taskboard.dto.UpdateTaskRequest;
import com.honeywell.taskboard.model.TaskItem;
import com.honeywell.taskboard.model.TaskStatuses;
import com.honeywell.taskboard.repository.CommentRepository;
import com.honeywell.taskboard.repository.TaskRepository;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class TaskServiceImplTest {

    @Mock
    private TaskRepository repository;

    @Mock
    private CommentRepository comments;

    private TaskServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new TaskServiceImpl(repository, comments);
    }

    private static TaskItem sample(int id, String status) {
        TaskItem t = new TaskItem();
        t.setId(id);
        t.setTitle("Sample");
        t.setStatus(status);
        return t;
    }

    @Test
    void listPassesStatusFilterThrough() {
        when(repository.findByOptionalStatusAndQuery("done", null))
                .thenReturn(List.of(sample(1, TaskStatuses.DONE)));
        when(comments.countGroupedByTaskIds(List.of(1))).thenReturn(List.of());

        List<TaskResponse> result = service.list("done", null);

        assertThat(result).hasSize(1);
        verify(repository).findByOptionalStatusAndQuery("done", null);
    }

    @Test
    void listWithBlankStatusQueriesWithNull() {
        when(repository.findByOptionalStatusAndQuery(null, null)).thenReturn(List.of());

        service.list("  ", null);

        verify(repository).findByOptionalStatusAndQuery(null, null);
    }

    @Test
    void listRejectsUnknownStatus() {
        assertThatThrownBy(() -> service.list("archived", null))
                .isInstanceOf(InvalidStatusException.class);
    }

    @Test
    void normalizeQueryTrimsAndEnforcesLength() {
        assertThat(TaskServiceImpl.normalizeQuery(null)).isNull();
        assertThat(TaskServiceImpl.normalizeQuery("  ")).isNull();
        assertThat(TaskServiceImpl.normalizeQuery("ab")).isNull();
        assertThat(TaskServiceImpl.normalizeQuery("abc")).isEqualTo("abc");
        assertThat(TaskServiceImpl.normalizeQuery("  wire  ")).isEqualTo("wire");
        assertThat(TaskServiceImpl.normalizeQuery("x".repeat(250))).isEqualTo("x".repeat(200));
    }

    @Test
    void listPassesNormalizedQueryToRepository() {
        when(repository.findByOptionalStatusAndQuery(null, "WIRE")).thenReturn(List.of());

        service.list(null, "  WIRE  ");

        verify(repository).findByOptionalStatusAndQuery(null, "WIRE");
    }

    @Test
    void listTreatsShortQueryAsInactive() {
        when(repository.findByOptionalStatusAndQuery(null, null)).thenReturn(List.of());

        service.list(null, "ab");

        verify(repository).findByOptionalStatusAndQuery(null, null);
    }

    @Test
    void listPassesStatusAndSearchTogether() {
        when(repository.findByOptionalStatusAndQuery("in-progress", "ana"))
                .thenReturn(List.of(sample(1, TaskStatuses.IN_PROGRESS)));
        when(comments.countGroupedByTaskIds(List.of(1))).thenReturn(List.of());

        List<TaskResponse> result = service.list("in-progress", "ana");

        assertThat(result).hasSize(1);
        verify(repository).findByOptionalStatusAndQuery("in-progress", "ana");
    }

    @Test
    void getThrowsWhenMissing() {
        when(repository.findById(99)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.get(99)).isInstanceOf(TaskNotFoundException.class);
    }

    @Test
    void createDefaultsStatusToTodo() {
        when(repository.saveAndFlush(any(TaskItem.class)))
                .thenAnswer(inv -> {
                    TaskItem t = inv.getArgument(0);
                    t.setId(5);
                    return t;
                });

        TaskResponse result = service.create(new CreateTaskRequest("New", null, "", null));

        assertThat(result.status()).isEqualTo(TaskStatuses.TODO);
        assertThat(result.id()).isEqualTo(5);
    }

    @Test
    void createRejectsInvalidStatus() {
        assertThatThrownBy(() ->
                service.create(new CreateTaskRequest("New", null, "blocked", null)))
                .isInstanceOf(InvalidStatusException.class);
    }

    @Test
    void updateAppliesChanges() {
        when(repository.findById(1)).thenReturn(Optional.of(sample(1, TaskStatuses.TODO)));
        when(repository.saveAndFlush(any(TaskItem.class))).thenAnswer(inv -> inv.getArgument(0));
        when(comments.countByTaskId(1)).thenReturn(4L);

        TaskResponse result = service.update(1,
                new UpdateTaskRequest("Changed", "d", TaskStatuses.IN_PROGRESS, "Ana"));

        assertThat(result.title()).isEqualTo("Changed");
        assertThat(result.status()).isEqualTo(TaskStatuses.IN_PROGRESS);
        assertThat(result.assignee()).isEqualTo("Ana");
        assertThat(result.commentCount()).isEqualTo(4);
    }

    @Test
    void deleteThrowsWhenMissing() {
        when(repository.findById(7)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.delete(7)).isInstanceOf(TaskNotFoundException.class);
    }

    @Test
    void deleteRemovesExistingTask() {
        TaskItem task = sample(3, TaskStatuses.TODO);
        when(repository.findById(3)).thenReturn(Optional.of(task));

        service.delete(3);

        ArgumentCaptor<TaskItem> captor = ArgumentCaptor.forClass(TaskItem.class);
        verify(repository).delete(captor.capture());
        assertThat(captor.getValue().getId()).isEqualTo(3);
    }
}
