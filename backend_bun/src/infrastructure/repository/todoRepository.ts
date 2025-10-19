import { Todo } from "@/domain/model/todo";
import type { ContextProvider } from "@/domain/repository/context";
import { RepositoryNotFoundError } from "@/domain/repository/errors";
import type { TodoRepository } from "@/domain/repository/todoRepository";
import type { Conn } from "./context";

type TodoDatamodel = {
  id: string;
  title: string;
  description: string | null;
  completed: 0 | 1;
};

function toTodoDatamodel(todo: Todo): TodoDatamodel {
  const { id, title, description, isCompleted } = todo.toPrimitives();
  return {
    id,
    title,
    description: description ?? null,
    completed: isCompleted ? 1 : 0,
  };
}

function fromTodoDatamodel(data: TodoDatamodel): Todo {
  return Todo.fromPrimitives({
    id: data.id,
    title: data.title,
    description: data.description ?? null,
    isCompleted: data.completed === 1,
  });
}

export class TodoRepositoryImpl implements TodoRepository {
  constructor(private readonly contextProvider: ContextProvider<Conn>) {}

  async save(todo: Todo): Promise<void> {
    const db = this.contextProvider.get();
    const data = toTodoDatamodel(todo);

    await db`INSERT INTO todos 
      (
        id, 
        title, 
        description, 
        completed
      ) 
    VALUES 
      (
        ${data.id}, 
        ${data.title}, 
        ${data.description}, 
        ${data.completed}
      ) 
    ON DUPLICATE KEY UPDATE 
      title = ${data.title}, 
      description = ${data.description}, 
      completed = ${data.completed}`;
  }

  async findById(id: string): Promise<Todo> {
    const db = this.contextProvider.get();
    const rows: TodoDatamodel[] =
      await db`SELECT * FROM todos WHERE id = ${id}`;
    if (rows.length === 0)
      throw new RepositoryNotFoundError(`Todo id(${id}) not found`);
    const todo = rows[0];
    return fromTodoDatamodel(todo);
  }

  async findAll(): Promise<Todo[]> {
    const db = this.contextProvider.get();
    const rows: TodoDatamodel[] =
      await db`SELECT id, title, description, completed FROM todos`;
    return rows.map((item) => fromTodoDatamodel(item));
  }

  async delete(todo: Todo): Promise<void> {
    const db = this.contextProvider.get();
    await db`DELETE FROM todos WHERE id = ${todo.id}`;
  }
}
