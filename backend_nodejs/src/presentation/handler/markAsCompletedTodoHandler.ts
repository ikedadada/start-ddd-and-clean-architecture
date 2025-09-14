import type { NextFunction, Request, Response } from "express";
import z from "zod";
import type { MarkAsCompletedTodoUsecase } from "@/application_service/usecase/markAsCompletedTodoUsecase";
import { DomainConflictError } from "@/domain/model/errors";
import { RepositoryNotFoundError } from "@/domain/repository/errors";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from "@/presentation/middleware/errorHandler";

const markAsCompletedTodoRequestSchema = z.object({
  params: z.object({
    id: z.uuid({ version: "v7" }),
  }),
});

type MarkAsCompletedTodoResponse = {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
};

export class MarkAsCompletedTodoHandler {
  constructor(private markAsCompletedTodoUsecase: MarkAsCompletedTodoUsecase) {}

  handle = async (
    req: Request,
    res: Response<MarkAsCompletedTodoResponse>,
    next: NextFunction,
  ) => {
    try {
      const parsedReq = markAsCompletedTodoRequestSchema.parse(req);
      const result = await this.markAsCompletedTodoUsecase.execute({
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
