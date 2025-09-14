import type { Todo } from "@/domain/model/todo";
import type { TodoRepository } from "@/domain/repository/todoRepository";
import type { TransactionService } from "../service/transactionService";

export type MarkAsNotCompletedTodoRequest = {
  id: string;
};

export type MarkAsNotCompletedTodoResponse = {
  todo: Todo;
};

export interface MarkAsNotCompletedTodoUsecase {
  execute(
    request: MarkAsNotCompletedTodoRequest,
  ): Promise<MarkAsNotCompletedTodoResponse>;
}

export class MarkAsNotCompletedTodoUsecaseImpl
  implements MarkAsNotCompletedTodoUsecase
{
  constructor(
    private todoRepository: TodoRepository,
    private transactionService: TransactionService,
  ) {}

  async execute(
    request: MarkAsNotCompletedTodoRequest,
  ): Promise<MarkAsNotCompletedTodoResponse> {
    const todo = await this.transactionService.run(async () => {
      const todo = await this.todoRepository.findById(request.id);
      todo.markAsNotCompleted();
      await this.todoRepository.save(todo);
      return todo;
    });
    return { todo };
  }
}
