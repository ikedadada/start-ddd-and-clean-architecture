import type { Hono } from "hono";
import type { GetAllTodosUsecase } from "@/application_service/usecase/getAllTodosUsecase";

export class GetAllTodosHandler {
  constructor(private getAllTodosUsecase: GetAllTodosUsecase) {}

  register = (app: Hono) => {
    app.get("/todos", async (c) => {
      const { todos } = await this.getAllTodosUsecase.execute();
      return c.json({
        todos: todos.map((todo) => ({
          id: todo.id,
          title: todo.title,
          description: todo.description,
          completed: todo.isCompleted,
        })),
      });
    });
  };
}
