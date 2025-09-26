import pytest

from todo_api.application_service.usecase.get_todo_usecase import (
    GetTodoUsecase,
    GetTodoUsecaseInput,
    GetTodoUsecaseOutput,
)
from todo_api.domain.model.todo import Todo
from todo_api.domain.repository.errors import RepositoryNotFoundError
from todo_api.presentation.handler.get_todo_handler import GetTodoHandler
from todo_api.presentation.middleware.error_handler import NotFoundError
from todo_api.utils.uuid import UUID7


class StubGetTodoUsecase(GetTodoUsecase):
    def __init__(self, todo: Todo | None = None, *, raises: Exception | None = None) -> None:
        self.todo = todo
        self.raises = raises
        self.received_input: GetTodoUsecaseInput | None = None

    def execute(self, input_dto: GetTodoUsecaseInput) -> GetTodoUsecaseOutput:
        if self.raises is not None:
            raise self.raises
        self.received_input = input_dto
        assert self.todo is not None
        return GetTodoUsecaseOutput(todo=self.todo)


def test_handle_returns_response_from_usecase() -> None:
    todo = Todo(title="inspect")
    usecase = StubGetTodoUsecase(todo=todo)
    handler = GetTodoHandler(get_todo_usecase=usecase)
    todo_id: UUID7 = todo.id

    response = handler.handle(todo_id)

    assert usecase.received_input == GetTodoUsecaseInput(id=todo_id)
    assert response.id == str(todo.id)
    assert response.title == todo.title
    assert response.description == todo.description
    assert response.completed is False


def test_handle_raises_not_found_error_when_repository_returns_none() -> None:
    todo_id = Todo(title="temp").id
    usecase = StubGetTodoUsecase(raises=RepositoryNotFoundError("missing"))
    handler = GetTodoHandler(get_todo_usecase=usecase)

    with pytest.raises(NotFoundError):
        handler.handle(todo_id)
