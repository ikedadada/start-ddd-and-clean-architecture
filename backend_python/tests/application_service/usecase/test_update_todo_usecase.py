from collections.abc import Callable
from typing import Any, TypeVar
from uuid import UUID, uuid4

from todo_api.application_service.service.transaction_service import TransactionService
from todo_api.application_service.usecase.update_todo_usecase import (
    UpdateTodoUsecaseImpl,
    UpdateTodoUsecaseInput,
)
from todo_api.domain.model.todo import Todo
from todo_api.domain.repository.todo_repository import TodoRepository

ReturnType = TypeVar("ReturnType")


class RecordingTransactionService(TransactionService):
    def __init__(self) -> None:
        self.calls = 0
        self.last_func: Any = None

    def Run(self, func: Callable[[], ReturnType]) -> ReturnType:
        self.calls += 1
        self.last_func = func
        return func()


class RecordingTodoRepository(TodoRepository):
    def __init__(self, todo: Todo) -> None:
        self.todo = todo
        self.find_by_id_argument: UUID | None = None
        self.saved: list[Todo] = []

    def find_all(self) -> list[Todo]:  # pragma: no cover - not used in this test
        raise AssertionError("unexpected call to find_all")

    def find_by_id(self, todo_id: UUID) -> Todo:
        self.find_by_id_argument = todo_id
        return self.todo

    def save(self, todo: Todo) -> None:
        self.saved.append(todo)

    def delete(self, todo: Todo) -> None:  # pragma: no cover - not used in this test
        raise AssertionError("unexpected call to delete")


def test_execute_updates_and_saves_within_transaction():
    existing = Todo(title="draft", description="before")
    todo_repository = RecordingTodoRepository(existing)
    transaction_service = RecordingTransactionService()
    usecase = UpdateTodoUsecaseImpl(todo_repository, transaction_service)
    todo_id = uuid4()

    output = usecase.execute(UpdateTodoUsecaseInput(id=todo_id, title="final", description="after"))

    assert transaction_service.calls == 1
    assert callable(transaction_service.last_func)
    assert todo_repository.find_by_id_argument == todo_id
    assert todo_repository.saved == [existing]
    assert existing.title == "final"
    assert existing.description == "after"
    assert output.todo is existing
