from collections.abc import Iterator
from contextlib import contextmanager
from contextvars import ContextVar
from dataclasses import dataclass

from fastapi import logger
from sqlalchemy import Engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.orm.session import SessionTransaction

from todo_api.domain.repository.context_provider import ContextProvider


@dataclass
class _SessionState:
    session: Session
    transaction: SessionTransaction
    success: bool = False


class ContextProviderImpl(ContextProvider[Session]):
    def __init__(self, engine: Engine) -> None:
        self._session_factory = sessionmaker(bind=engine, expire_on_commit=False)
        self._state: ContextVar[_SessionState | None] = ContextVar("session_state", default=None)

    @contextmanager
    def session(self) -> Iterator[Session]:
        state = self._state.get()
        if state is not None:
            yield state.session
            return

        session = self._session_factory()
        logger.logger.info("Acquiring database session")
        transaction = session.begin()
        state = _SessionState(session=session, transaction=transaction)
        token = self._state.set(state)
        try:
            yield session
        finally:
            txn = state.transaction
            try:
                if txn.is_active:
                    if state.success:
                        txn.commit()
                    else:
                        txn.rollback()
            finally:
                self._state.reset(token)
                session.close()

    def current(self) -> Session:
        state = self._state.get()
        if state is None:
            raise RuntimeError("No active session. Use session() to acquire one.")
        return state.session

    @contextmanager
    def use(self, context: Session):
        state = self._state.get()
        if state is None or state.session is not context:
            raise RuntimeError(
                "Attempted to bind a session that is not managed by ContextProviderImpl."
            )
        yield

    def mark_success(self) -> None:
        state = self._state.get()
        if state is None:
            raise RuntimeError("No active session to mark as successful.")
        state.success = True

    def mark_failure(self) -> None:
        state = self._state.get()
        if state is None:
            raise RuntimeError("No active session to mark as failed.")
        state.success = False
