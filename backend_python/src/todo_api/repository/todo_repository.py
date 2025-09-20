from abc import ABC, abstractmethod

from backend_python.domain.model import Todo


class TodoRepository(ABC):
    @abstractmethod
    def find_all(self):
        pass

    @abstractmethod
    def find_by_id(self, todo_id: int):
        pass

    @abstractmethod
    def save(self, todo: Todo):
        pass

    @abstractmethod
    def delete(self, todo: Todo):
        pass
