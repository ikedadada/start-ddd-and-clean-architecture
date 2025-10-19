export interface TransactionService {
  run<T>(fn: () => Promise<T>): Promise<T>;
}
