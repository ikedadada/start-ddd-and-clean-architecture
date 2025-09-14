import type { NextFunction, Request, Response } from "express";

export class HTTPError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}

export class NotFoundError extends HTTPError {
  constructor(message: string = "Not Found") {
    super(message, 404);
  }
}

export class BadRequestError extends HTTPError {
  constructor(message: string = "Bad Request") {
    super(message, 400);
  }
}

export class ConflictError extends HTTPError {
  constructor(message: string = "Conflict") {
    super(message, 409);
  }
}

export class InternalServerError extends HTTPError {
  constructor(message: string = "Internal Server Error") {
    super(message, 500);
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  console.error(err);
  if (err instanceof HTTPError) {
    res
      .status(err.statusCode)
      .json({ code: err.statusCode, message: err.message });
  } else if (err instanceof Error) {
    res.status(500).json({ code: 500, message: "Internal Server Error" });
  }
}
