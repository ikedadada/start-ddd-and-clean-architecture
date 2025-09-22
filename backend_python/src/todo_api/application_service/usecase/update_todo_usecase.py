from abc import ABC, abstractmethod

from pydantic import BaseModel, ConfigDict

from todo_api.application_service.service.transaction_service import TransactionService
from todo_api.domain.model.todo import Todo
from todo_api.domain.repository.todo_repository import TodoRepository
from todo_api.utils.uuid import UUID7


class UpdateTodoUsecaseInput(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    id: UUID7
    title: str
    description: str | None


class UpdateTodoUsecaseOutput(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)

    todo: Todo


class UpdateTodoUsecase(ABC):
    @abstractmethod
    def execute(self, input_dto: UpdateTodoUsecaseInput) -> UpdateTodoUsecaseOutput:
        pass


class UpdateTodoUsecaseImpl(UpdateTodoUsecase):
    def __init__(
        self, todo_repository: TodoRepository, transaction_service: TransactionService
    ) -> None:
        self.todo_repository = todo_repository
        self.transaction_service = transaction_service

    def execute(self, input_dto: UpdateTodoUsecaseInput) -> UpdateTodoUsecaseOutput:
        def func() -> UpdateTodoUsecaseOutput:
            todo = self.todo_repository.find_by_id(input_dto.id)
            todo.update(title=input_dto.title, description=input_dto.description)
            self.todo_repository.save(todo)
            return UpdateTodoUsecaseOutput(todo=todo)

        return self.transaction_service.Run(func)
