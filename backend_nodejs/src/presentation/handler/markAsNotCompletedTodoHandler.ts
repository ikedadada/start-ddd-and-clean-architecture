import type { NextFunction, Request, Response } from "express";
import z from "zod";
import type { MarkAsNotCompletedTodoUsecase } from "@/application_service/usecase/markAsNotCompletedTodoUsecase";
import { DomainConflictError } from "@/domain/model/errors";
import { RepositoryNotFoundError } from "@/domain/repository/errors";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from "@/presentation/middleware/errorHandler";

const markAsNotCompletedTodoRequestSchema = z.object({
  params: z.object({
    id: z.uuid({ version: "v7" }),
  }),
});

type MarkAsNotCompletedTodoResponse = {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
};

export class MarkAsNotCompletedTodoHandler {
  constructor(
    private markAsNotCompletedTodoUsecase: MarkAsNotCompletedTodoUsecase,
  ) {}

  handle = async (
    req: Request,
    res: Response<MarkAsNotCompletedTodoResponse>,
    next: NextFunction,
  ) => {
    try {
      const parsedReq = markAsNotCompletedTodoRequestSchema.parse(req);
      const result = await this.markAsNotCompletedTodoUsecase.execute({
        id: parsedReq.params.id,
      });
      res.json({
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
          return next(
            new BadRequestError(`Invalid request parameters: [${message}]`),
          );
        }
        case error instanceof RepositoryNotFoundError:
          return next(new NotFoundError("Todo not found"));
        case error instanceof DomainConflictError:
          return next(new ConflictError(error.message));
      }
      return next(error);
    }
  };
}
