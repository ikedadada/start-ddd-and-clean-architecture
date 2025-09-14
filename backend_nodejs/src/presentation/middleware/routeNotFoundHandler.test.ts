import type { Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";
import { routeNotFoundHandler } from "@/presentation/middleware/routeNotFoundHandler";

function mockRes<T>() {
  const status = vi.fn().mockReturnThis();
  const json = vi.fn();
  const res = { status, json } as unknown as Response<T>;
  return { res, status, json };
}

describe("routeNotFoundHandler", () => {
  it("responds 404 with standard payload", () => {
    const { res, status, json } = mockRes();
    const req = {} as Request;

    routeNotFoundHandler(req, res);

    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({
      code: 404,
      message: "Route Not Found",
    });
  });
});
