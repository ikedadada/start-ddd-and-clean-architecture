from abc import ABC, abstractmethod

from pydantic import BaseModel, ConfigDict

from todo_api.domain.model.todo import Todo
from todo_api.domain.repository.todo_repository import TodoRepository


class GetAllTodosUsecaseInput(BaseModel):
    pass


class GetAllTodosUsecaseOutput(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)

    todos: list[Todo]


class GetAllTodosUsecase(ABC):
    @abstractmethod
    def execute(self, input_dto: GetAllTodosUsecaseInput) -> GetAllTodosUsecaseOutput:
        pass


class GetAllTodosUsecaseImpl(GetAllTodosUsecase):
    def __init__(self, todo_repository: TodoRepository) -> None:
        self.todo_repository = todo_repository

    def execute(self, input_dto: GetAllTodosUsecaseInput) -> GetAllTodosUsecaseOutput:
        todos = self.todo_repository.find_all()
        return GetAllTodosUsecaseOutput(todos=todos)
