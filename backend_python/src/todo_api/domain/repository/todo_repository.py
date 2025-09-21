from abc import ABC, abstractmethod
from uuid import UUID

from todo_api.domain.model.todo import Todo


class TodoRepository(ABC):
    @abstractmethod
    def find_all(self) -> list[Todo]:
        pass

    @abstractmethod
    def find_by_id(self, todo_id: UUID) -> Todo:
        pass

    @abstractmethod
    def save(self, todo: Todo) -> None:
        pass

    @abstractmethod
    def delete(self, todo: Todo) -> None:
        pass
