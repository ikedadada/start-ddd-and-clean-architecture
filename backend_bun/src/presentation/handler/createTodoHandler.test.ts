import { describe, expect, it, vi } from "bun:test";
import { Hono } from "hono";
import type { CreateTodoUsecase } from "@/application_service/usecase/createTodoUsecase";
import { Todo } from "@/domain/model/todo";
import { CreateTodoHandler } from "@/presentation/handler/createTodoHandler";

describe("CreateTodoHandler", () => {
  it("returns 201 and created todo mapping on success", async () => {
    const execute = vi.fn<CreateTodoUsecase["execute"]>();
    const todo = new Todo("hello", "world");
    execute.mockResolvedValue({ todo });
    const usecase: CreateTodoUsecase = { execute };
    const handler = new CreateTodoHandler(usecase);
    const app = new Hono();
    handler.register(app);

    const res = await app.request("/todos", {
      method: "POST",
      body: JSON.stringify({ title: "hello", description: "world" }),
      headers: { "Content-Type": "application/json" },
    });

    expect(execute).toHaveBeenCalledWith({
      title: "hello",
      description: "world",
    });
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({
      id: todo.id,
      title: todo.title,
      description: todo.description,
      completed: todo.isCompleted,
    });
  });

  it("calls next with BadRequestError when validation fails", async () => {
    const execute = vi.fn<CreateTodoUsecase["execute"]>();
    const usecase: CreateTodoUsecase = { execute };
    const handler = new CreateTodoHandler(usecase);
    const app = new Hono();
    handler.register(app);

    const res = await app.request("/todos", {
      method: "POST",
      body: JSON.stringify({ title: "a" }), // too short
      headers: { "Content-Type": "application/json" },
    });

    expect(res.status).toBe(400);
  });
});
