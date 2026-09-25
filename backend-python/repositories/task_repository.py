"""Data-access layer for tasks. Knows about SQLAlchemy; knows nothing about HTTP."""
from collections.abc import Sequence

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from models.task import Task

_LIKE_ESCAPE = "!"


def contains_pattern(q: str) -> str:
    """Literal substring pattern. % and _ in q match themselves."""
    escaped = q.replace(_LIKE_ESCAPE, _LIKE_ESCAPE * 2).replace("%", "!%").replace("_", "!_")
    return f"%{escaped}%"


class TaskRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list(
        self, status: str | None = None, q: str | None = None
    ) -> Sequence[Task]:
        stmt = select(Task).order_by(Task.id)
        if status:
            stmt = stmt.where(Task.status == status)
        if q:
            pattern = contains_pattern(q)
            stmt = stmt.where(
                or_(
                    Task.title.ilike(pattern, escape=_LIKE_ESCAPE),
                    Task.description.ilike(pattern, escape=_LIKE_ESCAPE),
                    Task.assignee.ilike(pattern, escape=_LIKE_ESCAPE),
                )
            )
        result = await self._session.execute(stmt)
        return result.scalars().all()

    async def count(self, status: str | None = None) -> int:
        stmt = select(func.count()).select_from(Task)
        if status:
            stmt = stmt.where(Task.status == status)
        result = await self._session.execute(stmt)
        return result.scalar_one()

    async def get(self, task_id: int) -> Task | None:
        return await self._session.get(Task, task_id)

    async def add(self, task: Task) -> Task:
        self._session.add(task)
        await self._session.flush()
        await self._session.refresh(task)
        return task

    async def update(self, task: Task) -> Task:
        await self._session.flush()
        await self._session.refresh(task)
        return task

    async def delete(self, task: Task) -> None:
        await self._session.delete(task)
        await self._session.flush()
