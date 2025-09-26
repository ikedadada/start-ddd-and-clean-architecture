from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.testclient import TestClient

from todo_api.presentation.middleware.error_handler import (
    ConflictError,
    ErrorHandler,
    NotFoundError,
)


def build_app() -> FastAPI:
    app = FastAPI()
    app.add_middleware(ErrorHandler)

    @app.get("/ok")
    async def ok() -> JSONResponse:  # pyright: ignore[reportUnusedFunction]
        return JSONResponse({"status": "ok"})

    @app.get("/not-found")
    async def not_found() -> JSONResponse:  # pyright: ignore[reportUnusedFunction]
        raise NotFoundError("missing")

    @app.get("/conflict")
    async def conflict() -> JSONResponse:  # pyright: ignore[reportUnusedFunction]
        raise ConflictError("busy")

    @app.get("/unexpected")
    async def unexpected() -> JSONResponse:  # pyright: ignore[reportUnusedFunction]
        raise RuntimeError("boom")

    return app


def test_error_handler_passes_through_success_response() -> None:
    client = TestClient(build_app())

    response = client.get("/ok")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_error_handler_converts_known_http_errors() -> None:
    client = TestClient(build_app())

    response = client.get("/conflict")

    assert response.status_code == 409
    assert response.json() == {"code": "409", "message": "busy"}


def test_error_handler_converts_not_found_error() -> None:
    client = TestClient(build_app())

    response = client.get("/not-found")

    assert response.status_code == 404
    assert response.json() == {"code": "404", "message": "missing"}


def test_error_handler_returns_internal_server_error_for_unexpected_exception() -> None:
    client = TestClient(build_app())

    response = client.get("/unexpected")

    assert response.status_code == 500
    assert response.json() == {"code": "500", "message": "Internal server error"}
