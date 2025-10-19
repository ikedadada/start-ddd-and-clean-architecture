import { Hono } from "hono";
import { CreateTodoUsecaseImpl } from "@/application_service/usecase/createTodoUsecase";
import { DeleteTodoUsecaseImpl } from "@/application_service/usecase/deleteTodoUsecase";
import { GetAllTodosUsecaseImpl } from "@/application_service/usecase/getAllTodosUsecase";
import { GetTodoUsecaseImpl } from "@/application_service/usecase/getTodoUsecase";
import { MarkAsCompletedTodoUsecaseImpl } from "@/application_service/usecase/markAsCompletedTodoUsecase";
import { MarkAsNotCompletedTodoUsecaseImpl } from "@/application_service/usecase/markAsNotCompletedTodoUsecase";
import { UpdateTodoUsecaseImpl } from "@/application_service/usecase/updateTodoUsecase";
import { ALSContextProvider } from "@/infrastructure/repository/context";
import { db } from "@/infrastructure/repository/db";
import { TodoRepositoryImpl } from "@/infrastructure/repository/todoRepository";
import { TransactionServiceImpl } from "@/infrastructure/service/transactionService";
import { CreateTodoHandler } from "@/presentation/handler/createTodoHandler";
import { DeleteTodoHandler } from "@/presentation/handler/deleteTodoHandler";
import { GetAllTodosHandler } from "@/presentation/handler/getAllTodoHandler";
import { GetTodoHandler } from "@/presentation/handler/getTodoHandler";
import { MarkAsCompletedTodoHandler } from "@/presentation/handler/markAsCompletedTodoHandler";
import { MarkAsNotCompletedTodoHandler } from "@/presentation/handler/markAsNotCompletedTodoHandler";
import { UpdateTodoHandler } from "@/presentation/handler/updateTodoHandler";
import { errorHandler } from "@/presentation/middleware/errorHandler";

const contextProvider = new ALSContextProvider(db);
const todoRepository = new TodoRepositoryImpl(contextProvider);
const transactionService = new TransactionServiceImpl(db, contextProvider);

const getAllTodosUsecase = new GetAllTodosUsecaseImpl(todoRepository);
const getTodoUsecase = new GetTodoUsecaseImpl(todoRepository);
const createTodoUsecase = new CreateTodoUsecaseImpl(todoRepository);
const updateTodoUsecase = new UpdateTodoUsecaseImpl(
  todoRepository,
  transactionService,
);
const deleteTodoUsecase = new DeleteTodoUsecaseImpl(
  todoRepository,
  transactionService,
);
const markAsCompletedTodoUsecase = new MarkAsCompletedTodoUsecaseImpl(
  todoRepository,
  transactionService,
);
const markAsNotCompletedTodoUsecase = new MarkAsNotCompletedTodoUsecaseImpl(
  todoRepository,
  transactionService,
);

const getAllTodoHandler = new GetAllTodosHandler(getAllTodosUsecase);
const getTodoHandler = new GetTodoHandler(getTodoUsecase);
const createTodoHandler = new CreateTodoHandler(createTodoUsecase);
const updateTodoHandler = new UpdateTodoHandler(updateTodoUsecase);
const deleteTodoHandler = new DeleteTodoHandler(deleteTodoUsecase);
const markAsCompletedTodoHandler = new MarkAsCompletedTodoHandler(
  markAsCompletedTodoUsecase,
);
const markAsNotCompletedTodoHandler = new MarkAsNotCompletedTodoHandler(
  markAsNotCompletedTodoUsecase,
);

const app = new Hono();
app.onError(errorHandler);

getAllTodoHandler.register(app);
getTodoHandler.register(app);
createTodoHandler.register(app);
updateTodoHandler.register(app);
deleteTodoHandler.register(app);
markAsCompletedTodoHandler.register(app);
markAsNotCompletedTodoHandler.register(app);

export default {
  fetch: app.fetch,
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
};
