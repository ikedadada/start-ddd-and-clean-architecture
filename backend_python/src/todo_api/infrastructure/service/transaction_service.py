from collections.abc import Callable
from typing import TypeVar

from todo_api.application_service.service.transaction_service import TransactionService

T = TypeVar("T")


class TransactionServiceImpl(TransactionService):
    def __init__(self) -> None:
        pass

    def Run(self, func: Callable[[], T]) -> T:
        # In a real implementation, you would start a transaction here
        try:
            result = func()
            # Commit the transaction here if everything went well
            return result
        except Exception as e:
            # Rollback the transaction in case of an error
            raise e
