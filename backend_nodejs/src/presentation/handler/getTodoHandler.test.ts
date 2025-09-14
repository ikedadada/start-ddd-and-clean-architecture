import type { NextFunction, Request, Response } from "express";
import { v7 as uuidv7 } from "uuid";
import { describe, expect, it, vi } from "vitest";
import type { GetTodoUsecase } from "@/application_service/usecase/getTodoUsecase";
import { Todo } from "@/domain/model/todo";
import { RepositoryNotFoundError } from "@/domain/repository/errors";
import { GetTodoHandler } from "@/presentation/handler/getTodoHandler";
import {
  BadRequestError,
  NotFoundError,
} from "@/presentation/middleware/errorHandler";

function mockRes<T>() {
  const json = vi.fn();
  const res = { json } as unknown as Response<T>;
  return { res, json };
}

describe("GetTodoHandler", () => {
  it("returns mapped todo on success", async () => {
    const execute = vi.fn<GetTodoUsecase["execute"]>();
    const todo = new Todo("title", "desc");
    execute.mockResolvedValue({ todo });
    const usecase: GetTodoUsecase = { execute };

    const handler = new GetTodoHandler(usecase);
    const id = uuidv7();
    const req = { params: { id } } as unknown as Request;
    const { res, json } = mockRes();
    const next = vi.fn() as unknown as NextFunction;

    await handler.handle(req, res, next);

    expect(execute).toHaveBeenCalledWith({ id });
    expect(json).toHaveBeenCalledWith({
      id: todo.id,
      title: todo.title,
      description: todo.description,
      completed: todo.isCompleted,
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("calls next with BadRequestError when id invalid", async () => {
    const execute = vi.fn<GetTodoUsecase["execute"]>();
    const usecase: GetTodoUsecase = { execute };
    const handler = new GetTodoHandler(usecase);
    const req = { params: { id: "bad-id" } } as unknown as Request;
    const { res } = mockRes();
    const next = vi.fn() as unknown as NextFunction;

    await handler.handle(req, res, next);

    // biome-ignore lint/suspicious/noExplicitAny: for test
    const err = (next as any).mock.calls[0][0];
    expect(err).toBeInstanceOf(BadRequestError);
  });

  it("maps RepositoryNotFoundError to NotFoundError", async () => {
    const execute = vi.fn<GetTodoUsecase["execute"]>();
    execute.mockRejectedValue(new RepositoryNotFoundError("not found"));
    const usecase: GetTodoUsecase = { execute };
    const handler = new GetTodoHandler(usecase);
    const id = uuidv7();
    const req = { params: { id } } as unknown as Request;
    const { res } = mockRes();
    const next = vi.fn() as unknown as NextFunction;

    await handler.handle(req, res, next);

    // biome-ignore lint/suspicious/noExplicitAny: for test
    const err = (next as any).mock.calls[0][0];
    expect(err).toBeInstanceOf(NotFoundError);
  });
});
