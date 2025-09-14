import type { PrismaClient } from "@prisma/client";
import { describe, expect, it } from "vitest";
import {
  ALSContextProvider,
  type Conn,
} from "@/infrastructure/repository/context";
import { PrismaClient as TestPrismaClient } from "../../../generated/prisma-test";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

describe("ALSContextProvider (infra)", () => {
  const base = new TestPrismaClient();
  const provider = new ALSContextProvider(base as unknown as PrismaClient);

  it("returns base context when not in a scope", () => {
    expect(provider.get()).toBe(base);
  });

  it("scopes context within runWith and restores after", async () => {
    const tx = {} as unknown as Conn;
    expect(provider.get()).toBe(base);
    await provider.runWith(tx, async () => {
      expect(provider.get()).toBe(tx);
      await sleep(0);
      expect(provider.get()).toBe(tx);
    });
    expect(provider.get()).toBe(base);
  });

  it("keeps contexts isolated across parallel scopes", async () => {
    const tx1 = { tag: 1 } as unknown as Conn;
    const tx2 = { tag: 2 } as unknown as Conn;
    await Promise.all([
      provider.runWith(tx1, async () => {
        await sleep(10);
        expect(provider.get()).toBe(tx1);
      }),
      provider.runWith(tx2, async () => {
        await sleep(1);
        expect(provider.get()).toBe(tx2);
      }),
    ]);
    expect(provider.get()).toBe(base);
  });
});
