import type { NextFunction, Request, Response } from "express";
import { v7 as uuidv7 } from "uuid";
import { describe, expect, it, vi } from "vitest";
import type { UpdateTodoUsecase } from "@/application_service/usecase/updateTodoUsecase";
import { Todo } from "@/domain/model/todo";
import { RepositoryNotFoundError } from "@/domain/repository/errors";
import { UpdateTodoHandler } from "@/presentation/handler/updateTodoHandler";
import {
  BadRequestError,
  NotFoundError,
} from "@/presentation/middleware/errorHandler";

function mockRes<T>() {
  const json = vi.fn();
  const res = { json } as unknown as Response<T>;
  return { res, json };
}

describe("UpdateTodoHandler", () => {
  it("returns mapped updated todo on success", async () => {
    const execute = vi.fn<UpdateTodoUsecase["execute"]>();
    const todo = new Todo("title", "desc");
    execute.mockResolvedValue({ todo });
    const usecase: UpdateTodoUsecase = { execute };

    const handler = new UpdateTodoHandler(usecase);
    const id = uuidv7();
    const req = {
      params: { id },
      body: { title: "new title", description: "new desc" },
    } as unknown as Request;
    const { res, json } = mockRes();
    const next = vi.fn() as unknown as NextFunction;

    await handler.handle(req, res, next);

    expect(execute).toHaveBeenCalledWith({
      id,
      title: "new title",
      description: "new desc",
    });
    expect(json).toHaveBeenCalledWith({
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
    const req = {
      params: { id: "bad" },
      body: { title: "a" },
    } as unknown as Request; // id invalid and title too short
    const { res } = mockRes();
    const next = vi.fn() as unknown as NextFunction;

    await handler.handle(req, res, next);

    // biome-ignore lint/suspicious/noExplicitAny: for test
    const err = (next as any).mock.calls[0][0];
    expect(err).toBeInstanceOf(BadRequestError);
  });

  it("maps RepositoryNotFoundError to NotFoundError", async () => {
    const execute = vi.fn<UpdateTodoUsecase["execute"]>();
    execute.mockRejectedValue(new RepositoryNotFoundError("not found"));
    const usecase: UpdateTodoUsecase = { execute };
    const handler = new UpdateTodoHandler(usecase);
    const id = uuidv7();
    const req = {
      params: { id },
      body: { title: "ok" },
    } as unknown as Request;
    const { res } = mockRes();
    const next = vi.fn() as unknown as NextFunction;

    await handler.handle(req, res, next);

    // biome-ignore lint/suspicious/noExplicitAny: for test
    const err = (next as any).mock.calls[0][0];
    expect(err).toBeInstanceOf(NotFoundError);
  });
});
