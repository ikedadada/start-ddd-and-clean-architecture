from pydantic import BaseModel

from todo_api.application_service.usecase.mark_as_completed_todo_usecase import (
    MarkAsCompletedTodoUsecase,
    MarkAsCompletedTodoUsecaseInput,
)
from todo_api.domain.model.errors import TodoAlreadyCompletedError
from todo_api.domain.repository.errors import RepositoryNotFoundError
from todo_api.presentation.middleware.error_handler import ConflictError, NotFoundError
from todo_api.utils.uuid import UUID7


class MarkAsCompletedTodoResponse(BaseModel):
    id: str
    title: str
    description: str | None = None
    completed: bool


class MarkAsCompletedTodoHandler:
    def __init__(self, mark_as_completed_usecase: MarkAsCompletedTodoUsecase) -> None:
        self.mark_as_completed_usecase = mark_as_completed_usecase

    def handle(self, id: UUID7) -> MarkAsCompletedTodoResponse:
        try:
            result = self.mark_as_completed_usecase.execute(MarkAsCompletedTodoUsecaseInput(id=id))
        except RepositoryNotFoundError:
            raise NotFoundError(message="Todo not found")
        except TodoAlreadyCompletedError:
            raise ConflictError(message="Todo is already completed")
        return MarkAsCompletedTodoResponse(
            id=str(result.todo.id),
            title=result.todo.title,
            description=result.todo.description,
            completed=result.todo.completed,
        )
