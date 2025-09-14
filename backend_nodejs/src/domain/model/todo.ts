import { newId } from "@/domain/model/newId";
import { DomainConflictError } from "./errors";

export type TodoPrimitives = {
  id: string;
  title: string;
  description: string | null;
  isCompleted: boolean;
};

export class Todo {
  private _id: string;
  private _title: string;
  private _description: string | null;
  private _isCompleted: boolean = false;

  constructor(title: string, description?: string) {
    this._id = newId();
    this._title = title;
    this._description = description ?? null;
  }

  get id(): string {
    return this._id;
  }

  get title(): string {
    return this._title;
  }

  get description(): string | null {
    return this._description;
  }

  get isCompleted(): boolean {
    return this._isCompleted;
  }

  updateTitle(title: string) {
    this._title = title;
  }

  updateDescription(description: string | null) {
    this._description = description;
  }

  markAsCompleted() {
    if (this.isCompleted) {
      throw new DomainConflictError("Already completed");
    }
    this._isCompleted = true;
  }

  markAsNotCompleted() {
    if (!this.isCompleted) {
      throw new DomainConflictError("Already not completed");
    }
    this._isCompleted = false;
  }

  static fromPrimitives(props: TodoPrimitives): Todo {
    const todo = new Todo(props.title, props.description ?? undefined);
    todo._id = props.id;
    todo._isCompleted = props.isCompleted;
    return todo;
  }

  toPrimitives(): TodoPrimitives {
    return {
      id: this._id,
      title: this._title,
      description: this._description,
      isCompleted: this._isCompleted,
    };
  }
}
