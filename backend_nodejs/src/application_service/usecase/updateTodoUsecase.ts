import type { Todo } from "@/domain/model/todo";
import type { TodoRepository } from "@/domain/repository/todoRepository";
import type { TransactionService } from "../service/transactionService";

export type UpdateTodoRequest = {
  id: string;
  title: string;
  description?: string;
};

export type UpdateTodoResponse = {
  todo: Todo;
};

export interface UpdateTodoUsecase {
  execute(request: UpdateTodoRequest): Promise<UpdateTodoResponse>;
}

export class UpdateTodoUsecaseImpl implements UpdateTodoUsecase {
  constructor(
    private todoRepository: TodoRepository,
    private transactionService: TransactionService,
  ) {}

  async execute(request: UpdateTodoRequest): Promise<UpdateTodoResponse> {
    const todo = await this.transactionService.run(async () => {
      const todo = await this.todoRepository.findById(request.id);
      todo.updateTitle(request.title);
      todo.updateDescription(request.description || null);
      await this.todoRepository.save(todo);
      return todo;
    });
    return { todo };
  }
}
