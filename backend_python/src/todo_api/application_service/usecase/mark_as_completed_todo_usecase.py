from abc import ABC, abstractmethod
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from todo_api.application_service.service.transaction_service import TransactionService
from todo_api.domain.model.todo import Todo
from todo_api.domain.repository.todo_repository import TodoRepository


class MarkAsCompletedTodoUsecaseInput(BaseModel):
    id: UUID


class MarkAsCompletedTodoUsecaseOutput(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)

    todo: Todo


class MarkAsCompletedTodoUsecase(ABC):
    @abstractmethod
    def execute(
        self, input_dto: MarkAsCompletedTodoUsecaseInput
    ) -> MarkAsCompletedTodoUsecaseOutput:
        pass


class MarkAsCompletedTodoUsecaseImpl(MarkAsCompletedTodoUsecase):
    def __init__(
        self, todo_repository: TodoRepository, transaction_service: TransactionService
    ) -> None:
        self.todo_repository = todo_repository
        self.transaction_service = transaction_service

    def execute(
        self, input_dto: MarkAsCompletedTodoUsecaseInput
    ) -> MarkAsCompletedTodoUsecaseOutput:
        def func() -> MarkAsCompletedTodoUsecaseOutput:
            todo = self.todo_repository.find_by_id(input_dto.id)
            todo.mark_as_completed()
            self.todo_repository.save(todo)
            return MarkAsCompletedTodoUsecaseOutput(todo=todo)

        return self.transaction_service.Run(func)
