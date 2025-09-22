from pydantic import BaseModel

from todo_api.application_service.usecase.delete_todo_usecase import (
    DeleteTodoUsecase,
    DeleteTodoUsecaseInput,
)
from todo_api.domain.repository.errors import RepositoryNotFoundError
from todo_api.presentation.middleware.error_handler import NotFoundError
from todo_api.utils.uuid import UUID7


class DeleteTodoResponse(BaseModel):
    pass


class DeleteTodoHandler:
    def __init__(self, delete_todo_usecase: DeleteTodoUsecase) -> None:
        self.delete_todo_usecase = delete_todo_usecase

    def handle(self, id: UUID7) -> DeleteTodoResponse:
        try:
            self.delete_todo_usecase.execute(DeleteTodoUsecaseInput(id=id))
        except RepositoryNotFoundError:
            raise NotFoundError(message="Todo not found")
        return DeleteTodoResponse()
