import type { NextFunction, Request, Response } from "express";
import z from "zod";
import type { UpdateTodoUsecase } from "@/application_service/usecase/updateTodoUsecase";
import { RepositoryNotFoundError } from "@/domain/repository/errors";
import {
  BadRequestError,
  NotFoundError,
} from "@/presentation/middleware/errorHandler";

const updateTodoRequestSchema = z.object({
  params: z.object({
    id: z.uuid({ version: "v7" }),
  }),
  body: z.object({
    title: z.string().min(2).max(100),
    description: z.string().max(500).optional(),
    completed: z.boolean().optional(),
  }),
});

type UpdateTodoResponse = {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
};

export class UpdateTodoHandler {
  constructor(private updateTodoUsecase: UpdateTodoUsecase) {}

  handle = async (
    req: Request,
    res: Response<UpdateTodoResponse>,
    next: NextFunction,
  ) => {
    try {
      const parsedReq = updateTodoRequestSchema.parse(req);
      const result = await this.updateTodoUsecase.execute({
        id: parsedReq.params.id,
        title: parsedReq.body.title,
        description: parsedReq.body.description,
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
