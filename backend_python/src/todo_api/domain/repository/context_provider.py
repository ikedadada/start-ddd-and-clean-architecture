from abc import ABC, abstractmethod
from contextlib import AbstractContextManager
from typing import TypeVar

C = TypeVar("C")


class ContextProvider[C](ABC):
    @abstractmethod
    def transaction(self) -> AbstractContextManager[C]:
        """Return a transaction-scoped context manager bound to the current task."""

    @abstractmethod
    def current(self) -> C:
        """Return the active session bound to the current context."""
