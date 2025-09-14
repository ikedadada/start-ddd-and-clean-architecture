import type { NextFunction, Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";
import {
  BadRequestError,
  ConflictError,
  errorHandler,
  HTTPError,
  NotFoundError,
} from "@/presentation/middleware/errorHandler";

function mockRes<T>() {
  const status = vi.fn().mockReturnThis();
  const json = vi.fn();
  const res = { status, json } as unknown as Response<T>;
  return { res, status, json };
}

describe("errorHandler middleware", () => {
  it("serializes HTTPError subclasses with their status and message", () => {
    const cases: [Error, number][] = [
      [new BadRequestError("bad req"), 400],
      [new NotFoundError("not found"), 404],
      [new ConflictError("conflict"), 409],
      [new HTTPError("teapot", 418), 418],
    ];

    for (const [err, code] of cases) {
      const { res, status, json } = mockRes();
      const next = vi.fn() as unknown as NextFunction;
      errorHandler(err, {} as Request, res, next);
      expect(status).toHaveBeenCalledWith(code);
      expect(json).toHaveBeenCalledWith({ code, message: err.message });
    }
  });

  it("maps generic Error to 500 Internal Server Error", () => {
    const err = new Error("boom");
    const { res, status, json } = mockRes();
    const next = vi.fn() as unknown as NextFunction;
    errorHandler(err, {} as Request, res, next);
    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      code: 500,
      message: "Internal Server Error",
    });
  });
});
