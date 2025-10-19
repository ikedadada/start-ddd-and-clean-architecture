import { describe, expect, it } from "bun:test";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import {
  BadRequestError,
  ConflictError,
  errorHandler,
  NotFoundError,
} from "@/presentation/middleware/errorHandler";

describe("errorHandler middleware", () => {
  it("serializes HTTPError subclasses with their status and message", async () => {
    const cases: [Error, number][] = [
      [new BadRequestError("bad req"), 400],
      [new NotFoundError("not found"), 404],
      [new ConflictError("conflict"), 409],
      [new HTTPException(418, { message: "I'm a teapot" }), 418],
    ];

    for (const [err, code] of cases) {
      const app = new Hono();
      app.onError(errorHandler);
      app.get("/", () => {
        throw err;
      });

      const res = await app.request("/");

      expect(res.status).toBe(code);
      const json = await res.json();
      expect(json).toEqual({ code, message: err.message });
    }
  });

  it("maps generic Error to 500 Internal Server Error", async () => {
    const app = new Hono();
    app.onError(errorHandler);
    app.get("/", () => {
      throw new Error("boom");
    });

    const res = await app.request("/");
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json).toEqual({ code: 500, message: "boom" });
  });
});
