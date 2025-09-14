import { describe, expect, it, vi } from "vitest";
import { GetTodoUsecaseImpl } from "@/application_service/usecase/getTodoUsecase";
import { Todo } from "@/domain/model/todo";
import type { TodoRepository } from "@/domain/repository/todoRepository";

describe("GetTodoUsecase", () => {
  it("fetches a todo by id", async () => {
    const t = new Todo("x");
    const repo: TodoRepository = {
      findAll: vi.fn(),
      findById: vi.fn().mockResolvedValue(t),
      save: vi.fn(),
      delete: vi.fn(),
    };
    const usecase = new GetTodoUsecaseImpl(repo);

    const res = await usecase.execute({ id: t.id });

    expect(repo.findById).toHaveBeenCalledWith(t.id);
    expect(res.todo).toBe(t);
  });
});
