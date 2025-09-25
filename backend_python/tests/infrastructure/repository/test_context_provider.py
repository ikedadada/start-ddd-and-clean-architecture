from __future__ import annotations

import pytest
from sqlalchemy import Engine, text

from todo_api.infrastructure.repository.context_provider import ContextProviderImpl


@pytest.fixture()
def context_provider(mysql_engine: Engine) -> ContextProviderImpl:
    return ContextProviderImpl(mysql_engine)


def test_current_raises_without_active_transaction(context_provider: ContextProviderImpl) -> None:
    with pytest.raises(RuntimeError):
        context_provider.current()


def test_transaction_binds_session(context_provider: ContextProviderImpl) -> None:
    with context_provider.transaction() as session:
        assert context_provider.current() is session
        assert session.execute(text("SELECT 1")).scalar_one() == 1


def test_transaction_clears_current_after_exit(context_provider: ContextProviderImpl) -> None:
    with context_provider.transaction():
        assert context_provider.current() is not None

    with pytest.raises(RuntimeError):
        context_provider.current()
