import { v7 } from "uuid";

export function newId(): string {
  return v7();
}
