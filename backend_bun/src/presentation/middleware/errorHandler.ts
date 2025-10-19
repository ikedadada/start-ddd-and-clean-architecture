import type { Context, ErrorHandler } from "hono";
import { HTTPException } from "hono/http-exception";

export class NotFoundError extends HTTPException {
  constructor(message: string = "Not Found", cause?: unknown) {
    super(404, { message, cause });
  }
}

export class BadRequestError extends HTTPException {
  constructor(message: string = "Bad Request", cause?: unknown) {
    super(400, { message, cause });
  }
}

export class ConflictError extends HTTPException {
  constructor(message: string = "Conflict", cause?: unknown) {
    super(409, { message, cause });
  }
}

export class InternalServerError extends HTTPException {
  constructor(message: string = "Internal Server Error", cause?: unknown) {
    super(500, { message, cause });
  }
}

export const errorHandler: ErrorHandler = (
  err: Error | HTTPException,
  c: Context,
) => {
  console.error(err);
  if (err instanceof HTTPException) {
    const message = err.message || "HTTP Exception Occurred";
    const cause = err.cause ? `: ${err.cause}` : "";
    return c.json(
      {
        code: err.status || 500,
        message: `${message}${cause}`,
      },
      err.status || 500,
    );
  } else {
    return c.json(
      { code: 500, message: `${err.message || "HTTP Error Occurred"}` },
      500,
    );
  }
};
