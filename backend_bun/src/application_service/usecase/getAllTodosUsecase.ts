import type { Todo } from "@/domain/model/todo";
import type { TodoRepository } from "@/domain/repository/todoRepository";

export type GetAllTodosResponse = {
  todos: Todo[];
};

export interface GetAllTodosUsecase {
  execute(): Promise<GetAllTodosResponse>;
}

export class GetAllTodosUsecaseImpl implements GetAllTodosUsecase {
  constructor(private todoRepository: TodoRepository) {}

  async execute(): Promise<GetAllTodosResponse> {
    const todos = await this.todoRepository.findAll();
    return { todos };
  }
}
