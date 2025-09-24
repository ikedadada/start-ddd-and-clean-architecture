from __future__ import annotations

from collections.abc import Callable
from contextlib import contextmanager
from contextvars import ContextVar

import pytest
from sqlalchemy import insert
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker

from todo_api.domain.model.todo import Todo
from todo_api.domain.repository.context_provider import ContextProvider
from todo_api.domain.repository.errors import RepositoryNotFoundError
from todo_api.infrastructure.repository.data_model.todo import TodoDataModel
from todo_api.infrastructure.repository.todo_repository import TodoRepositoryImpl


class StubContextProvider(ContextProvider[Session]):
    def __init__(self, engine: Engine) -> None:
        self._session_factory = sessionmaker(bind=engine, expire_on_commit=False)
        self._session: ContextVar[Session | None] = ContextVar("stub_session", default=None)

    @contextmanager
    def session(self):
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

    @contextmanager
    def use(self, context: Session):
        token = self._session.set(context)
        try:
            yield
        finally:
            self._session.reset(token)


@pytest.fixture()
def stub_context_provider(mysql_engine: Engine) -> StubContextProvider:
    return StubContextProvider(mysql_engine)


@pytest.fixture()
def todo_repository(stub_context_provider: StubContextProvider) -> TodoRepositoryImpl:
    return TodoRepositoryImpl(stub_context_provider)


def run_in_transaction(provider: StubContextProvider, func: Callable[[], None]) -> None:
    with provider.session() as session:
        with provider.use(session):
            with session.begin():
                func()


def test_save_inserts_new_row(
    mysql_engine: Engine,
    stub_context_provider: StubContextProvider,
    todo_repository: TodoRepositoryImpl,
) -> None:
    todo = Todo(title="create")

    run_in_transaction(stub_context_provider, lambda: todo_repository.save(todo))

    with Session(mysql_engine) as session:
        stored = session.get(TodoDataModel, str(todo.id))

    assert stored is not None
    assert stored.title == "create"
    assert stored.completed is False


def test_save_updates_existing_row(
    mysql_engine: Engine,
    stub_context_provider: StubContextProvider,
    todo_repository: TodoRepositoryImpl,
) -> None:
    original = Todo(title="original", description="first")
    model = TodoDataModel.from_domain(original)

    with Session(mysql_engine) as session, session.begin():
        session.execute(
            insert(TodoDataModel).values(
                id=model.id,
                title=model.title,
                description=model.description,
                completed=model.completed,
            )
        )

    original.update(title="updated", description="second")
    original.mark_as_completed()

    run_in_transaction(stub_context_provider, lambda: todo_repository.save(original))

    with Session(mysql_engine) as session:
        stored = session.get(TodoDataModel, str(original.id))

    assert stored is not None
    assert stored.title == "updated"
    assert stored.description == "second"
    assert stored.completed is True


def test_find_all_returns_domain_objects(
    mysql_engine: Engine,
    todo_repository: TodoRepositoryImpl,
) -> None:
    todo = Todo(title="list")
    model = TodoDataModel.from_domain(todo)

    with Session(mysql_engine) as session, session.begin():
        session.execute(
            insert(TodoDataModel).values(
                id=model.id,
                title=model.title,
                description=model.description,
                completed=model.completed,
            )
        )

    todos = todo_repository.find_all()

    assert len(todos) == 1
    assert todos[0].id == todo.id


def test_find_by_id_returns_matching_todo(
    mysql_engine: Engine,
    todo_repository: TodoRepositoryImpl,
) -> None:
    todo = Todo(title="fetch")
    model = TodoDataModel.from_domain(todo)

    with Session(mysql_engine) as session, session.begin():
        session.execute(
            insert(TodoDataModel).values(
                id=model.id,
                title=model.title,
                description=model.description,
                completed=model.completed,
            )
        )

    fetched = todo_repository.find_by_id(todo.id)

    assert fetched.id == todo.id


def test_find_by_id_raises_when_missing(
    todo_repository: TodoRepositoryImpl,
) -> None:
    with pytest.raises(RepositoryNotFoundError):
        todo_repository.find_by_id(Todo(title="temp").id)


def test_delete_removes_row(
    mysql_engine: Engine,
    stub_context_provider: StubContextProvider,
    todo_repository: TodoRepositoryImpl,
) -> None:
    todo = Todo(title="remove")
    model = TodoDataModel.from_domain(todo)

    with mysql_engine.connect() as connection, connection.begin():
        connection.execute(
            insert(TodoDataModel).values(
                id=model.id,
                title=model.title,
                description=model.description,
                completed=model.completed,
            )
        )

    run_in_transaction(stub_context_provider, lambda: todo_repository.delete(todo))

    with pytest.raises(RepositoryNotFoundError):
        todo_repository.find_by_id(todo.id)
