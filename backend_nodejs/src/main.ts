import { PrismaClient } from "@prisma/client";
import express from "express";
import { CreateTodoUsecaseImpl } from "@/application_service/usecase/createTodoUsecase";
import { DeleteTodoUsecaseImpl } from "@/application_service/usecase/deleteTodoUsecase";
import { GetAllTodosUsecaseImpl } from "@/application_service/usecase/getAllTodosUsecase";
import { GetTodoUsecaseImpl } from "@/application_service/usecase/getTodoUsecase";
import { MarkAsCompletedTodoUsecaseImpl } from "@/application_service/usecase/markAsCompletedTodoUsecase";
import { MarkAsNotCompletedTodoUsecaseImpl } from "@/application_service/usecase/markAsNotCompletedTodoUsecase";
import { UpdateTodoUsecaseImpl } from "@/application_service/usecase/updateTodoUsecase";
import { TodoRepositoryImpl } from "@/infrastructure/repository/todoRepository";
import { TransactionServiceImpl } from "@/infrastructure/service/transactionService";
import { GetAllTodosHandler } from "@/presentation/handler/getAllTodoHandler";
import { GetTodoHandler } from "@/presentation/handler/getTodoHandler";
import { errorHandler } from "@/presentation/middleware/errorHandler";
import { ALSContextPrivider } from "./infrastructure/repository/context";
import { CreateTodoHandler } from "./presentation/handler/createTodoHandler";
import { DeleteTodoHandler } from "./presentation/handler/deleteTodoHandler";
import { MarkAsCompletedTodoHandler } from "./presentation/handler/markAsCompletedTodoHandler";
import { MarkAsNotCompletedTodoHandler } from "./presentation/handler/markAsNotCompletedTodoHandler";
import { UpdateTodoHandler } from "./presentation/handler/updateTodoHandler";
import { routeNotFoundHandler } from "./presentation/middleware/routeNotFoundHandler";

const prismaClient = new PrismaClient();
const contextProvider = new ALSContextPrivider(prismaClient);

const todoRepository = new TodoRepositoryImpl(contextProvider);
const transactionService = new TransactionServiceImpl(
  prismaClient,
  contextProvider,
);

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
const app = express();

app.use(express.json());

app.get("/healthcheck", (_, res) => {
  res.send("OK");
});

app.get("/todos", getAllTodoHandler.handle);
app.get("/todos/:id", getTodoHandler.handle);
app.post("/todos", createTodoHandler.handle);
app.put("/todos/:id", updateTodoHandler.handle);
app.delete("/todos/:id", deleteTodoHandler.handle);
app.put("/todos/:id/complete", markAsCompletedTodoHandler.handle);
app.put("/todos/:id/uncomplete", markAsNotCompletedTodoHandler.handle);

app.use(errorHandler);
app.use(routeNotFoundHandler);

app.listen(3000, () => console.log("Server is listening on port 3000..."));
