from __future__ import annotations

from sqlalchemy import Boolean, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from todo_api.domain.model.todo import Todo, TodoDTO

from .base import Base


class TodoDataModel(Base):
    __tablename__ = "todos"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    completed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    def to_domain(self) -> Todo:
        dto = TodoDTO(
            id=self.id,
            title=self.title,
            description=self.description,
            completed=self.completed,
        )
        return Todo.from_dto(dto)

    @classmethod
    def from_domain(cls, todo: Todo) -> TodoDataModel:
        dto = todo.to_dto()
        return cls(
            id=dto.id,
            title=dto.title,
            description=dto.description,
            completed=dto.completed,
        )
