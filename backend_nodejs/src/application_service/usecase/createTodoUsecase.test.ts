import { describe, expect, it, vi } from "vitest";
import { CreateTodoUsecaseImpl } from "@/application_service/usecase/createTodoUsecase";
import { Todo } from "@/domain/model/todo";

import type { TodoRepository } from "@/domain/repository/todoRepository";

describe("CreateTodoUsecase", () => {
  it("creates and saves a new todo", async () => {
    const repo: TodoRepository = {
      findAll: vi.fn(),
      findById: vi.fn(),
      save: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn(),
    };
    const usecase = new CreateTodoUsecaseImpl(repo);

    const res = await usecase.execute({
      title: "title",
      description: "desc",
    });

    expect(repo.save).toHaveBeenCalledTimes(1);
    // biome-ignore lint/suspicious/noExplicitAny: for test
    const [saved] = (repo.save as any).mock.calls[0];
    expect(saved).toBeInstanceOf(Todo);
    expect(res.todo).toBe(saved);
    expect(res.todo.title).toBe("title");
    expect(res.todo.description).toBe("desc");
    expect(res.todo.isCompleted).toBe(false);
    expect(typeof res.todo.id).toBe("string");
  });
});
