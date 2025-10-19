import { zValidator } from "@hono/zod-validator";
import type { Hono } from "hono";
import z from "zod";
import type { MarkAsCompletedTodoUsecase } from "@/application_service/usecase/markAsCompletedTodoUsecase";
import { DomainConflictError } from "@/domain/model/errors";
import { RepositoryNotFoundError } from "@/domain/repository/errors";
import {
  BadRequestError,
  ConflictError,
  InternalServerError,
  NotFoundError,
} from "@/presentation/middleware/errorHandler";

const markAsCompletedTodoRequestParamSchema = z.object({
  id: z.uuid({ version: "v7" }),
});

export class MarkAsCompletedTodoHandler {
  constructor(private markAsCompletedTodoUsecase: MarkAsCompletedTodoUsecase) {}

  register = (app: Hono) => {
    app.put(
      "/todos/:id/complete",
      zValidator("param", markAsCompletedTodoRequestParamSchema, (result) => {
        if (!result.success) {
          throw new BadRequestError("Invalid request parameters", result.error);
        }
      }),
      async (c) => {
        try {
          const { id } = c.req.valid("param");
          const result = await this.markAsCompletedTodoUsecase.execute({
            id,
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
            case error instanceof DomainConflictError:
              throw new ConflictError(error.message);
          }
          throw new InternalServerError(
            "Failed to mark todo as completed",
            error,
          );
        }
      },
    );
  };
}
