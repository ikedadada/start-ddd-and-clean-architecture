import { AsyncLocalStorage } from "node:async_hooks";
import type { SQL, TransactionSQL } from "bun";
import type { ContextProvider } from "@/domain/repository/context";
export type Conn = SQL | TransactionSQL;

export class ALSContextProvider implements ContextProvider<Conn> {
  private readonly als = new AsyncLocalStorage<Conn>();

  constructor(private readonly base: SQL) {
    this.base = base;
  }

  get(): Conn {
    return this.als.getStore() ?? this.base;
  }

  async runWith<T>(context: Conn, fn: () => Promise<T>): Promise<T> {
    return this.als.run(context, fn);
  }
}
