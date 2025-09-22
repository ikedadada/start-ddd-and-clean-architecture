from pydantic import BaseModel

from todo_api.application_service.usecase.create_todo_usecase import (
    CreateTodoUsecase,
    CreateTodoUsecaseInput,
)


class CreateTodoRequest(BaseModel):
    title: str
    description: str | None = None


class CreateTodoResponse(BaseModel):
    id: str
    title: str
    description: str | None = None
    completed: bool


class CreateTodoHandler:
    def __init__(self, create_todo_usecase: CreateTodoUsecase) -> None:
        self.create_todo_usecase = create_todo_usecase

    def handle(self, request: CreateTodoRequest) -> CreateTodoResponse:
        result = self.create_todo_usecase.execute(
            CreateTodoUsecaseInput(
                title=request.title,
                description=request.description,
            )
        )

        return CreateTodoResponse(
            id=str(result.todo.id),
            title=result.todo.title,
            description=result.todo.description,
            completed=result.todo.completed,
        )
