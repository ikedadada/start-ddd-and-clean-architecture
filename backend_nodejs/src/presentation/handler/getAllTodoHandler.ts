import type { NextFunction, Request, Response } from "express";
import type { GetAllTodosUsecase } from "@/application_service/usecase/getAllTodosUsecase";

type GetAllTodosResponse = {
  todos: {
    id: string;
    title: string;
    description: string | null;
    completed: boolean;
  }[];
};

export class GetAllTodosHandler {
  constructor(private getAllTodosUsecase: GetAllTodosUsecase) {}

  handle = async (
    _req: Request,
    res: Response<GetAllTodosResponse>,
    _next: NextFunction,
  ) => {
    const { todos } = await this.getAllTodosUsecase.execute();
    res.json({
      todos: todos.map((todo) => ({
        id: todo.id,
        title: todo.title,
        description: todo.description,
        completed: todo.isCompleted,
      })),
    });
  };
}
