from collections.abc import Awaitable, Callable

from fastapi import Request, Response
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware


class HTTPError(Exception):
    def __init__(self, status_code: int, message: str) -> None:
        self.status_code = status_code
        self.message = message


class NotFoundError(HTTPError):
    def __init__(self, message: str) -> None:
        super().__init__(status_code=404, message=message)


class ConflictError(HTTPError):
    def __init__(self, message: str) -> None:
        super().__init__(status_code=409, message=message)


class ErrorHandler(BaseHTTPMiddleware):
    async def dispatch(
        self, request: Request, call_next: Callable[[Request], Awaitable[Response]]
    ) -> Response:
        try:
            response = await call_next(request)
            return response
        except HTTPError as e:
            return JSONResponse(
                status_code=e.status_code,
                content={"code": str(e.status_code), "message": e.message},
            )
        except RequestValidationError as e:
            return JSONResponse(status_code=400, content={"code": "400", "message": str(e)})
        except Exception as e:
            # Here you can log the error or handle it as needed
            return JSONResponse(status_code=500, content={"code": "500", "message": str(e)})
