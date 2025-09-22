from todo_api.domain.model.todo import Todo
from todo_api.domain.repository.errors import RepositoryNotFoundError
from todo_api.domain.repository.todo_repository import TodoRepository
from todo_api.utils.uuid import UUID7


class TodoRepositoryImpl(TodoRepository):
    def __init__(self) -> None:
        sample_todo_1 = Todo(title="Sample Todo", description="This is a sample todo item.")
        sample_todo_2 = Todo(title="Another Sample Todo")
        sample_todo_2.mark_as_completed()
        self.todos = [
            sample_todo_1,
            sample_todo_2,
        ]

    def find_all(self) -> list[Todo]:
        return list(self.todos)

    def find_by_id(self, todo_id: UUID7):
        todo = next((todo for todo in self.todos if todo.id == todo_id), None)
        if not todo:
            raise RepositoryNotFoundError(f"Todo with id {todo_id} not found")
        return todo

    def save(self, todo: Todo) -> None:
        existing_todo = next((t for t in self.todos if t.id == todo.id), None)
        if existing_todo:
            self.todos.remove(existing_todo)
        self.todos.append(todo)

    def delete(self, todo: Todo) -> None:
        self.todos = [t for t in self.todos if t.id != todo.id]
