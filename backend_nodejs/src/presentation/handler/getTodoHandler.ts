import type { NextFunction, Request, Response } from "express";
import z from "zod";
import type { GetTodoUsecase } from "@/application_service/usecase/getTodoUsecase";
import { RepositoryNotFoundError } from "@/domain/repository/errors";
import {
  BadRequestError,
  NotFoundError,
} from "@/presentation/middleware/errorHandler";

const getTodoRequestSchema = z.object({
  params: z.object({
    id: z.uuid({ version: "v7" }),
  }),
});

type GetTodoResponse = {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
};

export class GetTodoHandler {
  constructor(private getTodoUsecase: GetTodoUsecase) {}

  handle = async (
    req: Request,
    res: Response<GetTodoResponse>,
    next: NextFunction,
  ) => {
    try {
      const parsedReq = getTodoRequestSchema.parse(req);
      const result = await this.getTodoUsecase.execute({
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
      }
      return next(error);
    }
  };
}
