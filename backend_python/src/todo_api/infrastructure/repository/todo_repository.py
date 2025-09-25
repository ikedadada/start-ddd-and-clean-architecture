from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from todo_api.domain.model.todo import Todo
from todo_api.domain.repository.context_provider import ContextProvider
from todo_api.domain.repository.errors import RepositoryNotFoundError
from todo_api.domain.repository.todo_repository import TodoRepository
from todo_api.infrastructure.repository.data_model.todo import TodoDataModel
from todo_api.utils.uuid import UUID7


class TodoRepositoryImpl(TodoRepository):
    def __init__(self, context_provider: ContextProvider[Session]) -> None:
        self.context_provider = context_provider

    def find_all(self) -> list[Todo]:
        stmt = select(TodoDataModel)
        session = self.context_provider.current()
        todos = session.scalars(stmt).all()

        return [todo.to_domain() for todo in todos]

    def find_by_id(self, todo_id: UUID7):
        stmt = select(TodoDataModel).where(TodoDataModel.id == str(todo_id))

        session = self.context_provider.current()
        todo_data_model = session.scalars(stmt).one_or_none()

        if todo_data_model is None:
            raise RepositoryNotFoundError(f"Todo with id {todo_id} not found")
        return todo_data_model.to_domain()

    def save(self, todo: Todo) -> None:
        session = self.context_provider.current()
        todo_data_model = TodoDataModel.from_domain(todo)

        session.merge(todo_data_model)
        session.flush()

    def delete(self, todo: Todo) -> None:
        session = self.context_provider.current()
        session.execute(delete(TodoDataModel).where(TodoDataModel.id == str(todo.id)))
