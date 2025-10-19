import { describe, expect, it, vi } from "bun:test";
import { Hono } from "hono";
import { v7 as uuidv7 } from "uuid";
import type { DeleteTodoUsecase } from "@/application_service/usecase/deleteTodoUsecase";
import { RepositoryNotFoundError } from "@/domain/repository/errors";
import { DeleteTodoHandler } from "@/presentation/handler/deleteTodoHandler";

describe("DeleteTodoHandler", () => {
  it("returns 204 with empty body on success", async () => {
    const execute = vi.fn<DeleteTodoUsecase["execute"]>();
    execute.mockResolvedValue(undefined);
    const usecase: DeleteTodoUsecase = { execute };
    const handler = new DeleteTodoHandler(usecase);
    const app = new Hono();
    handler.register(app);

    const id = uuidv7();
    const res = await app.request(`/todos/${id}`, {
      method: "DELETE",
    });

    expect(execute).toHaveBeenCalledWith({ id });
    expect(res.status).toBe(204);
    expect(await res.text()).toBe("");
  });

  it("calls next with BadRequestError when id invalid", async () => {
    const execute = vi.fn<DeleteTodoUsecase["execute"]>();
    const usecase: DeleteTodoUsecase = { execute };
    const handler = new DeleteTodoHandler(usecase);
    const app = new Hono();
    handler.register(app);

    const res = await app.request("/todos/bad", {
      method: "DELETE",
    });

    expect(res.status).toBe(400);
  });

  it("maps RepositoryNotFoundError to NotFoundError", async () => {
    const execute = vi.fn<DeleteTodoUsecase["execute"]>();
    execute.mockRejectedValue(new RepositoryNotFoundError("not found"));
    const usecase: DeleteTodoUsecase = { execute };
    const handler = new DeleteTodoHandler(usecase);
    const app = new Hono();
    handler.register(app);

    const id = uuidv7();
    const res = await app.request(`/todos/${id}`, {
      method: "DELETE",
    });

    expect(res.status).toBe(404);
  });
});
