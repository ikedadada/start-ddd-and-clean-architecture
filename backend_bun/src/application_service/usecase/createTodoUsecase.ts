import { Todo } from "@/domain/model/todo";
import type { TodoRepository } from "@/domain/repository/todoRepository";

export type CreateTodoRequest = {
  title: string;
  description?: string;
};

export type CreateTodoResponse = {
  todo: Todo;
};

export interface CreateTodoUsecase {
  execute(request: CreateTodoRequest): Promise<CreateTodoResponse>;
}

export class CreateTodoUsecaseImpl implements CreateTodoUsecase {
  constructor(private todoRepository: TodoRepository) {}

  async execute(request: CreateTodoRequest): Promise<CreateTodoResponse> {
    const todo = new Todo(request.title, request.description);
    await this.todoRepository.save(todo);
    return { todo };
  }
}
