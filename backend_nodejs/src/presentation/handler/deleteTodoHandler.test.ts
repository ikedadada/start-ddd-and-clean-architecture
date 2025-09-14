import type { NextFunction, Request, Response } from "express";
import { v7 as uuidv7 } from "uuid";
import { describe, expect, it, vi } from "vitest";
import type { DeleteTodoUsecase } from "@/application_service/usecase/deleteTodoUsecase";
import { RepositoryNotFoundError } from "@/domain/repository/errors";
import { DeleteTodoHandler } from "@/presentation/handler/deleteTodoHandler";
import {
  BadRequestError,
  NotFoundError,
} from "@/presentation/middleware/errorHandler";

function mockRes<T>() {
  const status = vi.fn().mockReturnThis();
  const json = vi.fn();
  const res = { status, json } as unknown as Response<T>;
  return { res, status, json };
}

describe("DeleteTodoHandler", () => {
  it("returns 204 with empty body on success", async () => {
    const execute = vi.fn<DeleteTodoUsecase["execute"]>();
    execute.mockResolvedValue(undefined);
    const usecase: DeleteTodoUsecase = { execute };

    const handler = new DeleteTodoHandler(usecase);
    const id = uuidv7();
    const req = { params: { id } } as unknown as Request;
    const { res, status, json } = mockRes();
    const next = vi.fn() as unknown as NextFunction;

    await handler.handle(req, res, next);

    expect(execute).toHaveBeenCalledWith({ id });
    expect(status).toHaveBeenCalledWith(204);
    expect(json).toHaveBeenCalledWith({});
    expect(next).not.toHaveBeenCalled();
  });

  it("calls next with BadRequestError when id invalid", async () => {
    const execute = vi.fn<DeleteTodoUsecase["execute"]>();
    const usecase: DeleteTodoUsecase = { execute };
    const handler = new DeleteTodoHandler(usecase);
    const req = { params: { id: "bad" } } as unknown as Request;
    const { res } = mockRes();
    const next = vi.fn() as unknown as NextFunction;

    await handler.handle(req, res, next);

    // biome-ignore lint/suspicious/noExplicitAny: for test
    const err = (next as any).mock.calls[0][0];
    expect(err).toBeInstanceOf(BadRequestError);
  });

  it("maps RepositoryNotFoundError to NotFoundError", async () => {
    const execute = vi.fn<DeleteTodoUsecase["execute"]>();
    execute.mockRejectedValue(new RepositoryNotFoundError("not found"));
    const usecase: DeleteTodoUsecase = { execute };
    const handler = new DeleteTodoHandler(usecase);
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
