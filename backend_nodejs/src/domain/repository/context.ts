export interface ContextProvider<C> {
  get(): C;
  runWith<T>(context: C, fn: () => Promise<T>): Promise<T>;
}
