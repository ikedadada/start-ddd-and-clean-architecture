from todo_api.application_service.usecase.get_all_todos_usecase import (
    GetAllTodosUsecase,
    GetAllTodosUsecaseInput,
    GetAllTodosUsecaseOutput,
)
from todo_api.domain.model.todo import Todo
from todo_api.presentation.handler.get_all_todos_handler import GetAllTodosHandler


class StubGetAllTodosUsecase(GetAllTodosUsecase):
    def __init__(self, todos: list[Todo]) -> None:
        self.todos = todos
        self.called_with: GetAllTodosUsecaseInput | None = None

    def execute(self, input_dto: GetAllTodosUsecaseInput) -> GetAllTodosUsecaseOutput:
        self.called_with = input_dto
        return GetAllTodosUsecaseOutput(todos=self.todos)


def test_handle_maps_domain_list_to_response() -> None:
    todos = [Todo(title="first"), Todo(title="second", description="extra")]
    usecase = StubGetAllTodosUsecase(todos)
    handler = GetAllTodosHandler(get_all_todos_usecase=usecase)

    response = handler.handle()

    assert usecase.called_with == GetAllTodosUsecaseInput()
    assert len(response.todos) == 2
    assert response.todos[0].id == str(todos[0].id)
    assert response.todos[1].description == "extra"
