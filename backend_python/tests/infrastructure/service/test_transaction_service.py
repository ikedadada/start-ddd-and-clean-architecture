from __future__ import annotations

from collections.abc import Iterator
from contextlib import contextmanager
from contextvars import ContextVar
from uuid import uuid4

import pytest
from sqlalchemy import Engine, insert
from sqlalchemy.orm import Session, sessionmaker

from todo_api.domain.repository.context_provider import ContextProvider
from todo_api.infrastructure.repository.data_model.todo import TodoDataModel
from todo_api.infrastructure.service.transaction_service import TransactionServiceImpl


class StubContextProvider(ContextProvider[Session]):
    def __init__(self, engine: Engine) -> None:
        self._session_factory = sessionmaker(bind=engine, expire_on_commit=False)
        self._session: ContextVar[Session | None] = ContextVar("stub_session", default=None)

    @contextmanager
    def session(self) -> Iterator[Session]:
        existing = self._session.get()
        if existing is not None:
            yield existing
            return

        session = self._session_factory()
        token = self._session.set(session)
        try:
            yield session
        finally:
            self._session.reset(token)
            session.close()
    def current(self) -> Session:
        session = self._session.get()
        if session is None:
            raise RuntimeError("No active session bound to context provider")
        return session

    def use(self, context: Session):
        @contextmanager
        def _use() -> Iterator[None]:
            token = self._session.set(context)
            try:
                yield
            finally:
                self._session.reset(token)

        return _use()


@pytest.fixture()
def stub_context_provider(mysql_engine: Engine) -> StubContextProvider:
    return StubContextProvider(mysql_engine)


@pytest.fixture()
def transaction_service(stub_context_provider: StubContextProvider) -> TransactionServiceImpl:
    return TransactionServiceImpl(stub_context_provider)


def test_transaction_service_commits_changes(
    stub_context_provider: StubContextProvider,
    transaction_service: TransactionServiceImpl,
) -> None:
    todo_data: dict[str, str | bool] = {
        "id": str(uuid4()),
        "title": "commit",
        "description": "persist via transaction",
        "completed": False,
    }

    def persist() -> None:
        session = stub_context_provider.current()
        session.execute(insert(TodoDataModel).values(**todo_data))

    transaction_service.Run(persist)

    with stub_context_provider.session() as session:
        stored = session.get(TodoDataModel, todo_data["id"])

    assert stored is not None
    assert stored.title == todo_data["title"]
    assert stored.description == todo_data["description"]
    assert stored.completed is todo_data["completed"]


def test_transaction_service_rolls_back_on_error(
    stub_context_provider: StubContextProvider,
    transaction_service: TransactionServiceImpl,
) -> None:
    todo_data: dict[str, str | bool] = {
        "id": str(uuid4()),
        "title": "rollback",
        "description": "should not persist",
        "completed": False,
    }

    def failing() -> None:
        session = stub_context_provider.current()
        session.execute(insert(TodoDataModel).values(**todo_data))
        raise RuntimeError("boom")

    with pytest.raises(RuntimeError):
        transaction_service.Run(failing)

    with stub_context_provider.session() as session:
        result = session.get(TodoDataModel, todo_data["id"])

    assert result is None
