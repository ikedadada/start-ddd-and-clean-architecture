from __future__ import annotations

import pytest
from sqlalchemy import Engine, text

from todo_api.infrastructure.repository.context_provider import ContextProviderImpl


@pytest.fixture()
def context_provider(mysql_engine: Engine) -> ContextProviderImpl:
    return ContextProviderImpl(mysql_engine)


def test_session_context_sets_and_clears(context_provider: ContextProviderImpl) -> None:
    with pytest.raises(RuntimeError):
        context_provider.current()

    with context_provider.session() as session:
        assert context_provider.current() is session
        assert session.execute(text("SELECT 1")).scalar_one() == 1

    with pytest.raises(RuntimeError):
        context_provider.current()
