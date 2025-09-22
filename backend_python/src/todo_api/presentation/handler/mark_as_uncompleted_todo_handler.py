from pydantic import BaseModel

from todo_api.application_service.usecase.mark_as_uncompleted_todo_usecase import (
    MarkAsUncompletedTodoUsecase,
    MarkAsUncompletedTodoUsecaseInput,
)
from todo_api.domain.model.errors import TodoNotCompletedError
from todo_api.domain.repository.errors import RepositoryNotFoundError
from todo_api.presentation.middleware.error_handler import ConflictError, NotFoundError
from todo_api.utils.uuid import UUID7


class MarkAsUnCompletedTodoResponse(BaseModel):
    id: str
    title: str
    description: str | None = None
    completed: bool


class MarkAsUnCompletedTodoHandler:
    def __init__(self, mark_as_uncompleted_usecase: MarkAsUncompletedTodoUsecase) -> None:
        self.mark_as_uncompleted_usecase = mark_as_uncompleted_usecase

    def handle(self, id: UUID7) -> MarkAsUnCompletedTodoResponse:
        try:
            result = self.mark_as_uncompleted_usecase.execute(
                MarkAsUncompletedTodoUsecaseInput(id=id)
            )
        except RepositoryNotFoundError:
            raise NotFoundError(message="Todo not found")
        except TodoNotCompletedError:
            raise ConflictError(message="Todo is not completed")
        return MarkAsUnCompletedTodoResponse(
            id=str(result.todo.id),
            title=result.todo.title,
            description=result.todo.description,
            completed=result.todo.completed,
        )
