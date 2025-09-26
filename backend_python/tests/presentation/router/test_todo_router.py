from __future__ import annotations

from dataclasses import dataclass

from fastapi import FastAPI
from fastapi.testclient import TestClient

from todo_api.application_service.usecase.create_todo_usecase import (
    CreateTodoUsecase,
    CreateTodoUsecaseInput,
    CreateTodoUsecaseOutput,
)
from todo_api.application_service.usecase.delete_todo_usecase import (
    DeleteTodoUsecase,
    DeleteTodoUsecaseInput,
    DeleteTodoUsecaseOutput,
)
from todo_api.application_service.usecase.get_all_todos_usecase import (
    GetAllTodosUsecase,
    GetAllTodosUsecaseInput,
    GetAllTodosUsecaseOutput,
)
from todo_api.application_service.usecase.get_todo_usecase import (
    GetTodoUsecase,
    GetTodoUsecaseInput,
    GetTodoUsecaseOutput,
)
from todo_api.application_service.usecase.mark_as_completed_todo_usecase import (
    MarkAsCompletedTodoUsecase,
    MarkAsCompletedTodoUsecaseInput,
    MarkAsCompletedTodoUsecaseOutput,
)
from todo_api.application_service.usecase.mark_as_uncompleted_todo_usecase import (
    MarkAsUncompletedTodoUsecase,
    MarkAsUncompletedTodoUsecaseInput,
    MarkAsUncompletedTodoUsecaseOutput,
)
from todo_api.application_service.usecase.update_todo_usecase import (
    UpdateTodoUsecase,
    UpdateTodoUsecaseInput,
    UpdateTodoUsecaseOutput,
)
from todo_api.domain.model.todo import Todo, TodoDTO
from todo_api.presentation.handler.create_todo_handler import CreateTodoHandler
from todo_api.presentation.handler.delete_todo_handler import DeleteTodoHandler
from todo_api.presentation.handler.get_all_todos_handler import GetAllTodosHandler
from todo_api.presentation.handler.get_todo_handler import GetTodoHandler
from todo_api.presentation.handler.mark_as_completed_todo_handler import MarkAsCompletedTodoHandler
from todo_api.presentation.handler.mark_as_uncompleted_todo_handler import (
    MarkAsUnCompletedTodoHandler,
)
from todo_api.presentation.handler.update_todo_handler import UpdateTodoHandler
from todo_api.presentation.router.todo_router import TodoRouterContainer, router
from todo_api.utils.uuid import uuid7


class RecordingCreateTodoUsecase(CreateTodoUsecase):
    def __init__(self) -> None:
        self.calls: list[CreateTodoUsecaseInput] = []
        self.todo = make_todo("created", description="desc")

    def execute(self, input_dto: CreateTodoUsecaseInput) -> CreateTodoUsecaseOutput:
        self.calls.append(input_dto)
        return CreateTodoUsecaseOutput(todo=self.todo)


class RecordingGetAllTodosUsecase(GetAllTodosUsecase):
    def __init__(self, todos: list[Todo] | None = None) -> None:
        self.calls: list[GetAllTodosUsecaseInput] = []
        self.todos = todos or []

    def execute(self, input_dto: GetAllTodosUsecaseInput) -> GetAllTodosUsecaseOutput:
        self.calls.append(input_dto)
        return GetAllTodosUsecaseOutput(todos=self.todos)


class RecordingGetTodoUsecase(GetTodoUsecase):
    def __init__(self, todo: Todo) -> None:
        self.todo = todo
        self.calls: list[GetTodoUsecaseInput] = []

    def execute(self, input_dto: GetTodoUsecaseInput) -> GetTodoUsecaseOutput:
        self.calls.append(input_dto)
        return GetTodoUsecaseOutput(todo=self.todo)


class RecordingMarkAsCompletedTodoUsecase(MarkAsCompletedTodoUsecase):
    def __init__(self, todo: Todo) -> None:
        self.todo = todo
        self.calls: list[MarkAsCompletedTodoUsecaseInput] = []

    def execute(
        self, input_dto: MarkAsCompletedTodoUsecaseInput
    ) -> MarkAsCompletedTodoUsecaseOutput:
        self.calls.append(input_dto)
        if not self.todo.completed:
            self.todo.mark_as_completed()
        return MarkAsCompletedTodoUsecaseOutput(todo=self.todo)


class RecordingMarkAsUncompletedTodoUsecase(MarkAsUncompletedTodoUsecase):
    def __init__(self, todo: Todo) -> None:
        self.todo = todo
        self.calls: list[MarkAsUncompletedTodoUsecaseInput] = []

    def execute(
        self, input_dto: MarkAsUncompletedTodoUsecaseInput
    ) -> MarkAsUncompletedTodoUsecaseOutput:
        self.calls.append(input_dto)
        if self.todo.completed:
            self.todo.mark_as_uncompleted()
        return MarkAsUncompletedTodoUsecaseOutput(todo=self.todo)


class RecordingUpdateTodoUsecase(UpdateTodoUsecase):
    def __init__(self, todo: Todo) -> None:
        self.todo = todo
        self.calls: list[UpdateTodoUsecaseInput] = []

    def execute(self, input_dto: UpdateTodoUsecaseInput) -> UpdateTodoUsecaseOutput:
        self.calls.append(input_dto)
        self.todo.update(title=input_dto.title, description=input_dto.description)
        return UpdateTodoUsecaseOutput(todo=self.todo)


class RecordingDeleteTodoUsecase(DeleteTodoUsecase):
    def __init__(self) -> None:
        self.calls: list[DeleteTodoUsecaseInput] = []

    def execute(self, input_dto: DeleteTodoUsecaseInput) -> DeleteTodoUsecaseOutput:
        self.calls.append(input_dto)
        return DeleteTodoUsecaseOutput()


@dataclass
class RouterSuite:
    create: RecordingCreateTodoUsecase
    delete: RecordingDeleteTodoUsecase
    get_all: RecordingGetAllTodosUsecase
    get: RecordingGetTodoUsecase
    mark_completed: RecordingMarkAsCompletedTodoUsecase
    mark_uncompleted: RecordingMarkAsUncompletedTodoUsecase
    update: RecordingUpdateTodoUsecase


def make_todo(
    title: str,
    *,
    description: str | None = None,
    completed: bool = False,
    identifier: str | None = None,
) -> Todo:
    dto = TodoDTO(
        id=identifier or str(uuid7()),
        title=title,
        description=description,
        completed=completed,
    )
    return Todo.from_dto(dto)


def build_suite() -> RouterSuite:
    return RouterSuite(
        create=RecordingCreateTodoUsecase(),
        delete=RecordingDeleteTodoUsecase(),
        get_all=RecordingGetAllTodosUsecase(),
        get=RecordingGetTodoUsecase(make_todo("detail")),
        mark_completed=RecordingMarkAsCompletedTodoUsecase(make_todo("complete")),
        mark_uncompleted=RecordingMarkAsUncompletedTodoUsecase(
            make_todo("uncomplete", completed=True)
        ),
        update=RecordingUpdateTodoUsecase(make_todo("update", description="before")),
    )


def build_client(suite: RouterSuite) -> TestClient:
    app = FastAPI()
    container = TodoRouterContainer(
        create_todo=CreateTodoHandler(suite.create),
        delete_todo=DeleteTodoHandler(suite.delete),
        get_all_todos=GetAllTodosHandler(suite.get_all),
        get_todo=GetTodoHandler(suite.get),
        mark_as_completed_todo=MarkAsCompletedTodoHandler(suite.mark_completed),
        mark_as_uncompleted_todo=MarkAsUnCompletedTodoHandler(suite.mark_uncompleted),
        update_todo=UpdateTodoHandler(suite.update),
    )
    app.include_router(router(container))
    return TestClient(app)


def test_create_todo_route_delegates_to_usecase() -> None:
    suite = build_suite()
    client = build_client(suite)

    payload = {"title": "new", "description": "d"}
    response = client.post("/todos", json=payload)

    assert response.status_code == 201
    assert len(suite.create.calls) == 1
    create_input = suite.create.calls[0]
    assert create_input.title == "new"
    assert create_input.description == "d"

    body = response.json()
    assert body["id"] == str(suite.create.todo.id)
    assert body["title"] == suite.create.todo.title


def test_get_all_route_returns_handler_response() -> None:
    suite = build_suite()
    suite.get_all.todos = [
        make_todo("first"),
        make_todo("second", description="more", completed=True),
    ]
    client = build_client(suite)

    response = client.get("/todos")

    assert response.status_code == 200
    payload = response.json()
    assert len(payload["todos"]) == 2
    assert payload["todos"][1]["description"] == "more"
    assert len(suite.get_all.calls) == 1


def test_parameterized_routes_pass_id_and_body_to_usecases() -> None:
    suite = build_suite()
    todo_id = str(uuid7())
    suite.get.todo = make_todo("detail", identifier=todo_id)
    suite.mark_completed.todo = make_todo("complete", identifier=todo_id)
    suite.mark_uncompleted.todo = make_todo("uncomplete", identifier=todo_id, completed=True)
    suite.update.todo = make_todo("update", identifier=todo_id, description="before")
    client = build_client(suite)

    client.get(f"/todos/{todo_id}")
    client.put(f"/todos/{todo_id}/complete")
    client.put(f"/todos/{todo_id}/uncomplete")
    client.put(f"/todos/{todo_id}", json={"title": "new", "description": "desc"})
    client.delete(f"/todos/{todo_id}")

    assert len(suite.get.calls) == 1
    assert str(suite.get.calls[0].id) == todo_id

    assert len(suite.mark_completed.calls) == 1
    assert str(suite.mark_completed.calls[0].id) == todo_id
    assert suite.mark_completed.todo.completed is True

    assert len(suite.mark_uncompleted.calls) == 1
    assert str(suite.mark_uncompleted.calls[0].id) == todo_id
    assert suite.mark_uncompleted.todo.completed is False

    assert len(suite.update.calls) == 1
    update_input = suite.update.calls[0]
    assert str(update_input.id) == todo_id
    assert update_input.title == "new"
    assert update_input.description == "desc"
    assert suite.update.todo.title == "new"

    assert len(suite.delete.calls) == 1
    assert str(suite.delete.calls[0].id) == todo_id
