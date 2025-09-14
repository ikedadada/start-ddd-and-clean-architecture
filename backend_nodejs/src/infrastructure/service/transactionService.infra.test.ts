import type { PrismaClient } from "@prisma/client";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { Todo } from "@/domain/model/todo";
import { ALSContextProvider } from "@/infrastructure/repository/context";
import { TodoRepositoryImpl } from "@/infrastructure/repository/todoRepository";
import { TransactionServiceImpl } from "@/infrastructure/service/transactionService";
import { PrismaClient as TestPrismaClient } from "../../../generated/prisma-test";

describe("TransactionServiceImpl (infra, sqlite)", () => {
  const prisma = new TestPrismaClient() as unknown as PrismaClient;
  const provider = new ALSContextProvider(prisma);
  const tx = new TransactionServiceImpl(prisma, provider);
  const repo = new TodoRepositoryImpl(provider);

  beforeEach(async () => {
    await prisma.todos.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("commits operations executed within run", async () => {
    const t = new Todo("title-commit");
    await tx.run(async () => {
      await repo.save(t);
    });
    const all = await repo.findAll();
    expect(all.map((x) => x.id)).toContain(t.id);
  });

  it("rolls back when an error is thrown inside run", async () => {
    const t = new Todo("title-rollback");
    await expect(
      tx.run(async () => {
        await repo.save(t);
        throw new Error("boom");
      }),
    ).rejects.toBeInstanceOf(Error);
    const all = await repo.findAll();
    expect(all.map((x) => x.id)).not.toContain(t.id);
  });
});
