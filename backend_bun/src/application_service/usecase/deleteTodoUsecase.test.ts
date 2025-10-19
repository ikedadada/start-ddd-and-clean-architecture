import { describe, expect, it, vi } from "bun:test";
import type { TransactionService } from "@/application_service/service/transactionService";
import { DeleteTodoUsecaseImpl } from "@/application_service/usecase/deleteTodoUsecase";
import { Todo } from "@/domain/model/todo";
import type { TodoRepository } from "@/domain/repository/todoRepository";

describe("DeleteTodoUsecase", () => {
  it("deletes a todo in a transaction", async () => {
    const existing = new Todo("to-delete");
    const repo: TodoRepository = {
      findAll: vi.fn(),
      findById: vi.fn().mockResolvedValue(existing),
      save: vi.fn(),
      delete: vi.fn().mockResolvedValue(undefined),
    };
    const tx: TransactionService = {
      run: vi
        .fn()
        .mockImplementation(async (op: () => Promise<unknown>) => op()),
    };
    const usecase = new DeleteTodoUsecaseImpl(repo, tx);

    await usecase.execute({
      id: existing.id,
    });

    expect(tx.run).toHaveBeenCalledTimes(1);
    expect(repo.findById).toHaveBeenCalledWith(existing.id);
    expect(repo.delete).toHaveBeenCalledWith(existing);
  });
});
