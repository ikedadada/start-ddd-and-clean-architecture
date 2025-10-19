import { describe, expect, it, vi } from "bun:test";
import { Hono } from "hono";
import { v7 as uuidv7 } from "uuid";
import type { MarkAsNotCompletedTodoUsecase } from "@/application_service/usecase/markAsNotCompletedTodoUsecase";
import { DomainConflictError } from "@/domain/model/errors";
import { Todo } from "@/domain/model/todo";
import { RepositoryNotFoundError } from "@/domain/repository/errors";
import { MarkAsNotCompletedTodoHandler } from "@/presentation/handler/markAsNotCompletedTodoHandler";

describe("MarkAsNotCompletedTodoHandler", () => {
  it("returns mapped updated todo on success", async () => {
    const execute = vi.fn<MarkAsNotCompletedTodoUsecase["execute"]>();
    const todo = new Todo("title", "desc");
    execute.mockResolvedValue({ todo });
    const usecase: MarkAsNotCompletedTodoUsecase = { execute };
    const handler = new MarkAsNotCompletedTodoHandler(usecase);
    const app = new Hono();
    handler.register(app);

    const res = await app.request(`/todos/${todo.id}/uncomplete`, {
      method: "PUT",
    });

    expect(execute).toHaveBeenCalledWith({ id: todo.id });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({
      id: todo.id,
      title: todo.title,
      description: todo.description,
      completed: todo.isCompleted,
    });
  });

  it("calls next with BadRequestError when id invalid", async () => {
    const execute = vi.fn<MarkAsNotCompletedTodoUsecase["execute"]>();
    const usecase: MarkAsNotCompletedTodoUsecase = { execute };
    const handler = new MarkAsNotCompletedTodoHandler(usecase);
    const app = new Hono();
    handler.register(app);

    const res = await app.request("/todos/bad/uncomplete", {
      method: "PUT",
    });

    expect(res.status).toBe(400);
  });

  it("maps RepositoryNotFoundError to NotFoundError", async () => {
    const execute = vi.fn<MarkAsNotCompletedTodoUsecase["execute"]>();
    execute.mockRejectedValue(new RepositoryNotFoundError("not found"));
    const usecase: MarkAsNotCompletedTodoUsecase = { execute };
    const handler = new MarkAsNotCompletedTodoHandler(usecase);
    const app = new Hono();
    handler.register(app);

    const id = uuidv7();
    const res = await app.request(`/todos/${id}/uncomplete`, {
      method: "PUT",
    });

    expect(res.status).toBe(404);
  });

  it("maps DomainConflictError to ConflictError", async () => {
    const execute = vi.fn<MarkAsNotCompletedTodoUsecase["execute"]>();
    execute.mockRejectedValue(new DomainConflictError("Already not completed"));
    const usecase: MarkAsNotCompletedTodoUsecase = { execute };
    const handler = new MarkAsNotCompletedTodoHandler(usecase);
    const app = new Hono();
    handler.register(app);

    const id = uuidv7();
    const res = await app.request(`/todos/${id}/uncomplete`, {
      method: "PUT",
    });

    expect(res.status).toBe(409);
  });
});
