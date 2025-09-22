from pydantic import BaseModel

from todo_api.application_service.usecase.get_all_todos_usecase import (
    GetAllTodosUsecase,
    GetAllTodosUsecaseInput,
)


class TodoDTO(BaseModel):
    id: str
    title: str
    description: str | None = None
    completed: bool


class GetAllTodosResponse(BaseModel):
    todos: list[TodoDTO]


class GetAllTodosHandler:
    def __init__(self, get_all_todos_usecase: GetAllTodosUsecase) -> None:
        self.get_all_todos_usecase = get_all_todos_usecase

    def handle(self) -> GetAllTodosResponse:
        result = self.get_all_todos_usecase.execute(GetAllTodosUsecaseInput())
        todos = [
            TodoDTO(
                id=str(todo.id),
                title=todo.title,
                description=todo.description,
                completed=todo.completed,
            )
            for todo in result.todos
        ]
        return GetAllTodosResponse(todos=todos)
