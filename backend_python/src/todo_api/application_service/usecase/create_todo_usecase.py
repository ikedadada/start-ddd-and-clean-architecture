from abc import ABC, abstractmethod

from pydantic import BaseModel, ConfigDict

from todo_api.domain.model.todo import Todo
from todo_api.domain.repository.todo_repository import TodoRepository


class CreateTodoUsecaseInput(BaseModel):
    title: str
    description: str | None


class CreateTodoUsecaseOutput(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)

    todo: Todo


class CreateTodoUsecase(ABC):
    @abstractmethod
    def execute(self, input_dto: CreateTodoUsecaseInput) -> CreateTodoUsecaseOutput:
        pass


class CreateTodoUsecaseImpl(CreateTodoUsecase):
    def __init__(self, todo_repository: TodoRepository) -> None:
        """
        This use case performs a single write, so we rely on the session management
        layer to control the transaction boundary instead of injecting TransactionService.
        """
        self.todo_repository = todo_repository

    def execute(self, input_dto: CreateTodoUsecaseInput) -> CreateTodoUsecaseOutput:
        todo = Todo(title=input_dto.title, description=input_dto.description)
        self.todo_repository.save(todo)
        return CreateTodoUsecaseOutput(todo=todo)
