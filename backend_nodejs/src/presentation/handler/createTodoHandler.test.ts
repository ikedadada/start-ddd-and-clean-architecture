import type { NextFunction, Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";
import type { CreateTodoUsecase } from "@/application_service/usecase/createTodoUsecase";
import { Todo } from "@/domain/model/todo";
import { CreateTodoHandler } from "@/presentation/handler/createTodoHandler";
import { BadRequestError } from "@/presentation/middleware/errorHandler";

function mockRes<T>() {
  const status = vi.fn().mockReturnThis();
  const json = vi.fn();
  const res = { status, json } as unknown as Response<T>;
  return { res, status, json };
}

describe("CreateTodoHandler", () => {
  it("returns 201 and created todo mapping on success", async () => {
    const execute = vi.fn<CreateTodoUsecase["execute"]>();
    const todo = new Todo("hello", "world");
    execute.mockResolvedValue({ todo });
    const usecase: CreateTodoUsecase = { execute };

    const handler = new CreateTodoHandler(usecase);
    const req = {
      body: { title: "hello", description: "world" },
    } as unknown as Request;
    const { res, status, json } = mockRes();
    const next = vi.fn() as unknown as NextFunction;

    await handler.handle(req, res, next);

    expect(execute).toHaveBeenCalledWith({
      title: "hello",
      description: "world",
    });
    expect(status).toHaveBeenCalledWith(201);
    expect(json).toHaveBeenCalledWith({
      id: todo.id,
      title: todo.title,
      description: todo.description,
      completed: todo.isCompleted,
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("calls next with BadRequestError when validation fails", async () => {
    const execute = vi.fn<CreateTodoUsecase["execute"]>();
    const usecase: CreateTodoUsecase = { execute };
    const handler = new CreateTodoHandler(usecase);
    const req = { body: { title: "a" } } as unknown as Request; // too short
    const { res } = mockRes();
    const next = vi.fn() as unknown as NextFunction;

    await handler.handle(req, res, next);

    // biome-ignore lint/suspicious/noExplicitAny: for test
    const err = (next as any).mock.calls[0][0];
    expect(err).toBeInstanceOf(BadRequestError);
  });
});
