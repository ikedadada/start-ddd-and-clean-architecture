from pydantic import BaseModel

from todo_api.application_service.usecase.get_todo_usecase import (
    GetTodoUsecase,
    GetTodoUsecaseInput,
)
from todo_api.domain.repository.errors import RepositoryNotFoundError
from todo_api.presentation.middleware.error_handler import NotFoundError
from todo_api.utils.uuid import UUID7


class GetTodoResponse(BaseModel):
    id: str
    title: str
    description: str | None = None
    completed: bool


class GetTodoHandler:
    def __init__(self, get_todo_usecase: GetTodoUsecase) -> None:
        self.get_todo_usecase = get_todo_usecase

    def handle(self, id: UUID7) -> GetTodoResponse:
        try:
            result = self.get_todo_usecase.execute(GetTodoUsecaseInput(id=id))
        except RepositoryNotFoundError:
            raise NotFoundError(message="Todo not found")
        return GetTodoResponse(
            id=str(result.todo.id),
            title=result.todo.title,
            description=result.todo.description,
            completed=result.todo.completed,
        )
