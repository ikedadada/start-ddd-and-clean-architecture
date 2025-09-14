import type { Todo } from "@/domain/model/todo";
import type { TodoRepository } from "@/domain/repository/todoRepository";
import type { TransactionService } from "../service/transactionService";

export type MarkAsCompletedTodoRequest = {
  id: string;
};

export type MarkAsCompletedTodoResponse = {
  todo: Todo;
};

export interface MarkAsCompletedTodoUsecase {
  execute(
    request: MarkAsCompletedTodoRequest,
  ): Promise<MarkAsCompletedTodoResponse>;
}

export class MarkAsCompletedTodoUsecaseImpl
  implements MarkAsCompletedTodoUsecase
{
  constructor(
    private todoRepository: TodoRepository,
    private transactionService: TransactionService,
  ) {}

  async execute(
    request: MarkAsCompletedTodoRequest,
  ): Promise<MarkAsCompletedTodoResponse> {
    const todo = await this.transactionService.run(async () => {
      const todo = await this.todoRepository.findById(request.id);
      todo.markAsCompleted();
      await this.todoRepository.save(todo);
      return todo;
    });
    return { todo };
  }
}
