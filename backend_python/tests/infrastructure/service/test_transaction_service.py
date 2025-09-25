from __future__ import annotations

from uuid import uuid4

import pytest
from sqlalchemy import Engine, Table, insert, select
from sqlalchemy.orm import Session

from todo_api.infrastructure.repository.context_provider import ContextProviderImpl
from todo_api.infrastructure.service.transaction_service import TransactionServiceImpl


@pytest.fixture()
def context_provider(mysql_engine: Engine) -> ContextProviderImpl:
    return ContextProviderImpl(engine=mysql_engine)


@pytest.fixture()
def transaction_service(context_provider: ContextProviderImpl) -> TransactionServiceImpl:
    return TransactionServiceImpl(context_provider)


def test_run_commits_on_success(
    transaction_service: TransactionServiceImpl,
    context_provider: ContextProviderImpl,
    mysql_engine: Engine,
    infrastructure_test_table: Table,
) -> None:
    value = f"commit-{uuid4()}"

    def persist() -> None:
        session = context_provider.current()
        session.execute(insert(infrastructure_test_table).values(scope="impl", value=value))

    transaction_service.Run(persist)

    with Session(mysql_engine) as check_session:
        stored = check_session.execute(
            select(infrastructure_test_table.c.value).where(
                infrastructure_test_table.c.value == value
            )
        ).scalar_one_or_none()

    assert stored == value


def test_run_rolls_back_on_exception(
    transaction_service: TransactionServiceImpl,
    context_provider: ContextProviderImpl,
    mysql_engine: Engine,
    infrastructure_test_table: Table,
) -> None:
    value = f"rollback-{uuid4()}"

    def failing() -> None:
        session = context_provider.current()
        session.execute(insert(infrastructure_test_table).values(scope="impl", value=value))
        raise RuntimeError("boom")

    with pytest.raises(RuntimeError):
        transaction_service.Run(failing)

    with Session(mysql_engine) as check_session:
        stored = check_session.execute(
            select(infrastructure_test_table.c.value).where(
                infrastructure_test_table.c.value == value
            )
        ).scalar_one_or_none()

    assert stored is None


def test_run_supports_nested_transactions(
    transaction_service: TransactionServiceImpl,
    context_provider: ContextProviderImpl,
    mysql_engine: Engine,
    infrastructure_test_table: Table,
) -> None:
    outer_before = f"outer-before-{uuid4()}"
    inner_value = f"inner-{uuid4()}"
    outer_after = f"outer-after-{uuid4()}"

    with context_provider.transaction() as outer_session:
        outer_session.execute(
            insert(infrastructure_test_table).values(scope="outer", value=outer_before)
        )

        def nested() -> None:
            session = context_provider.current()
            session.execute(
                insert(infrastructure_test_table).values(scope="inner", value=inner_value)
            )
            raise RuntimeError("nested rollback")

        with pytest.raises(RuntimeError):
            transaction_service.Run(nested)

        inner_rows = (
            outer_session.execute(
                select(infrastructure_test_table.c.value).where(
                    infrastructure_test_table.c.scope == "inner"
                )
            )
            .scalars()
            .all()
        )
        assert inner_rows == []

        outer_session.execute(
            insert(infrastructure_test_table).values(scope="outer", value=outer_after)
        )

    with Session(mysql_engine) as check_session:
        outer_rows = (
            check_session.execute(
                select(infrastructure_test_table.c.value).where(
                    infrastructure_test_table.c.scope == "outer"
                )
            )
            .scalars()
            .all()
        )
        inner_rows = (
            check_session.execute(
                select(infrastructure_test_table.c.value).where(
                    infrastructure_test_table.c.scope == "inner"
                )
            )
            .scalars()
            .all()
        )

    assert set(outer_rows) == {outer_before, outer_after}
    assert inner_rows == []
