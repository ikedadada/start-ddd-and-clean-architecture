from uuid import UUID

import pytest

from todo_api.application_service.usecase.create_todo_usecase import (
    CreateTodoUsecaseImpl,
    CreateTodoUsecaseInput,
)
from todo_api.domain.model.todo import Todo
from todo_api.domain.repository.todo_repository import TodoRepository


class TrackingTodoRepository(TodoRepository):
    def __init__(self) -> None:
        self.saved: list[Todo] = []

    def find_all(self) -> list[Todo]:  # pragma: no cover - not used in this test
        raise AssertionError("unexpected call to find_all")

    def find_by_id(self, todo_id: UUID) -> Todo:  # pragma: no cover - not used in this test
        raise AssertionError("unexpected call to find_by_id")

    def save(self, todo: Todo) -> None:
        self.saved.append(todo)

    def delete(self, todo: Todo) -> None:  # pragma: no cover - not used in this test
        raise AssertionError("unexpected call to delete")


@pytest.fixture
def todo_repository() -> TrackingTodoRepository:
    return TrackingTodoRepository()


def test_execute_creates_and_persists_todo(todo_repository: TrackingTodoRepository):
    usecase = CreateTodoUsecaseImpl(todo_repository)
    input_dto = CreateTodoUsecaseInput(title="write tests", description="for usecases")

    output = usecase.execute(input_dto)

    assert len(todo_repository.saved) == 1
    saved_todo = todo_repository.saved[0]
    assert isinstance(saved_todo, Todo)
    assert saved_todo.title == "write tests"
    assert saved_todo.description == "for usecases"
    assert not saved_todo.completed
    assert output.todo is saved_todo
