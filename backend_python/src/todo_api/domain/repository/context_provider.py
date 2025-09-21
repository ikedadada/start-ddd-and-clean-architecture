from abc import ABC, abstractmethod
from collections.abc import Callable
from typing import TypeVar

C = TypeVar("C")
T = TypeVar("T")


class ContextProvider[C](ABC):
    @abstractmethod
    def get(self) -> C:
        pass

    @abstractmethod
    def run_with(self, context: C, func: Callable[[], T]) -> T:
        pass
