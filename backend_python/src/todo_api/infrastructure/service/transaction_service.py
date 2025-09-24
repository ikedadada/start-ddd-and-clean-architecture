from collections.abc import Callable
from typing import TypeVar

from sqlalchemy.orm import Session

from todo_api.application_service.service.transaction_service import TransactionService
from todo_api.domain.repository.context_provider import ContextProvider

T = TypeVar("T")


class TransactionServiceImpl(TransactionService):
    def __init__(self, context_provider: ContextProvider[Session]) -> None:
        self.context_provider = context_provider

    def Run(self, func: Callable[[], T]) -> T:
        with self.context_provider.session() as session:
            with self.context_provider.use(session):
                try:
                    begin_ctx = (
                        session.begin_nested() if session.in_transaction() else session.begin()
                    )
                    with begin_ctx:
                        result = func()
                except Exception:
                    self.context_provider.mark_failure()
                    raise
                else:
                    self.context_provider.mark_success()
                    return result
