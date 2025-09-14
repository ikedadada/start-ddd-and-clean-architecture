import { describe, expect, it, vi } from "vitest";
import { GetAllTodosUsecaseImpl } from "@/application_service/usecase/getAllTodosUsecase";
import { Todo } from "@/domain/model/todo";
import type { TodoRepository } from "@/domain/repository/todoRepository";

describe("GetAllTodosUsecase", () => {
  it("returns all todos via repository", async () => {
    const t1 = new Todo("a");
    const t2 = new Todo("b");
    const repo: TodoRepository = {
      findAll: vi.fn().mockResolvedValue([t1, t2]),
      findById: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    };
    const usecase = new GetAllTodosUsecaseImpl(repo);

    const res = await usecase.execute();

    expect(repo.findAll).toHaveBeenCalled();
    expect(res.todos).toEqual([t1, t2]);
  });
});
