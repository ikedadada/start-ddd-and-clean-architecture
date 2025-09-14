import { describe, expect, it } from "vitest";
import { Todo } from "@/domain/model/todo";
import { DomainConflictError } from "./errors";

describe("Todo domain model", () => {
  it("creates with title and optional description", () => {
    const t1 = new Todo("task-1");
    expect(typeof t1.id).toBe("string");
    expect(t1.id.length).toBeGreaterThan(0);
    expect(t1.title).toBe("task-1");
    expect(t1.description).toBeNull();
    expect(t1.isCompleted).toBe(false);

    const t2 = new Todo("task-2", "desc");
    expect(t2.title).toBe("task-2");
    expect(t2.description).toBe("desc");
  });

  it("updates title", () => {
    const todo = new Todo("old");
    todo.updateTitle("new");
    expect(todo.title).toBe("new");
  });

  it("updates description and can set null", () => {
    const todo = new Todo("t", "first");
    expect(todo.description).toBe("first");
    todo.updateDescription("second");
    expect(todo.description).toBe("second");
    todo.updateDescription(null);
    expect(todo.description).toBeNull();
  });

  it("marks as completed once", () => {
    const todo = new Todo("t");
    todo.markAsCompleted();
    expect(todo.isCompleted).toBe(true);
  });

  it("throws when marking completed twice", () => {
    const todo = new Todo("t");
    todo.markAsCompleted();
    expect(() => todo.markAsCompleted()).toThrow(DomainConflictError);
  });

  it("throws when marking not completed while already not completed", () => {
    const todo = new Todo("t");
    expect(todo.isCompleted).toBe(false);
    expect(() => todo.markAsNotCompleted()).toThrow(DomainConflictError);
  });

  it("can revert from completed to not completed", () => {
    const todo = new Todo("t");
    todo.markAsCompleted();
    expect(todo.isCompleted).toBe(true);
    // revert
    todo.markAsNotCompleted();
    expect(todo.isCompleted).toBe(false);
  });

  it("reconstitutes from primitives and exports primitives", () => {
    const data = {
      id: "test-id-1",
      title: "title from db",
      description: "desc from db",
      isCompleted: true,
    } as const;
    const todo = Todo.fromPrimitives({ ...data });
    expect(todo.id).toBe(data.id);
    expect(todo.title).toBe(data.title);
    expect(todo.description).toBe(data.description);
    expect(todo.isCompleted).toBe(true);

    const roundTrip = todo.toPrimitives();
    expect(roundTrip).toEqual(data);
  });
});
