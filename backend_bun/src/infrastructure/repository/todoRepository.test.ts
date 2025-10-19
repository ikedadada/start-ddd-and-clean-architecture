import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "bun:test";
import { SQL } from "bun";
import { Todo } from "@/domain/model/todo";
import type { ContextProvider } from "@/domain/repository/context";
import { RepositoryNotFoundError } from "@/domain/repository/errors";
import { ALSContextProvider, type Conn } from "./context";
import { TodoRepositoryImpl } from "./todoRepository";

describe("TodoRepositoryImpl.save (mocked)", () => {
  it("maps Todo into expected SQL payload", async () => {
    const sqlMock = vi.fn().mockResolvedValue(undefined);
    const contextProvider: ContextProvider<Conn> = {
      get: () => sqlMock as unknown as Conn,
      runWith: vi.fn(),
    };
    const repository = new TodoRepositoryImpl(contextProvider);
    const todo = new Todo("title", "desc");
    todo.markAsCompleted();

    // MySQL specific syntax (`ON DUPLICATE KEY UPDATE`) prevents us from verifying
    // the query end-to-end on SQLite. Instead we mock the connection and assert
    // the generated SQL fragments and bindings here.
    // For Test with testcontainers: https://github.com/testcontainers/testcontainers-node/discussions/1115
    await repository.save(todo);

    expect(sqlMock).toHaveBeenCalledTimes(1);
    const [strings, ...values] = sqlMock.mock.calls[0];
    expect(strings.join(" ")).toContain("ON DUPLICATE KEY UPDATE");
    expect(values).toEqual([
      todo.id,
      todo.title,
      todo.description,
      1,
      todo.title,
      todo.description,
      1,
    ]);
  });
});

describe("TodoRepositoryImpl (SQLite)", () => {
  let sql: SQL;
  let contextProvider: ALSContextProvider;
  let repository: TodoRepositoryImpl;

  beforeAll(async () => {
    sql = new SQL(":memory:");
    contextProvider = new ALSContextProvider(sql);
    repository = new TodoRepositoryImpl(contextProvider);

    await sql`CREATE TABLE todos (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      completed INTEGER NOT NULL DEFAULT 0
    )`;
  });

  afterAll(async () => {
    await sql.close();
  });

  beforeEach(async () => {
    await sql`DELETE FROM todos`;
  });

  it("findById returns Todo when record exists", async () => {
    const todo = Todo.fromPrimitives({
      id: "todo-1",
      title: "stored title",
      description: "stored description",
      isCompleted: true,
    });

    await sql`INSERT INTO todos (id, title, description, completed) VALUES (
      ${todo.id},
      ${todo.title},
      ${todo.description},
      1
    )`;

    const found = await repository.findById(todo.id);

    expect(found.id).toBe(todo.id);
    expect(found.title).toBe(todo.title);
    expect(found.description).toBe(todo.description);
    expect(found.isCompleted).toBe(true);
  });

  it("findById throws when record is missing", async () => {
    await expect(repository.findById("missing")).rejects.toBeInstanceOf(
      RepositoryNotFoundError,
    );
  });

  it("findAll returns every todo", async () => {
    await sql`INSERT INTO todos (id, title, description, completed) VALUES
      ('todo-1', 'first', 'desc1', 0),
      ('todo-2', 'second', NULL, 1)
    `;

    const result = await repository.findAll();

    expect(result).toHaveLength(2);
    const [first, second] = result;
    expect(first.id).toBe("todo-1");
    expect(first.isCompleted).toBe(false);
    expect(second.id).toBe("todo-2");
    expect(second.isCompleted).toBe(true);
  });

  it("delete removes the todo", async () => {
    const todo = Todo.fromPrimitives({
      id: "todo-delete",
      title: "to delete",
      description: null,
      isCompleted: false,
    });
    await sql`INSERT INTO todos (id, title, description, completed) VALUES (
      ${todo.id},
      ${todo.title},
      ${todo.description},
      0
    )`;

    await repository.delete(todo);

    const rows = await sql`SELECT id FROM todos WHERE id = ${todo.id} LIMIT 1`;
    expect(rows).toHaveLength(0);
  });
});
