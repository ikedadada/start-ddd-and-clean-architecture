from collections.abc import Callable
from typing import Any, TypeVar

from todo_api.application_service.service.transaction_service import TransactionService
from todo_api.application_service.usecase.delete_todo_usecase import (
    DeleteTodoUsecaseImpl,
    DeleteTodoUsecaseInput,
    DeleteTodoUsecaseOutput,
)
from todo_api.domain.model.todo import Todo
from todo_api.domain.repository.todo_repository import TodoRepository
from todo_api.utils.uuid import UUID7, uuid7

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
        self.find_by_id_argument: UUID7 | None = None
        self.deleted: list[Todo] = []

    def find_all(self) -> list[Todo]:  # pragma: no cover - not used in this test
        raise AssertionError("unexpected call to find_all")

    def find_by_id(self, todo_id: UUID7) -> Todo:
        self.find_by_id_argument = todo_id
        return self.todo

    def save(self, todo: Todo) -> None:  # pragma: no cover - not used in this test
        raise AssertionError("unexpected call to save")

    def delete(self, todo: Todo) -> None:
        self.deleted.append(todo)


def test_execute_deletes_within_transaction():
    existing = Todo(title="obsolete")
    todo_repository = RecordingTodoRepository(existing)
    transaction_service = RecordingTransactionService()
    usecase = DeleteTodoUsecaseImpl(todo_repository, transaction_service)
    todo_id = uuid7()

    output = usecase.execute(DeleteTodoUsecaseInput(id=todo_id))

    assert transaction_service.calls == 1
    assert callable(transaction_service.last_func)
    assert todo_repository.find_by_id_argument == todo_id
    assert todo_repository.deleted == [existing]
    assert isinstance(output, DeleteTodoUsecaseOutput)
