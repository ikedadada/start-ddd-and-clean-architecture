import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "bun:test";
import { SQL } from "bun";
import { ALSContextProvider } from "../repository/context";
import { TransactionServiceImpl } from "./transactionService";

describe("TransactionServiceImpl (SQLite)", () => {
  let sql: SQL;
  let contextProvider: ALSContextProvider;
  let service: TransactionServiceImpl;

  beforeAll(async () => {
    sql = new SQL(":memory:");
    contextProvider = new ALSContextProvider(sql);
    service = new TransactionServiceImpl(sql, contextProvider);

    await sql`CREATE TABLE IF NOT EXISTS entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      value TEXT NOT NULL
    )`;
  });

  afterAll(async () => {
    await sql.close();
  });

  beforeEach(async () => {
    await sql`DELETE FROM entries`;
  });

  it("commits changes when the callback resolves", async () => {
    await service.run(async () => {
      const db = contextProvider.get();
      await db`INSERT INTO entries (value) VALUES ('committed')`;
    });

    const rows = await sql`SELECT value FROM entries`;
    expect(rows).toHaveLength(1);
    expect(rows[0].value).toBe("committed");
  });

  it("rolls back changes when the callback rejects", async () => {
    await expect(
      service.run(async () => {
        const db = contextProvider.get();
        await db`INSERT INTO entries (value) VALUES ('rolled-back')`;
        throw new Error("fail");
      }),
    ).rejects.toThrow("fail");

    const rows = await sql`SELECT value FROM entries`;
    expect(rows).toHaveLength(0);
  });

  it("restores the base connection after completing the transaction", async () => {
    const baseBefore = contextProvider.get();

    const result = await service.run(async () => {
      const tx = contextProvider.get();
      expect(tx).not.toBe(baseBefore);
      await tx`INSERT INTO entries (value) VALUES ('scoped')`;
      return "done";
    });

    expect(result).toBe("done");
    expect(contextProvider.get()).toBe(baseBefore);
  });
});
