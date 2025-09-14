import type { NextFunction, Request, Response } from "express";
import z from "zod";
import type { DeleteTodoUsecase } from "@/application_service/usecase/deleteTodoUsecase";
import { RepositoryNotFoundError } from "@/domain/repository/errors";
import {
  BadRequestError,
  NotFoundError,
} from "@/presentation/middleware/errorHandler";

const deleteTodoRequestSchema = z.object({
  params: z.object({
    id: z.uuid({ version: "v7" }),
  }),
});

export class DeleteTodoHandler {
  constructor(private deleteTodoUsecase: DeleteTodoUsecase) {}

  handle = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsedReq = deleteTodoRequestSchema.parse(req);
      await this.deleteTodoUsecase.execute({
        id: parsedReq.params.id,
      });
      res.status(204).json({});
    } catch (error) {
      switch (true) {
        case error instanceof z.ZodError: {
          const message = error.issues
            .map((issue) => `${issue.path}: ${issue.message}`)
            .join(", ");
          return next(
            new BadRequestError(`Invalid request parameters: [${message}]`),
          );
        }
        case error instanceof RepositoryNotFoundError:
          return next(new NotFoundError("Todo not found"));
      }
      return next(error);
    }
  };
}
