import { zValidator } from "@hono/zod-validator";
import type { Hono } from "hono";
import z from "zod";
import type { UpdateTodoUsecase } from "@/application_service/usecase/updateTodoUsecase";
import { RepositoryNotFoundError } from "@/domain/repository/errors";
import {
  BadRequestError,
  InternalServerError,
  NotFoundError,
} from "@/presentation/middleware/errorHandler";

const updateTodoRequestParamSchema = z.object({
  id: z.uuid({ version: "v7" }),
});

const updateTodoRequestJsonSchema = z.object({
  title: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
});

export class UpdateTodoHandler {
  constructor(private updateTodoUsecase: UpdateTodoUsecase) {}

  register = (app: Hono) => {
    app.put(
      "/todos/:id",
      zValidator("param", updateTodoRequestParamSchema, (result) => {
        if (!result.success) {
          throw new BadRequestError("Invalid request parameters", result.error);
        }
      }),
      zValidator("json", updateTodoRequestJsonSchema, (result) => {
        if (!result.success) {
          throw new BadRequestError("Invalid request body", result.error);
        }
      }),
      async (c) => {
        try {
          const { id } = c.req.valid("param");
          const body = await c.req.valid("json");
          const result = await this.updateTodoUsecase.execute({
            id,
            title: body.title,
            description: body.description,
          });
          return c.json({
            id: result.todo.id,
            title: result.todo.title,
            description: result.todo.description,
            completed: result.todo.isCompleted,
          });
        } catch (error) {
          switch (true) {
            case error instanceof z.ZodError: {
              const message = error.issues
                .map((issue) => `${issue.path}: ${issue.message}`)
                .join(", ");
              throw new BadRequestError(
                `Invalid request parameters: [${message}]`,
              );
            }
            case error instanceof RepositoryNotFoundError:
              throw new NotFoundError("Todo not found");
          }
          throw new InternalServerError("Failed to update todo", error);
        }
      },
    );
  };
}
