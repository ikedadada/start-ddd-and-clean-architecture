from abc import ABC, abstractmethod
from contextlib import AbstractContextManager
from typing import TypeVar

C = TypeVar("C")


class ContextProvider[C](ABC):
    @abstractmethod
    def session(self) -> AbstractContextManager[C]:
        """Return a context manager that yields a session and manages its lifecycle."""

    @abstractmethod
    def current(self) -> C:
        """Return the active session bound to the current context."""

    @abstractmethod
    def use(self, context: C) -> AbstractContextManager[None]:
        """Bind the provided session to the current context within a with-block."""

    def mark_success(self) -> None:
        """Mark the current session scope as successful.

        Providers can override this to signal that an open transaction should
        be committed when the session scope ends. The default implementation is
        a no-op so custom implementations are not forced to manage transactional
        state."""

    def mark_failure(self) -> None:
        """Mark the current session scope as failed.

        Providers can override this to enforce a rollback when the session
        scope ends. The default implementation is a no-op."""
