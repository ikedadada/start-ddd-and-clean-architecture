import { zValidator } from "@hono/zod-validator";
import type { Hono } from "hono";
import z from "zod";
import type { CreateTodoUsecase } from "@/application_service/usecase/createTodoUsecase";
import {
  BadRequestError,
  InternalServerError,
} from "@/presentation/middleware/errorHandler";

const createTodoRequestJsonSchema = z.object({
  title: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
});

export class CreateTodoHandler {
  constructor(private createTodoUsecase: CreateTodoUsecase) {}

  register = (app: Hono) => {
    app.post(
      "/todos",
      zValidator("json", createTodoRequestJsonSchema, (result) => {
        if (!result.success) {
          throw new BadRequestError("Invalid request data", result.error);
        }
      }),
      async (c) => {
        try {
          const body = await c.req.valid("json");
          const result = await this.createTodoUsecase.execute({
            title: body.title,
            description: body.description,
          });
          return c.json(
            {
              id: result.todo.id,
              title: result.todo.title,
              description: result.todo.description,
              completed: result.todo.isCompleted,
            },
            201,
          );
        } catch (error) {
          switch (true) {
            case error instanceof z.ZodError:
              throw new BadRequestError("Invalid request data", error);
          }
          throw new InternalServerError("Failed to create todo", error);
        }
      },
    );
  };
}
