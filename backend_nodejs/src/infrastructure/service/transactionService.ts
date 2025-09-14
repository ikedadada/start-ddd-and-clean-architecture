import type { Prisma, PrismaClient } from "@prisma/client";
import type { TransactionService } from "@/application_service/service/transactionService";
import type { ContextProvider } from "@/domain/repository/context";
import type { Conn } from "../repository/context";

export class TransactionServiceImpl implements TransactionService {
  constructor(
    private readonly prisma: PrismaClient,
    private contextProvider: ContextProvider<Conn>,
  ) {}
  async run<T>(fn: () => Promise<T>): Promise<T> {
    return this.prisma.$transaction((tx: Prisma.TransactionClient) =>
      this.contextProvider.runWith(tx, fn),
    );
  }
}
