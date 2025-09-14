import type { Todo } from "../model/todo";
export interface TodoRepository {
  findAll(): Promise<Todo[]>;
  findById(id: string): Promise<Todo>;
  save(todo: Todo): Promise<void>;
  delete(todo: Todo): Promise<void>;
}
