import type { NextFunction, Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";
import type { GetAllTodosUsecase } from "@/application_service/usecase/getAllTodosUsecase";
import { Todo } from "@/domain/model/todo";
import { GetAllTodosHandler } from "@/presentation/handler/getAllTodoHandler";

function mockRes<T>() {
  const json = vi.fn();
  const res = { json } as unknown as Response<T>;
  return { res, json };
}

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
    const req = {} as unknown as Request;
    const { res, json } = mockRes();
    const next = vi.fn() as unknown as NextFunction;

    await handler.handle(req, res, next);

    expect(json).toHaveBeenCalledWith({
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
    expect(next).not.toHaveBeenCalled();
  });
});
