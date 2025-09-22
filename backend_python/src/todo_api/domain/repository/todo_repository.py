from abc import ABC, abstractmethod

from todo_api.domain.model.todo import Todo
from todo_api.utils.uuid import UUID7


class TodoRepository(ABC):
    @abstractmethod
    def find_all(self) -> list[Todo]:
        pass

    @abstractmethod
    def find_by_id(self, todo_id: UUID7) -> Todo:
        pass

    @abstractmethod
    def save(self, todo: Todo) -> None:
        pass

    @abstractmethod
    def delete(self, todo: Todo) -> None:
        pass
