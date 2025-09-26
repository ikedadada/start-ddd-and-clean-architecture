from os import environ

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy import create_engine

from todo_api.application_service.usecase.create_todo_usecase import CreateTodoUsecaseImpl
from todo_api.application_service.usecase.delete_todo_usecase import DeleteTodoUsecaseImpl
from todo_api.application_service.usecase.get_all_todos_usecase import GetAllTodosUsecaseImpl
from todo_api.application_service.usecase.get_todo_usecase import GetTodoUsecaseImpl
from todo_api.application_service.usecase.mark_as_completed_todo_usecase import (
    MarkAsCompletedTodoUsecaseImpl,
)
from todo_api.application_service.usecase.mark_as_uncompleted_todo_usecase import (
    MarkAsUncompletedTodoUsecaseImpl,
)
from todo_api.application_service.usecase.update_todo_usecase import UpdateTodoUsecaseImpl
from todo_api.infrastructure.repository.context_provider import ContextProviderImpl
from todo_api.infrastructure.repository.todo_repository import TodoRepositoryImpl
from todo_api.infrastructure.service.transaction_service import TransactionServiceImpl
from todo_api.presentation.handler.create_todo_handler import CreateTodoHandler
from todo_api.presentation.handler.delete_todo_handler import DeleteTodoHandler
from todo_api.presentation.handler.get_all_todos_handler import GetAllTodosHandler
from todo_api.presentation.handler.get_todo_handler import GetTodoHandler
from todo_api.presentation.handler.mark_as_completed_todo_handler import MarkAsCompletedTodoHandler
from todo_api.presentation.handler.mark_as_uncompleted_todo_handler import (
    MarkAsUnCompletedTodoHandler,
)
from todo_api.presentation.handler.update_todo_handler import UpdateTodoHandler
from todo_api.presentation.middleware.error_handler import ErrorHandler
from todo_api.presentation.middleware.session_middleware import SessionMiddleware
from todo_api.presentation.router.todo_router import TodoRouterContainer
from todo_api.presentation.router.todo_router import router as todo_router

app = FastAPI()
DATABASE_URL = environ.get("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL environment variable is required")
engine = create_engine(DATABASE_URL, echo=True)  # echo=True is for debugging

# Infrastructure layer services
context_provider = ContextProviderImpl(engine=engine)
todo_repository = TodoRepositoryImpl(context_provider=context_provider)
transaction_service = TransactionServiceImpl(context_provider=context_provider)

# Application layer use cases
create_todo_usecase = CreateTodoUsecaseImpl(todo_repository=todo_repository)
delete_todo_usecase = DeleteTodoUsecaseImpl(
    todo_repository=todo_repository, transaction_service=transaction_service
)
get_all_todos_usecase = GetAllTodosUsecaseImpl(todo_repository=todo_repository)
get_todo_usecase = GetTodoUsecaseImpl(todo_repository=todo_repository)
mark_as_completed_todo_usecase = MarkAsCompletedTodoUsecaseImpl(
    todo_repository=todo_repository, transaction_service=transaction_service
)
mark_as_uncompleted_todo_usecase = MarkAsUncompletedTodoUsecaseImpl(
    todo_repository=todo_repository, transaction_service=transaction_service
)
update_todo_usecase = UpdateTodoUsecaseImpl(
    todo_repository=todo_repository, transaction_service=transaction_service
)

# Presentation layer handlers
create_todo_handler = CreateTodoHandler(create_todo_usecase=create_todo_usecase)
delete_todo_handler = DeleteTodoHandler(delete_todo_usecase=delete_todo_usecase)
get_all_todos_handler = GetAllTodosHandler(get_all_todos_usecase=get_all_todos_usecase)
get_todo_handler = GetTodoHandler(get_todo_usecase=get_todo_usecase)
mark_as_completed_todo_handler = MarkAsCompletedTodoHandler(
    mark_as_completed_usecase=mark_as_completed_todo_usecase
)
mark_as_uncompleted_todo_handler = MarkAsUnCompletedTodoHandler(
    mark_as_uncompleted_usecase=mark_as_uncompleted_todo_usecase
)
update_todo_handler = UpdateTodoHandler(update_todo_usecase=update_todo_usecase)

# Router registration
todo_router_container = TodoRouterContainer(
    create_todo=create_todo_handler,
    delete_todo=delete_todo_handler,
    get_all_todos=get_all_todos_handler,
    get_todo=get_todo_handler,
    mark_as_completed_todo=mark_as_completed_todo_handler,
    mark_as_uncompleted_todo=mark_as_uncompleted_todo_handler,
    update_todo=update_todo_handler,
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    """Normalize request validation errors into our API error envelope.

    FastAPI validates requests before they hit middleware, so validation
    failures bypass ErrorHandler and return the default 422 response. We
    register an application-level exception handler here to keep 4xx responses
    consistent with the rest of our API (HTTP 400 with `code`/`message`)."""

    return JSONResponse(status_code=400, content={"code": "400", "message": str(exc)})


app.add_middleware(SessionMiddleware, context_provider=context_provider)
app.add_middleware(ErrorHandler)

app.include_router(todo_router(todo_router_container))


@app.get("/healthcheck")
def healthcheck():
    return "OK"
