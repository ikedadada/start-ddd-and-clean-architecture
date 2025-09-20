from pydantic import BaseModel
from uuid_utils import UUID, uuid7

from .errors import TodoAlreadyCompletedError, TodoNotCompletedError


class TodoDTO(BaseModel):
    id: str
    title: str
    description: str | None
    completed: bool


class Todo:
    def __init__(self, title: str, description: str | None = None):
        self._id: UUID = uuid7()
        self._title = title
        self._description = description
        self._completed = False

    @property
    def id(self) -> UUID:
        return self._id

    @property
    def title(self) -> str:
        return self._title

    @property
    def description(self) -> str | None:
        return self._description

    @property
    def completed(self) -> bool:
        return self._completed

    def update(self, title: str, description: str | None = None):
        self._title = title
        self._description = description

    def mark_completed(self):
        if self._completed:
            raise TodoAlreadyCompletedError()
        self._completed = True

    def mark_uncompleted(self):
        if not self._completed:
            raise TodoNotCompletedError()
        self._completed = False

    def to_dto(self) -> TodoDTO:
        return TodoDTO(
            id=str(self.id),
            title=self.title,
            description=self.description,
            completed=self.completed,
        )

    @classmethod
    def from_dto(cls, dto: TodoDTO) -> "Todo":
        todo = cls.__new__(cls)  # Bypass __init__ to avoid UUID regeneration
        todo._id = UUID(dto.id)
        todo._title = dto.title
        todo._description = dto.description
        todo._completed = dto.completed
        return todo
