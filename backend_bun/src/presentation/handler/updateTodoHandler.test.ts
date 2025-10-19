import { describe, expect, it, vi } from "bun:test";
import { Hono } from "hono";
import { v7 as uuidv7 } from "uuid";
import type { UpdateTodoUsecase } from "@/application_service/usecase/updateTodoUsecase";
import { Todo } from "@/domain/model/todo";
import { RepositoryNotFoundError } from "@/domain/repository/errors";
import { UpdateTodoHandler } from "@/presentation/handler/updateTodoHandler";

describe("UpdateTodoHandler", () => {
  it("returns mapped updated todo on success", async () => {
    const execute = vi.fn<UpdateTodoUsecase["execute"]>();
    const todo = new Todo("title", "desc");
    execute.mockResolvedValue({ todo });
    const usecase: UpdateTodoUsecase = { execute };
    const handler = new UpdateTodoHandler(usecase);
    const app = new Hono();
    handler.register(app);

    const res = await app.request(`/todos/${todo.id}`, {
      method: "PUT",
      body: JSON.stringify({ title: "new title", description: "new desc" }),
      headers: { "Content-Type": "application/json" },
    });

    expect(execute).toHaveBeenCalledWith({
      id: todo.id,
      title: "new title",
      description: "new desc",
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({
      id: todo.id,
      title: todo.title,
      description: todo.description,
      completed: todo.isCompleted,
    });
  });

  it("calls next with BadRequestError when validation fails", async () => {
    const execute = vi.fn<UpdateTodoUsecase["execute"]>();
    const usecase: UpdateTodoUsecase = { execute };
    const handler = new UpdateTodoHandler(usecase);
    const app = new Hono();
    handler.register(app);

    const res = await app.request("/todos/bad", {
      method: "PUT",
      body: JSON.stringify({ title: "a" }), // too short
      headers: { "Content-Type": "application/json" },
    });

    expect(res.status).toBe(400);
  });

  it("maps RepositoryNotFoundError to NotFoundError", async () => {
    const execute = vi.fn<UpdateTodoUsecase["execute"]>();
    execute.mockRejectedValue(new RepositoryNotFoundError("not found"));
    const usecase: UpdateTodoUsecase = { execute };
    const handler = new UpdateTodoHandler(usecase);
    const app = new Hono();
    handler.register(app);

    const id = uuidv7();
    const res = await app.request(`/todos/${id}`, {
      method: "PUT",
      body: JSON.stringify({ title: "ok" }),
      headers: { "Content-Type": "application/json" },
    });

    expect(res.status).toBe(404);
  });
});
