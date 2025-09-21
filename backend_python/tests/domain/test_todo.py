from __future__ import annotations

import pytest
from uuid_utils import UUID, uuid7

from todo_api.domain.model.errors import TodoAlreadyCompletedError, TodoNotCompletedError
from todo_api.domain.model.todo import Todo, TodoDTO


def test_new_todo_has_uuid_and_defaults():
    todo = Todo(title="write tests", description="cover domain logic")

    assert isinstance(todo.id, UUID)
    assert todo.title == "write tests"
    assert todo.description == "cover domain logic"
    assert not todo.completed


def test_update_changes_title_and_description():
    todo = Todo(title="draft", description="first version")

    todo.update(title="final", description="ready to ship")

    assert todo.title == "final"
    assert todo.description == "ready to ship"


def test_mark_completed_sets_flag():
    todo = Todo(title="deploy")

    todo.mark_as_completed()

    assert todo.completed


def test_mark_completed_twice_raises():
    todo = Todo(title="deploy")
    todo.mark_as_completed()

    with pytest.raises(TodoAlreadyCompletedError):
        todo.mark_as_completed()


def test_mark_uncompleted_without_being_completed_raises():
    todo = Todo(title="verify")

    with pytest.raises(TodoNotCompletedError):
        todo.mark_as_uncompleted()


def test_mark_uncompleted_transitions_back_to_false():
    todo = Todo(title="verify")
    todo.mark_as_completed()

    todo.mark_as_uncompleted()

    assert not todo.completed


def test_to_dto_serializes_current_state():
    todo = Todo(title="document", description="update README")
    todo.mark_as_completed()

    dto = todo.to_dto()

    assert dto.id == str(todo.id)
    assert dto.title == todo.title
    assert dto.description == todo.description
    assert dto.completed


def test_from_dto_restores_state_without_generating_new_id():
    dto = TodoDTO(
        id=str(uuid7()),
        title="restore",
        description="from persistence",
        completed=True,
    )

    todo = Todo.from_dto(dto)

    assert todo.id == UUID(dto.id)
    assert todo.title == dto.title
    assert todo.description == dto.description
    assert todo.completed


def test_id_property_is_read_only():
    todo = Todo(title="immutable id")

    with pytest.raises(AttributeError):
        setattr(todo, "id", uuid7())


def test_title_property_is_read_only():
    todo = Todo(title="title")

    with pytest.raises(AttributeError):
        setattr(todo, "title", "hijack")
