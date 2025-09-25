from collections.abc import Iterator
from contextlib import contextmanager
from contextvars import ContextVar

from fastapi import logger
from sqlalchemy import Engine
from sqlalchemy.orm import Session, sessionmaker

from todo_api.domain.repository.context_provider import ContextProvider


class ContextProviderImpl(ContextProvider[Session]):
    def __init__(self, engine: Engine) -> None:
        self._session_factory = sessionmaker(bind=engine, expire_on_commit=False)
        self._state: ContextVar[Session | None] = ContextVar("session_state", default=None)

    @contextmanager
    def transaction(self) -> Iterator[Session]:
        existing = self._state.get()
        if existing is not None:
            logger.logger.debug("Reusing existing session in nested transaction scope")
            with existing.begin_nested():
                yield existing
            return

        session = self._session_factory()
        logger.logger.info("Acquiring database session")
        token = self._state.set(session)
        try:
            with session.begin():
                yield session
        finally:
            self._state.reset(token)
            session.close()

    def current(self) -> Session:
        session = self._state.get()
        if session is None:
            raise RuntimeError("No active session. Use transaction() to acquire one.")
        return session
