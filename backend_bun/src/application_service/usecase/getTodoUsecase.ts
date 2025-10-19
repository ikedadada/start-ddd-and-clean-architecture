import type { Todo } from "@/domain/model/todo";
import type { TodoRepository } from "@/domain/repository/todoRepository";

export type GetTodoRequest = {
  id: string;
};

export type GetTodoResponse = {
  todo: Todo;
};

export interface GetTodoUsecase {
  execute(request: GetTodoRequest): Promise<GetTodoResponse>;
}

export class GetTodoUsecaseImpl implements GetTodoUsecase {
  constructor(private todoRepository: TodoRepository) {}

  async execute(request: GetTodoRequest): Promise<GetTodoResponse> {
    const todo = await this.todoRepository.findById(request.id);
    return { todo };
  }
}
