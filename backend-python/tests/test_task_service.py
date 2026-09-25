"""Unit tests for TaskService against the in-memory fake repository."""
import pytest

from schemas.task import TaskCreate, TaskUpdate
from services.errors import InvalidStatus, TaskNotFound
from services.task_service import TaskService
from tests.conftest import FakeCommentRepository, FakeTaskRepository


@pytest.fixture
def service() -> TaskService:
    tasks = FakeTaskRepository()
    return TaskService(tasks, FakeCommentRepository(tasks))


async def test_create_defaults_to_todo(service):
    task = await service.create_task(TaskCreate(title="X"))
    assert task.status == "todo"
    assert task.id == 1


async def test_create_rejects_invalid_status(service):
    with pytest.raises(InvalidStatus):
        await service.create_task(TaskCreate(title="X", status="blocked"))


async def test_list_with_invalid_status_raises(service):
    with pytest.raises(InvalidStatus):
        await service.list_tasks("blocked")


async def test_get_missing_raises(service):
    with pytest.raises(TaskNotFound):
        await service.get_task(42)


async def test_update_changes_fields(service):
    created = await service.create_task(TaskCreate(title="Old"))
    updated = await service.update_task(
        created.id, TaskUpdate(title="New", status="done", assignee="Ana")
    )
    assert updated.title == "New"
    assert updated.status == "done"
    assert updated.assignee == "Ana"


async def test_delete_then_get_raises(service):
    created = await service.create_task(TaskCreate(title="Temp"))
    await service.delete_task(created.id)
    with pytest.raises(TaskNotFound):
        await service.get_task(created.id)


async def test_count_returns_total(service):
    await service.create_task(TaskCreate(title="A"))
    await service.create_task(TaskCreate(title="B", status="done"))
    assert await service.count_tasks() == 2


async def test_count_filters_by_status(service):
    await service.create_task(TaskCreate(title="A"))
    await service.create_task(TaskCreate(title="B", status="done"))
    assert await service.count_tasks("done") == 1


async def test_count_rejects_invalid_status(service):
    with pytest.raises(InvalidStatus):
        await service.count_tasks("blocked")


def test_normalize_query_trims_and_enforces_length():
    assert TaskService._normalize_query(None) is None
    assert TaskService._normalize_query("  ") is None
    assert TaskService._normalize_query("ab") is None
    assert TaskService._normalize_query("  ab  ") is None
    assert TaskService._normalize_query("abc") == "abc"
    assert TaskService._normalize_query("  wire  ") == "wire"
    long = "x" * 250
    assert TaskService._normalize_query(long) == "x" * 200


async def test_list_tasks_delegates_effective_query(service):
    created = await service.create_task(
        TaskCreate(title="Wire up the board UI", description="Other")
    )
    await service.create_task(TaskCreate(title="Unrelated"))

    matched = await service.list_tasks(q="  WIRE  ")
    assert [t.id for t in matched] == [created.id]

    inactive = await service.list_tasks(q="ab")
    assert len(inactive) == 2


async def test_list_tasks_status_and_query_intersection(service):
    keep = await service.create_task(
        TaskCreate(title="Keep", status="in-progress", assignee="Ana")
    )
    await service.create_task(
        TaskCreate(title="Wrong status", status="todo", assignee="Ana")
    )
    await service.create_task(
        TaskCreate(title="Wrong query", status="in-progress", assignee="Sam")
    )

    result = await service.list_tasks(status="in-progress", q="ana")
    assert [t.id for t in result] == [keep.id]
