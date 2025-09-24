from dataclasses import dataclass

from fastapi import APIRouter, Body, Path

from todo_api.presentation.handler.create_todo_handler import (
    CreateTodoHandler,
    CreateTodoRequest,
    CreateTodoResponse,
)
from todo_api.presentation.handler.delete_todo_handler import DeleteTodoHandler
from todo_api.presentation.handler.get_all_todos_handler import (
    GetAllTodosHandler,
    GetAllTodosResponse,
)
from todo_api.presentation.handler.get_todo_handler import GetTodoHandler, GetTodoResponse
from todo_api.presentation.handler.mark_as_completed_todo_handler import (
    MarkAsCompletedTodoHandler,
    MarkAsCompletedTodoResponse,
)
from todo_api.presentation.handler.mark_as_uncompleted_todo_handler import (
    MarkAsUnCompletedTodoHandler,
    MarkAsUnCompletedTodoResponse,
)
from todo_api.presentation.handler.update_todo_handler import (
    UpdateTodoHandler,
    UpdateTodoRequest,
    UpdateTodoResponse,
)
from todo_api.utils.uuid import UUID7


@dataclass
class TodoRouterContainer:
    create_todo: CreateTodoHandler
    delete_todo: DeleteTodoHandler
    get_all_todos: GetAllTodosHandler
    get_todo: GetTodoHandler
    mark_as_completed_todo: MarkAsCompletedTodoHandler
    mark_as_uncompleted_todo: MarkAsUnCompletedTodoHandler
    update_todo: UpdateTodoHandler


def router(container: TodoRouterContainer) -> APIRouter:
    api = APIRouter(prefix="/todos", tags=["todos"])

    @api.post("", response_model=CreateTodoResponse, status_code=201)
    def create_todo(request: CreateTodoRequest = Body()) -> CreateTodoResponse:  # pyright: ignore[reportUnusedFunction]
        return container.create_todo.handle(request)

    @api.delete("/{id}", response_model=None, status_code=204)
    def delete_todo(id: UUID7 = Path(...)) -> None:  # pyright: ignore[reportUnusedFunction]
        container.delete_todo.handle(id)
        return None

    @api.get("", response_model=GetAllTodosResponse)
    def get_all_todos() -> GetAllTodosResponse:  # pyright: ignore[reportUnusedFunction]
        return container.get_all_todos.handle()

    @api.get("/{id}", response_model=GetTodoResponse)
    def get_todo(id: UUID7 = Path(...)) -> GetTodoResponse:  # pyright: ignore[reportUnusedFunction]
        return container.get_todo.handle(id)

    @api.put("/{id}/complete", response_model=MarkAsCompletedTodoResponse)
    def mark_as_completed_todo(id: UUID7 = Path(...)) -> MarkAsCompletedTodoResponse:  # pyright: ignore[reportUnusedFunction]
        return container.mark_as_completed_todo.handle(id)

    @api.put("/{id}/uncomplete", response_model=MarkAsUnCompletedTodoResponse)
    def mark_as_uncompleted_todo(id: UUID7 = Path(...)) -> MarkAsUnCompletedTodoResponse:  # pyright: ignore[reportUnusedFunction]
        return container.mark_as_uncompleted_todo.handle(id)

    @api.put("/{id}", response_model=UpdateTodoResponse)
    def update_todo(  # pyright: ignore[reportUnusedFunction]
        id: UUID7 = Path(...), request: UpdateTodoRequest = Body()
    ) -> UpdateTodoResponse:
        return container.update_todo.handle(id, request)

    return api
