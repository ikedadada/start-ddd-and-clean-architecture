import { describe, expect, it, vi } from "bun:test";
import type { TransactionService } from "@/application_service/service/transactionService";
import { MarkAsCompletedTodoUsecaseImpl } from "@/application_service/usecase/markAsCompletedTodoUsecase";
import { Todo } from "@/domain/model/todo";
import type { TodoRepository } from "@/domain/repository/todoRepository";

describe("MarkAsCompletedTodoUsecase", () => {
  it("marks a todo as completed and saves it", async () => {
    const existing = new Todo("t");
    const repo: TodoRepository = {
      findAll: vi.fn(),
      findById: vi.fn().mockResolvedValue(existing),
      save: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn(),
    };
    const tx: TransactionService = {
      run: vi
        .fn()
        .mockImplementation(async (op: () => Promise<unknown>) => op()),
    };
    const usecase = new MarkAsCompletedTodoUsecaseImpl(repo, tx);

    const res = await usecase.execute({
      id: existing.id,
    });

    expect(tx.run).toHaveBeenCalledTimes(1);
    expect(repo.findById).toHaveBeenCalledWith(existing.id);
    expect(repo.save).toHaveBeenCalledWith(existing);
    expect(res.todo.isCompleted).toBe(true);
  });
});
