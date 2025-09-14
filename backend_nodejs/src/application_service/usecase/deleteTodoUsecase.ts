import type { TodoRepository } from "@/domain/repository/todoRepository";
import type { TransactionService } from "../service/transactionService";

export type DeleteTodoRequest = {
  id: string;
};

export interface DeleteTodoUsecase {
  execute(request: DeleteTodoRequest): Promise<void>;
}

export class DeleteTodoUsecaseImpl implements DeleteTodoUsecase {
  constructor(
    private todoRepository: TodoRepository,
    private transactionService: TransactionService,
  ) {}

  async execute(request: DeleteTodoRequest): Promise<void> {
    await this.transactionService.run(async () => {
      const todo = await this.todoRepository.findById(request.id);
      await this.todoRepository.delete(todo);
    });
  }
}
