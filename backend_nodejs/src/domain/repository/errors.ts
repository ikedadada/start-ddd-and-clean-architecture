export class RepositoryNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RepositoryNotFoundError";
  }
}
