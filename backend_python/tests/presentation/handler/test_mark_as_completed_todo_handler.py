import pytest

from todo_api.application_service.usecase.mark_as_completed_todo_usecase import (
    MarkAsCompletedTodoUsecase,
    MarkAsCompletedTodoUsecaseInput,
    MarkAsCompletedTodoUsecaseOutput,
)
from todo_api.domain.model.errors import TodoAlreadyCompletedError
from todo_api.domain.model.todo import Todo
from todo_api.domain.repository.errors import RepositoryNotFoundError
from todo_api.presentation.handler.mark_as_completed_todo_handler import (
    MarkAsCompletedTodoHandler,
)
from todo_api.presentation.middleware.error_handler import ConflictError, NotFoundError
from todo_api.utils.uuid import UUID7


class StubMarkAsCompletedUsecase(MarkAsCompletedTodoUsecase):
    def __init__(self, todo: Todo | None = None, *, raises: Exception | None = None) -> None:
        self.todo = todo
        self.raises = raises
        self.received_input: MarkAsCompletedTodoUsecaseInput | None = None

    def execute(
        self, input_dto: MarkAsCompletedTodoUsecaseInput
    ) -> MarkAsCompletedTodoUsecaseOutput:
        if self.raises is not None:
            raise self.raises
        self.received_input = input_dto
        assert self.todo is not None
        return MarkAsCompletedTodoUsecaseOutput(todo=self.todo)


def test_handle_returns_updated_todo() -> None:
    todo = Todo(title="ship")
    usecase = StubMarkAsCompletedUsecase(todo=todo)
    handler = MarkAsCompletedTodoHandler(mark_as_completed_usecase=usecase)
    todo_id: UUID7 = todo.id

    response = handler.handle(todo_id)

    assert usecase.received_input == MarkAsCompletedTodoUsecaseInput(id=todo_id)
    assert response.id == str(todo.id)


def test_handle_raises_not_found_when_repository_missing() -> None:
    todo_id = Todo(title="temp").id
    handler = MarkAsCompletedTodoHandler(
        mark_as_completed_usecase=StubMarkAsCompletedUsecase(
            raises=RepositoryNotFoundError("missing")
        )
    )

    with pytest.raises(NotFoundError):
        handler.handle(todo_id)


def test_handle_raises_conflict_when_already_completed() -> None:
    todo_id = Todo(title="temp").id
    handler = MarkAsCompletedTodoHandler(
        mark_as_completed_usecase=StubMarkAsCompletedUsecase(raises=TodoAlreadyCompletedError())
    )

    with pytest.raises(ConflictError):
        handler.handle(todo_id)
