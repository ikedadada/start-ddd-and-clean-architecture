import { describe, expect, it, vi } from "bun:test";
import { Hono } from "hono";
import { v7 as uuidv7 } from "uuid";
import type { GetTodoUsecase } from "@/application_service/usecase/getTodoUsecase";
import { Todo } from "@/domain/model/todo";
import { RepositoryNotFoundError } from "@/domain/repository/errors";
import { GetTodoHandler } from "@/presentation/handler/getTodoHandler";

describe("GetTodoHandler", () => {
  it("returns mapped todo on success", async () => {
    const execute = vi.fn<GetTodoUsecase["execute"]>();
    const todo = new Todo("title", "desc");
    execute.mockResolvedValue({ todo });
    const usecase: GetTodoUsecase = { execute };
    const handler = new GetTodoHandler(usecase);
    const app = new Hono();
    handler.register(app);

    const res = await app.request(`/todos/${todo.id}`, {
      method: "GET",
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
    const execute = vi.fn<GetTodoUsecase["execute"]>();
    const usecase: GetTodoUsecase = { execute };
    const handler = new GetTodoHandler(usecase);
    const app = new Hono();
    handler.register(app);

    const res = await app.request("/todos/bad-id", {
      method: "GET",
    });

    expect(res.status).toBe(400);
  });

  it("maps RepositoryNotFoundError to NotFoundError", async () => {
    const execute = vi.fn<GetTodoUsecase["execute"]>();
    execute.mockRejectedValue(new RepositoryNotFoundError("not found"));
    const usecase: GetTodoUsecase = { execute };
    const handler = new GetTodoHandler(usecase);
    const app = new Hono();
    handler.register(app);

    const id = uuidv7();
    const res = await app.request(`/todos/${id}`, {
      method: "GET",
    });

    expect(res.status).toBe(404);
  });
});
