from collections.abc import Iterator

import pytest
from sqlalchemy import Column, Integer, MetaData, String, Table, create_engine, delete
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
    INFRA_TEST_METADATA.create_all(engine)
    try:
        yield engine
    finally:
        Base.metadata.drop_all(engine)
        INFRA_TEST_METADATA.drop_all(engine)
        engine.dispose()


INFRA_TEST_METADATA = MetaData()
INFRA_TEST_TABLE = Table(
    "infrastructure_test_records",
    INFRA_TEST_METADATA,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("scope", String(32), nullable=False),
    Column("value", String(128), nullable=False),
)


@pytest.fixture()
def infrastructure_test_table() -> Table:
    return INFRA_TEST_TABLE


@pytest.fixture(autouse=True)
def clean_tables(mysql_engine: Engine) -> Iterator[None]:
    with mysql_engine.connect() as connection:
        with connection.begin():
            connection.execute(delete(TodoDataModel))
            connection.execute(INFRA_TEST_TABLE.delete())
    yield
    with mysql_engine.connect() as connection:
        with connection.begin():
            connection.execute(delete(TodoDataModel))
            connection.execute(INFRA_TEST_TABLE.delete())
