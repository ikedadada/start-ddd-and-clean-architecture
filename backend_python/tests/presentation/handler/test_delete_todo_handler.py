import pytest

from todo_api.application_service.usecase.delete_todo_usecase import (
    DeleteTodoUsecase,
    DeleteTodoUsecaseInput,
    DeleteTodoUsecaseOutput,
)
from todo_api.domain.model.todo import Todo
from todo_api.domain.repository.errors import RepositoryNotFoundError
from todo_api.presentation.handler.delete_todo_handler import DeleteTodoHandler
from todo_api.presentation.middleware.error_handler import NotFoundError
from todo_api.utils.uuid import UUID7


class StubDeleteTodoUsecase(DeleteTodoUsecase):
    def __init__(self, *, raises: Exception | None = None) -> None:
        self.raises = raises
        self.received_input: DeleteTodoUsecaseInput | None = None

    def execute(self, input_dto: DeleteTodoUsecaseInput) -> DeleteTodoUsecaseOutput:
        if self.raises is not None:
            raise self.raises
        self.received_input = input_dto
        return DeleteTodoUsecaseOutput()


def test_handle_invokes_usecase() -> None:
    todo_id: UUID7 = Todo(title="cleanup").id
    usecase = StubDeleteTodoUsecase()
    handler = DeleteTodoHandler(delete_todo_usecase=usecase)

    handler.handle(todo_id)

    assert usecase.received_input == DeleteTodoUsecaseInput(id=todo_id)


def test_handle_raises_not_found_when_missing() -> None:
    todo_id = Todo(title="temp").id
    handler = DeleteTodoHandler(
        delete_todo_usecase=StubDeleteTodoUsecase(raises=RepositoryNotFoundError("missing"))
    )

    with pytest.raises(NotFoundError):
        handler.handle(todo_id)
