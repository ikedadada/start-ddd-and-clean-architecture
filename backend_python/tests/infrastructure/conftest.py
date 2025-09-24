from collections.abc import Iterator

import pytest
from sqlalchemy import create_engine, delete
from sqlalchemy.engine import Engine
from testcontainers.mysql import MySqlContainer

from todo_api.infrastructure.repository.data_model.base import Base
from todo_api.infrastructure.repository.data_model.todo import TodoDataModel


@pytest.fixture(scope="session")
def mysql_container() -> Iterator[MySqlContainer]:
    with MySqlContainer("mysql:8.4") as container:
        yield container


@pytest.fixture(scope="session")
def mysql_engine(mysql_container: MySqlContainer) -> Iterator[Engine]:
    connection_url = mysql_container.get_connection_url()
    connection_url = connection_url.replace("localhost", "127.0.0.1")
    engine = create_engine(connection_url)
    Base.metadata.create_all(engine)
    try:
        yield engine
    finally:
        Base.metadata.drop_all(engine)
        engine.dispose()


@pytest.fixture(autouse=True)
def clean_todos(mysql_engine: Engine) -> Iterator[None]:
    with mysql_engine.connect() as connection:
        with connection.begin():
            connection.execute(delete(TodoDataModel))
    yield
    with mysql_engine.connect() as connection:
        with connection.begin():
            connection.execute(delete(TodoDataModel))
