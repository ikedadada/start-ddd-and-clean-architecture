import { zValidator } from "@hono/zod-validator";
import type { Hono } from "hono";
import z from "zod";
import type { DeleteTodoUsecase } from "@/application_service/usecase/deleteTodoUsecase";
import { RepositoryNotFoundError } from "@/domain/repository/errors";
import {
  BadRequestError,
  InternalServerError,
  NotFoundError,
} from "@/presentation/middleware/errorHandler";

const deleteTodoRequestParamSchema = z.object({
  id: z.uuid({ version: "v7" }),
});

export class DeleteTodoHandler {
  constructor(private deleteTodoUsecase: DeleteTodoUsecase) {}

  register = (app: Hono) => {
    app.delete(
      "/todos/:id",
      zValidator("param", deleteTodoRequestParamSchema, (result) => {
        if (!result.success) {
          throw new BadRequestError("Invalid request data", result.error);
        }
      }),
      async (c) => {
        try {
          const { id } = c.req.valid("param");
          await this.deleteTodoUsecase.execute({
            id,
          });
          return c.body(null, 204);
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
          throw new InternalServerError("Failed to delete todo", error);
        }
      },
    );
  };
}
