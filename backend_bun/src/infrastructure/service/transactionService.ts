import type { SQL } from "bun";
import type { TransactionService } from "@/application_service/service/transactionService";
import type { ContextProvider } from "@/domain/repository/context";
import type { Conn } from "../repository/context";

export class TransactionServiceImpl implements TransactionService {
  constructor(
    private readonly db: SQL,
    private contextProvider: ContextProvider<Conn>,
  ) {}
  async run<T>(fn: () => Promise<T>): Promise<T> {
    return this.db.begin((tx) => {
      return this.contextProvider.runWith(tx, fn);
    });
  }
}
