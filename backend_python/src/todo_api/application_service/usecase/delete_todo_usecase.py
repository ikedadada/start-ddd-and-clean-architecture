from abc import ABC, abstractmethod
from uuid import UUID

from pydantic import BaseModel

from todo_api.application_service.service.transaction_service import TransactionService
from todo_api.domain.repository.todo_repository import TodoRepository


class DeleteTodoUsecaseInput(BaseModel):
    id: UUID


class DeleteTodoUsecaseOutput(BaseModel):
    pass


class DeleteTodoUsecase(ABC):
    @abstractmethod
    def execute(self, input_dto: DeleteTodoUsecaseInput) -> DeleteTodoUsecaseOutput:
        pass


class DeleteTodoUsecaseImpl(DeleteTodoUsecase):
    def __init__(
        self, todo_repository: TodoRepository, transaction_service: TransactionService
    ) -> None:
        self.todo_repository = todo_repository
        self.transaction_service = transaction_service

    def execute(self, input_dto: DeleteTodoUsecaseInput) -> DeleteTodoUsecaseOutput:
        def func() -> DeleteTodoUsecaseOutput:
            todo = self.todo_repository.find_by_id(input_dto.id)
            self.todo_repository.delete(todo)
            return DeleteTodoUsecaseOutput()

        return self.transaction_service.Run(func)
