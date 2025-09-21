from uuid import UUID

from todo_api.application_service.usecase.get_all_todos_usecase import (
    GetAllTodosUsecaseImpl,
    GetAllTodosUsecaseInput,
)
from todo_api.domain.model.todo import Todo
from todo_api.domain.repository.todo_repository import TodoRepository


class PreloadedTodoRepository(TodoRepository):
    def __init__(self, todos: list[Todo]) -> None:
        self._todos = todos
        self.find_all_calls = 0

    def find_all(self) -> list[Todo]:
        self.find_all_calls += 1
        return self._todos

    def find_by_id(self, todo_id: UUID) -> Todo:  # pragma: no cover - not used in this test
        raise AssertionError("unexpected call to find_by_id")

    def save(self, todo: Todo) -> None:  # pragma: no cover - not used in this test
        raise AssertionError("unexpected call to save")

    def delete(self, todo: Todo) -> None:  # pragma: no cover - not used in this test
        raise AssertionError("unexpected call to delete")


def test_execute_returns_all_todos():
    todos = [Todo(title="one"), Todo(title="two")]
    todo_repository = PreloadedTodoRepository(todos)
    usecase = GetAllTodosUsecaseImpl(todo_repository)

    output = usecase.execute(GetAllTodosUsecaseInput())

    assert todo_repository.find_all_calls == 1
    assert output.todos == todos
