export class DomainConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DomainConflictError";
  }
}
