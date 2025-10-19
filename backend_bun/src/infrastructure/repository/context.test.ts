import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { SQL } from "bun";
import { ALSContextProvider, type Conn } from "./context";

describe("ALSContextProvider", () => {
  let sql: SQL;
  let provider: ALSContextProvider;

  beforeAll(async () => {
    sql = new SQL(":memory:");
    provider = new ALSContextProvider(sql);
    await sql`CREATE TABLE IF NOT EXISTS scratch (id INTEGER PRIMARY KEY, value TEXT)`;
  });

  afterAll(async () => {
    await sql.close();
  });

  it("returns the base connection when no scoped context exists", () => {
    expect(provider.get()).toBe(sql);
  });

  it("yields the scoped connection inside runWith across async boundaries", async () => {
    const tx = { marker: "tx" } as unknown as Conn;

    await provider.runWith(tx, async () => {
      expect(provider.get()).toBe(tx);
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(provider.get()).toBe(tx);
    });
  });

  it("restores the base connection after runWith completes", async () => {
    const tx = { marker: "tx" } as unknown as Conn;

    await provider.runWith(tx, async () => {
      expect(provider.get()).toBe(tx);
    });

    expect(provider.get()).toBe(sql);
  });
});
