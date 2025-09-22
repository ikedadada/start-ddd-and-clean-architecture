from abc import ABC, abstractmethod

from pydantic import BaseModel, ConfigDict

from todo_api.domain.model.todo import Todo
from todo_api.domain.repository.todo_repository import TodoRepository
from todo_api.utils.uuid import UUID7


class GetTodoUsecaseInput(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    id: UUID7


class GetTodoUsecaseOutput(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)

    todo: Todo


class GetTodoUsecase(ABC):
    @abstractmethod
    def execute(self, input_dto: GetTodoUsecaseInput) -> GetTodoUsecaseOutput:
        pass


class GetTodoUsecaseImpl(GetTodoUsecase):
    def __init__(self, todo_repository: TodoRepository) -> None:
        self.todo_repository = todo_repository

    def execute(self, input_dto: GetTodoUsecaseInput) -> GetTodoUsecaseOutput:
        todo = self.todo_repository.find_by_id(input_dto.id)
        return GetTodoUsecaseOutput(todo=todo)
