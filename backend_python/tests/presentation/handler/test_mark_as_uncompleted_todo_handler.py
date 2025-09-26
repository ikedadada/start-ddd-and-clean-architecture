import pytest

from todo_api.application_service.usecase.mark_as_uncompleted_todo_usecase import (
    MarkAsUncompletedTodoUsecase,
    MarkAsUncompletedTodoUsecaseInput,
    MarkAsUncompletedTodoUsecaseOutput,
)
from todo_api.domain.model.errors import TodoNotCompletedError
from todo_api.domain.model.todo import Todo
from todo_api.domain.repository.errors import RepositoryNotFoundError
from todo_api.presentation.handler.mark_as_uncompleted_todo_handler import (
    MarkAsUnCompletedTodoHandler,
)
from todo_api.presentation.middleware.error_handler import ConflictError, NotFoundError
from todo_api.utils.uuid import UUID7


class StubMarkAsUncompletedUsecase(MarkAsUncompletedTodoUsecase):
    def __init__(self, todo: Todo | None = None, *, raises: Exception | None = None) -> None:
        self.todo = todo
        self.raises = raises
        self.received_input: MarkAsUncompletedTodoUsecaseInput | None = None

    def execute(
        self, input_dto: MarkAsUncompletedTodoUsecaseInput
    ) -> MarkAsUncompletedTodoUsecaseOutput:
        if self.raises is not None:
            raise self.raises
        self.received_input = input_dto
        assert self.todo is not None
        return MarkAsUncompletedTodoUsecaseOutput(todo=self.todo)


def test_handle_returns_updated_todo() -> None:
    todo = Todo(title="resume")
    usecase = StubMarkAsUncompletedUsecase(todo=todo)
    handler = MarkAsUnCompletedTodoHandler(mark_as_uncompleted_usecase=usecase)
    todo_id: UUID7 = todo.id

    response = handler.handle(todo_id)

    assert usecase.received_input == MarkAsUncompletedTodoUsecaseInput(id=todo_id)
    assert response.id == str(todo.id)


def test_handle_raises_not_found_when_repository_missing() -> None:
    todo_id = Todo(title="temp").id
    handler = MarkAsUnCompletedTodoHandler(
        mark_as_uncompleted_usecase=StubMarkAsUncompletedUsecase(
            raises=RepositoryNotFoundError("missing")
        )
    )

    with pytest.raises(NotFoundError):
        handler.handle(todo_id)


def test_handle_raises_conflict_when_not_completed() -> None:
    todo_id = Todo(title="temp").id
    handler = MarkAsUnCompletedTodoHandler(
        mark_as_uncompleted_usecase=StubMarkAsUncompletedUsecase(raises=TodoNotCompletedError())
    )

    with pytest.raises(ConflictError):
        handler.handle(todo_id)
