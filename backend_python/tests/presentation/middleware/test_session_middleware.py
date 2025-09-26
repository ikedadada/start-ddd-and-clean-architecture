from typing import cast

from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from todo_api.domain.repository.context_provider import ContextProvider
from todo_api.presentation.middleware.session_middleware import SessionMiddleware


class FakeSession:
    def __init__(self) -> None:
        self.rollback_called = False
        self._in_transaction = False

    def begin(self) -> None:
        self._in_transaction = True

    def finish(self) -> None:
        self._in_transaction = False

    def in_transaction(self) -> bool:
        return self._in_transaction

    def rollback(self) -> None:
        self.rollback_called = True
        self._in_transaction = False


class FakeContextProvider(ContextProvider[Session]):
    class _Transaction:
        def __init__(self, provider: "FakeContextProvider") -> None:
            self.provider = provider

        def __enter__(self) -> Session:
            self.provider.enter_count += 1
            self.provider._session.begin()
            return cast(Session, self.provider._session)

        def __exit__(self, exc_type, exc, tb) -> bool:  # type: ignore[override]
            self.provider.exit_count += 1
            self.provider._session.finish()
            return False

    def __init__(self) -> None:
        self._session = FakeSession()
        self.enter_count = 0
        self.exit_count = 0

    def transaction(self) -> "FakeContextProvider._Transaction":
        return FakeContextProvider._Transaction(self)

    def current(self) -> Session:
        return cast(Session, self._session)

    @property
    def session(self) -> FakeSession:
        return self._session


def build_app(provider: FakeContextProvider) -> FastAPI:
    app = FastAPI()
    app.add_middleware(
        SessionMiddleware,
        context_provider=cast(ContextProvider[Session], provider),
    )

    @app.get("/success")
    async def success() -> JSONResponse:  # pyright: ignore[reportUnusedFunction]
        provider.current()
        return JSONResponse({"status": "ok"})

    @app.get("/failure")
    async def failure() -> JSONResponse:  # pyright: ignore[reportUnusedFunction]
        provider.current()
        return JSONResponse({"status": "fail"}, status_code=422)

    return app


def test_session_middleware_wraps_each_request_in_transaction() -> None:
    provider = FakeContextProvider()
    client = TestClient(build_app(provider))

    response = client.get("/success")

    assert response.status_code == 200
    assert provider.enter_count == 1
    assert provider.exit_count == 1
    assert provider.session.rollback_called is False


def test_session_middleware_rolls_back_on_client_error() -> None:
    provider = FakeContextProvider()
    client = TestClient(build_app(provider))

    response = client.get("/failure")

    assert response.status_code == 422
    assert provider.session.rollback_called is True
