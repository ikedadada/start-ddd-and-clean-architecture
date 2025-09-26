import pytest

from todo_api.application_service.usecase.create_todo_usecase import (
    CreateTodoUsecase,
    CreateTodoUsecaseInput,
    CreateTodoUsecaseOutput,
)
from todo_api.domain.model.todo import Todo
from todo_api.presentation.handler.create_todo_handler import (
    CreateTodoHandler,
    CreateTodoRequest,
)


class RecordingCreateTodoUsecase(CreateTodoUsecase):
    def __init__(self, todo: Todo) -> None:
        self.todo = todo
        self.received_input: CreateTodoUsecaseInput | None = None

    def execute(self, input_dto: CreateTodoUsecaseInput) -> CreateTodoUsecaseOutput:
        self.received_input = input_dto
        return CreateTodoUsecaseOutput(todo=self.todo)


@pytest.fixture
def todo() -> Todo:
    return Todo(title="write tests", description="for presentation layer")


def test_handle_invokes_usecase_and_returns_response(todo: Todo) -> None:
    usecase = RecordingCreateTodoUsecase(todo)
    handler = CreateTodoHandler(create_todo_usecase=usecase)
    request = CreateTodoRequest(title="write tests", description="for presentation layer")

    response = handler.handle(request)

    assert usecase.received_input == CreateTodoUsecaseInput(
        title="write tests", description="for presentation layer"
    )
    assert response.id == str(todo.id)
    assert response.title == todo.title
    assert response.description == todo.description
    assert response.completed is False
