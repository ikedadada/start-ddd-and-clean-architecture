import type { Request, Response } from "express";

export function routeNotFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ code: 404, message: "Route Not Found" });
}
