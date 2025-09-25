from collections.abc import Awaitable, Callable
from types import FunctionType

from fastapi import Request, Response
from sqlalchemy.orm import Session
from starlette.middleware.base import BaseHTTPMiddleware

from todo_api.domain.repository.context_provider import ContextProvider


class SessionMiddleware(BaseHTTPMiddleware):
    """Bind a SQLAlchemy session to the request lifecycle."""

    def __init__(
        self,
        app: FunctionType,
        *,
        context_provider: ContextProvider[Session],
    ) -> None:
        super().__init__(app)
        self._context_provider = context_provider

    async def dispatch(
        self,
        request: Request,
        call_next: Callable[[Request], Awaitable[Response]],
    ) -> Response:
        with self._context_provider.transaction() as session:
            response = await call_next(request)
            if response.status_code >= 400 and session.in_transaction():
                session.rollback()
            return response
