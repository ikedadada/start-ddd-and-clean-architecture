import type { NextFunction, Request, Response } from "express";
import z from "zod";
import type { CreateTodoUsecase } from "@/application_service/usecase/createTodoUsecase";
import { BadRequestError } from "@/presentation/middleware/errorHandler";

const createTodoRequestSchema = z.object({
  body: z.object({
    title: z.string().min(2).max(100),
    description: z.string().max(500).optional(),
  }),
});

type CreateTodoResponse = {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
};

export class CreateTodoHandler {
  constructor(private createTodoUsecase: CreateTodoUsecase) {}

  handle = async (
    req: Request,
    res: Response<CreateTodoResponse>,
    next: NextFunction,
  ) => {
    try {
      const parsedReq = createTodoRequestSchema.parse(req);
      const result = await this.createTodoUsecase.execute({
        title: parsedReq.body.title,
        description: parsedReq.body.description,
      });
      res.status(201).json({
        id: result.todo.id,
        title: result.todo.title,
        description: result.todo.description,
        completed: result.todo.isCompleted,
      });
    } catch (error) {
      switch (true) {
        case error instanceof z.ZodError:
          return next(
            new BadRequestError(`Invalid request parameters: ${error.message}`),
          );
      }
      return next(error);
    }
  };
}
