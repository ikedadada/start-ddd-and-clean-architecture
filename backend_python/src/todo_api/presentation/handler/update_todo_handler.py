from pydantic import BaseModel

from todo_api.application_service.usecase.update_todo_usecase import (
    UpdateTodoUsecase,
    UpdateTodoUsecaseInput,
)
from todo_api.domain.repository.errors import RepositoryNotFoundError
from todo_api.presentation.middleware.error_handler import NotFoundError
from todo_api.utils.uuid import UUID7


class UpdateTodoRequest(BaseModel):
    title: str
    description: str | None = None


class UpdateTodoResponse(BaseModel):
    id: str
    title: str
    description: str | None = None
    completed: bool


class UpdateTodoHandler:
    def __init__(self, update_todo_usecase: UpdateTodoUsecase) -> None:
        self.update_todo_usecase = update_todo_usecase

    def handle(self, id: UUID7, request: UpdateTodoRequest) -> UpdateTodoResponse:
        try:
            result = self.update_todo_usecase.execute(
                UpdateTodoUsecaseInput(id=id, title=request.title, description=request.description)
            )
        except RepositoryNotFoundError:
            raise NotFoundError(message="Todo not found")
        return UpdateTodoResponse(
            id=str(result.todo.id),
            title=result.todo.title,
            description=result.todo.description,
            completed=result.todo.completed,
        )
