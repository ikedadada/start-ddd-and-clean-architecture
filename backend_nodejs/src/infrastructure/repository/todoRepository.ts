import { Todo } from "@/domain/model/todo";
import type { ContextProvider } from "@/domain/repository/context";
import { RepositoryNotFoundError } from "@/domain/repository/errors";
import type { TodoRepository } from "@/domain/repository/todoRepository";
import type { Conn } from "./context";

type TodoDatamodel = {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  created_at: Date;
  updated_at: Date;
};

function toTodoDatamodel(todo: Todo): TodoDatamodel {
  const { id, title, description, isCompleted } = todo.toPrimitives();
  return {
    id,
    title,
    description: description ?? null,
    completed: isCompleted,
    created_at: new Date(),
    updated_at: new Date(),
  };
}

function fromTodoDatamodel(data: TodoDatamodel): Todo {
  return Todo.fromPrimitives({
    id: data.id,
    title: data.title,
    description: data.description ?? null,
    isCompleted: data.completed,
  });
}

export class TodoRepositoryImpl implements TodoRepository {
  constructor(private readonly contextProvider: ContextProvider<Conn>) {}

  async save(todo: Todo): Promise<void> {
    const db = this.contextProvider.get();
    const data = toTodoDatamodel(todo);
    await db.todos.upsert({
      where: { id: todo.id },
      create: data,
      update: data,
    });
  }

  async findById(id: string): Promise<Todo> {
    const db = this.contextProvider.get();
    const data = await db.todos.findUnique({
      where: { id },
    });
    if (!data) throw new RepositoryNotFoundError(`Todo id(${id}) not found`);
    return fromTodoDatamodel(data);
  }

  async findAll(): Promise<Todo[]> {
    const db = this.contextProvider.get();
    const data = await db.todos.findMany();
    return data.map((item) => fromTodoDatamodel(item as TodoDatamodel));
  }

  async delete(todo: Todo): Promise<void> {
    const db = this.contextProvider.get();
    await db.todos.delete({
      where: { id: todo.id },
    });
  }
}
