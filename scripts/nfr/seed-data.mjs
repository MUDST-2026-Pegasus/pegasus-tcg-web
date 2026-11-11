#!/usr/bin/env node
import { createHash, randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { assertAllowedTarget, assertSafeRunId } from "./target-guard.mjs";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "../..");
const runsRoot = path.join(repositoryRoot, ".nfr-runs");

function readArguments(argv) {
  const values = new Map();
  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];
    if (!key.startsWith("--")) throw new Error(`Unexpected argument: ${key}`);
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) throw new Error(`Missing value for ${key}`);
    values.set(key.slice(2), value);
    index += 1;
  }
  return values;
}

function deterministicId(runId, index, prefix) {
  const digest = createHash("sha256").update(`${runId}:${prefix}:${index}`).digest("hex").slice(0, 12);
  return `${prefix}-${digest}`;
}

function buildDataset(runId, recordCount) {
  return {
    schemaVersion: 1,
    runId,
    generatedAt: new Date().toISOString(),
    syntheticOnly: true,
    records: Array.from({ length: recordCount }, (_, index) => ({
      userId: deterministicId(runId, index, "user"),
      email: `tcg753-${index}@example.invalid`,
      username: `nfr-${runId}-${index}`,
      productId: index + 1,
      listingId: 100_000 + index,
      orderId: 200_000 + index,
      sku: `TCG753-${String(index + 1).padStart(6, "0")}`,
      priceMinor: 100 + (index % 99) * 100,
      quantity: 1 + (index % 4),
    })),
  };
}

async function main() {
  const args = readArguments(process.argv.slice(2));
  const target = assertAllowedTarget(args.get("target") ?? "http://127.0.0.1:8080").toString();
  const runId = assertSafeRunId(args.get("run-id") ?? `tcg753-${new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14)}-${randomUUID().slice(0, 8)}`);
  const recordCount = Number(args.get("records") ?? "1000");
  if (!Number.isInteger(recordCount) || recordCount < 1 || recordCount > 5000) {
    throw new Error("records must be an integer between 1 and 5000");
  }

  const runDirectory = path.resolve(runsRoot, runId);
  if (!runDirectory.startsWith(`${runsRoot}${path.sep}`)) throw new Error("Refusing to write outside the NFR run root");
  await mkdir(runsRoot, { recursive: true });
  await mkdir(runDirectory, { recursive: false });

  const dataset = buildDataset(runId, recordCount);
  const datasetPath = path.join(runDirectory, "dataset.json");
  await writeFile(datasetPath, `${JSON.stringify(dataset, null, 2)}\n`, { flag: "wx" });
  const manifest = {
    runId,
    target,
    datasetPath: path.relative(repositoryRoot, datasetPath).replaceAll(path.sep, "/"),
    recordCount,
    createdAt: new Date().toISOString(),
    nodeVersion: process.version,
    platform: `${os.platform()}-${os.arch()}`,
    seedMode: "offline synthetic fixture only; no API/database writes",
  };
  await writeFile(path.join(runDirectory, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, { flag: "wx" });
  process.stdout.write(`${JSON.stringify(manifest, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`NFR setup failed: ${error.message}\n`);
  process.exitCode = 1;
});
