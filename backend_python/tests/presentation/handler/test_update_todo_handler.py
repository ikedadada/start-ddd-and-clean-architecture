import pytest

from todo_api.application_service.usecase.update_todo_usecase import (
    UpdateTodoUsecase,
    UpdateTodoUsecaseInput,
    UpdateTodoUsecaseOutput,
)
from todo_api.domain.model.todo import Todo
from todo_api.domain.repository.errors import RepositoryNotFoundError
from todo_api.presentation.handler.update_todo_handler import UpdateTodoHandler, UpdateTodoRequest
from todo_api.presentation.middleware.error_handler import NotFoundError
from todo_api.utils.uuid import UUID7


class StubUpdateTodoUsecase(UpdateTodoUsecase):
    def __init__(self, todo: Todo | None = None, *, raises: Exception | None = None) -> None:
        self.todo = todo
        self.raises = raises
        self.received_input: UpdateTodoUsecaseInput | None = None

    def execute(self, input_dto: UpdateTodoUsecaseInput) -> UpdateTodoUsecaseOutput:
        if self.raises is not None:
            raise self.raises
        self.received_input = input_dto
        assert self.todo is not None
        self.todo.update(title=input_dto.title, description=input_dto.description)
        return UpdateTodoUsecaseOutput(todo=self.todo)


def test_handle_updates_existing_todo() -> None:
    existing = Todo(title="old")
    usecase = StubUpdateTodoUsecase(todo=existing)
    handler = UpdateTodoHandler(update_todo_usecase=usecase)
    request = UpdateTodoRequest(title="new", description="desc")
    todo_id: UUID7 = existing.id

    response = handler.handle(todo_id, request)

    assert usecase.received_input == UpdateTodoUsecaseInput(
        id=todo_id, title="new", description="desc"
    )
    assert response.title == "new"
    assert response.description == "desc"


def test_handle_raises_not_found_when_missing() -> None:
    handler = UpdateTodoHandler(
        update_todo_usecase=StubUpdateTodoUsecase(raises=RepositoryNotFoundError("missing"))
    )

    with pytest.raises(NotFoundError):
        handler.handle(Todo(title="temp").id, UpdateTodoRequest(title="x"))
