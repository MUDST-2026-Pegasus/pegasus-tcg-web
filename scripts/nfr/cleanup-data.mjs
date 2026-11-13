#!/usr/bin/env node
import { lstat, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { assertSafeRunId } from "./target-guard.mjs";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "../..");
const runsRoot = path.join(repositoryRoot, ".nfr-runs");

async function main() {
  const runId = process.argv[2];
  if (!runId || process.argv.length !== 3) {
    throw new Error("Usage: node scripts/nfr/cleanup-data.mjs <run-id>");
  }
  assertSafeRunId(runId);

  const runDirectory = path.resolve(runsRoot, runId);
  if (!runDirectory.startsWith(`${runsRoot}${path.sep}`)) throw new Error("Refusing to clean outside the NFR run root");
  const info = await lstat(runDirectory);
  if (!info.isDirectory() || info.isSymbolicLink()) throw new Error("Refusing to clean a non-directory or symbolic link");
  await rm(runDirectory, { recursive: true, force: false });
  process.stdout.write(`Removed NFR run data: ${path.relative(repositoryRoot, runDirectory).replaceAll(path.sep, "/")}\n`);
}

const cliTimeout = setTimeout(() => {
  process.stderr.write("NFR cleanup timed out after 10 seconds\n");
  process.exit(1);
}, 10_000);
cliTimeout.unref();
main().catch((error) => {
  process.stderr.write(`NFR cleanup failed: ${error.message}\n`);
  process.exitCode = 1;
}).finally(() => clearTimeout(cliTimeout));
