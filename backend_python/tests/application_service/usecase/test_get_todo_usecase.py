from uuid import UUID, uuid4

from todo_api.application_service.usecase.get_todo_usecase import (
    GetTodoUsecaseImpl,
    GetTodoUsecaseInput,
)
from todo_api.domain.model.todo import Todo
from todo_api.domain.repository.todo_repository import TodoRepository


class RecordingTodoRepository(TodoRepository):
    def __init__(self, todo: Todo) -> None:
        self.todo = todo
        self.find_by_id_argument: UUID | None = None

    def find_all(self) -> list[Todo]:  # pragma: no cover - not used in this test
        raise AssertionError("unexpected call to find_all")

    def find_by_id(self, todo_id: UUID) -> Todo:
        self.find_by_id_argument = todo_id
        return self.todo

    def save(self, todo: Todo) -> None:  # pragma: no cover - not used in this test
        raise AssertionError("unexpected call to save")

    def delete(self, todo: Todo) -> None:  # pragma: no cover - not used in this test
        raise AssertionError("unexpected call to delete")


def test_execute_fetches_todo_by_id():
    todo = Todo(title="inspect")
    todo_repository = RecordingTodoRepository(todo)
    usecase = GetTodoUsecaseImpl(todo_repository)
    todo_id = uuid4()

    output = usecase.execute(GetTodoUsecaseInput(id=todo_id))

    assert todo_repository.find_by_id_argument == todo_id
    assert output.todo is todo
