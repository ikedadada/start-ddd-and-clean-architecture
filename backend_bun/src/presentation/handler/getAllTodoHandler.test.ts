import { describe, expect, it, vi } from "bun:test";
import { Hono } from "hono";
import type { GetAllTodosUsecase } from "@/application_service/usecase/getAllTodosUsecase";
import { Todo } from "@/domain/model/todo";
import { GetAllTodosHandler } from "@/presentation/handler/getAllTodoHandler";

describe("GetAllTodosHandler", () => {
	it("maps domain todos to presentation shape", async () => {
		const t1 = Todo.fromPrimitives({
			id: "id-1",
			title: "a",
			description: null,
			isCompleted: false,
		});
		const t2 = Todo.fromPrimitives({
			id: "id-2",
			title: "b",
			description: "desc",
			isCompleted: true,
		});
		const execute = vi.fn<GetAllTodosUsecase["execute"]>();
		execute.mockResolvedValue({ todos: [t1, t2] });
		const usecase: GetAllTodosUsecase = { execute };

		const handler = new GetAllTodosHandler(usecase);
		const app = new Hono();
		handler.register(app);

		const res = await app.request("/todos", {
			method: "GET",
		});

		expect(execute).toHaveBeenCalled();
		expect(res.status).toBe(200);
		const json = await res.json();
		expect(json).toEqual({
			todos: [
				{
					id: t1.id,
					title: t1.title,
					description: t1.description,
					completed: t1.isCompleted,
				},
				{
					id: t2.id,
					title: t2.title,
					description: t2.description,
					completed: t2.isCompleted,
				},
			],
		});
	});
});
