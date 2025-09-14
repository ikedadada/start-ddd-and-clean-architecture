import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Ensure each Vitest worker uses its own SQLite DB file.
// This avoids write-contention and flakiness when running infra tests in parallel.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const workerId = process.env.VITEST_WORKER_ID || "0";

const tmpDir = path.resolve(__dirname, "./tmp");
const workerDbName = `test-worker-${workerId}.db`;

// Ensure tmp dir exists
fs.mkdirSync(tmpDir, { recursive: true });

// Prisma expects a URL string, relative paths are fine
process.env.DATABASE_URL = `file:./tmp/${workerDbName}`;

// Ensure the per-worker DB has the expected schema by pushing it directly
// to the worker's database file.
try {
  const { spawnSync } = await import("node:child_process");
  const prismaBin = path.resolve(__dirname, "./node_modules/.bin/prisma");
  const res = spawnSync(
    prismaBin,
    ["db", "push", "--schema=prisma/test.prisma", "--skip-generate"],
    {
      cwd: __dirname,
      env: { ...process.env, DATABASE_URL: `file:./tmp/${workerDbName}` },
      stdio: "pipe",
    },
  );
  if (res.status !== 0) {
    // eslint-disable-next-line no-console
    console.warn(
      "[vitest.setup] prisma db push failed:",
      res.stderr?.toString?.(),
    );
  }
} catch (e) {
  // eslint-disable-next-line no-console
  console.warn("[vitest.setup] Failed to run prisma db push:", e);
}
