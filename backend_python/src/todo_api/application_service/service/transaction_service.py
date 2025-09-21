from abc import ABC, abstractmethod
from collections.abc import Callable
from typing import TypeVar

T = TypeVar("T")


class TransactionService(ABC):
    @abstractmethod
    def Run(self, func: Callable[[], T]) -> T:
        pass
