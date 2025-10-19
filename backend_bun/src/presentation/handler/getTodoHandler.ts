import { zValidator } from "@hono/zod-validator";
import type { Hono } from "hono";
import z from "zod";
import type { GetTodoUsecase } from "@/application_service/usecase/getTodoUsecase";
import { RepositoryNotFoundError } from "@/domain/repository/errors";
import {
  BadRequestError,
  InternalServerError,
  NotFoundError,
} from "@/presentation/middleware/errorHandler";

const getTodoRequestParamSchema = z.object({
  id: z.uuid({ version: "v7" }),
});

export class GetTodoHandler {
  constructor(private getTodoUsecase: GetTodoUsecase) {}

  register = (app: Hono) => {
    app.get(
      "/todos/:id",
      zValidator("param", getTodoRequestParamSchema, (result) => {
        if (!result.success) {
          throw new BadRequestError("Invalid request data", result.error);
        }
      }),
      async (c) => {
        try {
          const { id } = c.req.valid("param");
          const result = await this.getTodoUsecase.execute({
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
                `Invalid request data: ${message}`,
                error,
              );
            }
            case error instanceof RepositoryNotFoundError:
              throw new NotFoundError("Todo not found");
          }
          throw new InternalServerError("Failed to get todo", error);
        }
      },
    );
  };
}
