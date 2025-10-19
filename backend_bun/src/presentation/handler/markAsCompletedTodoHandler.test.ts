import { describe, expect, it, vi } from "bun:test";
import { Hono } from "hono";
import { v7 as uuidv7 } from "uuid";
import type { MarkAsCompletedTodoUsecase } from "@/application_service/usecase/markAsCompletedTodoUsecase";
import { DomainConflictError } from "@/domain/model/errors";
import { Todo } from "@/domain/model/todo";
import { RepositoryNotFoundError } from "@/domain/repository/errors";
import { MarkAsCompletedTodoHandler } from "@/presentation/handler/markAsCompletedTodoHandler";

describe("MarkAsCompletedTodoHandler", () => {
	it("returns mapped updated todo on success", async () => {
		const execute = vi.fn<MarkAsCompletedTodoUsecase["execute"]>();
		const todo = new Todo("title", "desc");
		execute.mockResolvedValue({ todo });
		const usecase: MarkAsCompletedTodoUsecase = { execute };
		const handler = new MarkAsCompletedTodoHandler(usecase);
		const app = new Hono();
		handler.register(app);

		const res = await app.request(`/todos/${todo.id}/complete`, {
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
		const execute = vi.fn<MarkAsCompletedTodoUsecase["execute"]>();
		const usecase: MarkAsCompletedTodoUsecase = { execute };
		const handler = new MarkAsCompletedTodoHandler(usecase);
		const app = new Hono();
		handler.register(app);

		const res = await app.request("/todos/bad/complete", {
			method: "PUT",
		});

		expect(res.status).toBe(400);
	});

	it("maps RepositoryNotFoundError to NotFoundError", async () => {
		const execute = vi.fn<MarkAsCompletedTodoUsecase["execute"]>();
		execute.mockRejectedValue(new RepositoryNotFoundError("not found"));
		const usecase: MarkAsCompletedTodoUsecase = { execute };
		const handler = new MarkAsCompletedTodoHandler(usecase);
		const app = new Hono();
		handler.register(app);

		const id = uuidv7();
		const res = await app.request(`/todos/${id}/complete`, {
			method: "PUT",
		});

		expect(res.status).toBe(404);
	});

	it("maps DomainConflictError to ConflictError", async () => {
		const execute = vi.fn<MarkAsCompletedTodoUsecase["execute"]>();
		execute.mockRejectedValue(new DomainConflictError("Already completed"));
		const usecase: MarkAsCompletedTodoUsecase = { execute };
		const handler = new MarkAsCompletedTodoHandler(usecase);
		const app = new Hono();
		handler.register(app);

		const id = uuidv7();
		const res = await app.request(`/todos/${id}/complete`, {
			method: "PUT",
		});

		expect(res.status).toBe(409);
	});
});
