from abc import ABC, abstractmethod
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from todo_api.application_service.service.transaction_service import TransactionService
from todo_api.domain.model.todo import Todo
from todo_api.domain.repository.todo_repository import TodoRepository


class MarkAsUncompletedTodoUsecaseInput(BaseModel):
    id: UUID


class MarkAsUncompletedTodoUsecaseOutput(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)

    todo: Todo


class MarkAsUncompletedTodoUsecase(ABC):
    @abstractmethod
    def execute(
        self, input_dto: MarkAsUncompletedTodoUsecaseInput
    ) -> MarkAsUncompletedTodoUsecaseOutput:
        pass


class MarkAsUncompletedTodoUsecaseImpl(MarkAsUncompletedTodoUsecase):
    def __init__(
        self, todo_repository: TodoRepository, transaction_service: TransactionService
    ) -> None:
        self.todo_repository = todo_repository
        self.transaction_service = transaction_service

    def execute(
        self, input_dto: MarkAsUncompletedTodoUsecaseInput
    ) -> MarkAsUncompletedTodoUsecaseOutput:
        def func() -> MarkAsUncompletedTodoUsecaseOutput:
            todo = self.todo_repository.find_by_id(input_dto.id)
            todo.mark_as_uncompleted()
            self.todo_repository.save(todo)
            return MarkAsUncompletedTodoUsecaseOutput(todo=todo)

        return self.transaction_service.Run(func)
