import type { PrismaClient } from "@prisma/client";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { Todo } from "@/domain/model/todo";
import type { ContextProvider } from "@/domain/repository/context";
import { RepositoryNotFoundError } from "@/domain/repository/errors";
import type { Conn } from "@/infrastructure/repository/context";
import { TodoRepositoryImpl } from "@/infrastructure/repository/todoRepository";
import { PrismaClient as TestPrismaClient } from "../../../generated/prisma-test";

class TestContextProvider implements ContextProvider<Conn> {
  constructor(private readonly base: PrismaClient) {}
  get() {
    return this.base;
  }
  runWith<T>(_context: Conn, fn: () => Promise<T>): Promise<T> {
    return fn();
  }
}

describe("TodoRepositoryImpl (infra, sqlite)", () => {
  const prisma = new TestPrismaClient() as unknown as PrismaClient;
  const provider = new TestContextProvider(
    prisma,
  ) as unknown as ContextProvider<Conn>;
  const repo = new TodoRepositoryImpl(provider);

  beforeEach(async () => {
    await prisma.todos.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("saves and finds a todo", async () => {
    const t = new Todo("title", "desc");
    await repo.save(t);
    const found = await repo.findById(t.id);
    expect(found.toPrimitives()).toEqual(t.toPrimitives());
  });

  it("lists todos", async () => {
    const t1 = new Todo("a");
    const t2 = new Todo("b", "x");
    await repo.save(t1);
    await repo.save(t2);
    const all = await repo.findAll();
    const ids = all.map((t) => t.id).sort();
    expect(ids).toEqual([t1.id, t2.id].sort());
  });

  it("deletes and throws on findById for missing", async () => {
    const t = new Todo("to-delete");
    await repo.save(t);
    await repo.delete(t);
    await expect(repo.findById(t.id)).rejects.toBeInstanceOf(
      RepositoryNotFoundError,
    );
  });
});
