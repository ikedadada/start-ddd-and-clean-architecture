import { AsyncLocalStorage } from "node:async_hooks";
import type { Prisma, PrismaClient } from "@prisma/client";
import type { ContextProvider } from "@/domain/repository/context";

export type Conn = PrismaClient | Prisma.TransactionClient;

export class ALSContextProvider implements ContextProvider<Conn> {
  private readonly als = new AsyncLocalStorage<Conn>();

  constructor(private readonly base: PrismaClient) {}

  get(): Conn {
    return this.als.getStore() ?? this.base;
  }

  async runWith<T>(context: Conn, fn: () => Promise<T>): Promise<T> {
    return this.als.run(context, fn);
  }
}
