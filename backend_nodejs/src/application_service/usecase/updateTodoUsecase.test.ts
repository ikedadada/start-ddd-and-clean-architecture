import { describe, expect, it, vi } from "vitest";
import type { TransactionService } from "@/application_service/service/transactionService";
import { UpdateTodoUsecaseImpl } from "@/application_service/usecase/updateTodoUsecase";
import { Todo } from "@/domain/model/todo";
import type { TodoRepository } from "@/domain/repository/todoRepository";

describe("UpdateTodoUsecase", () => {
  it("updates title and description in a transaction", async () => {
    const existing = new Todo("old", "desc1");
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
    const usecase = new UpdateTodoUsecaseImpl(repo, tx);

    const res = await usecase.execute({
      id: existing.id,
      title: "new",
      description: "desc2",
    });

    expect(tx.run).toHaveBeenCalledTimes(1);
    expect(repo.findById).toHaveBeenCalledWith(existing.id);
    expect(repo.save).toHaveBeenCalledTimes(1);
    // biome-ignore lint/suspicious/noExplicitAny: for test
    const [saved] = (repo.save as any).mock.calls[0];
    expect(saved.title).toBe("new");
    expect(saved.description).toBe("desc2");
    expect(res.todo).toBe(existing);
  });
});
