#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { assertSafeRunId } from "../target-guard.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const cliTimeout = setTimeout(() => {
  process.stderr.write("Resource analysis timed out after 10 seconds\n");
  process.exit(1);
}, 10_000);
cliTimeout.unref();
const runId = assertSafeRunId(process.argv[2] ?? process.env.NFR_RUN_ID ?? "tcg753-resources-local");
const directory = path.join(root, "artifacts/nfr", runId, "resources");
const phases = {};
for (const phase of ["warmup", "soak-end", "cooldown"]) {
  try { phases[phase] = JSON.parse(await readFile(path.join(directory, `${phase}.json`), "utf8")); }
  catch { phases[phase] = null; }
}
const missingPhases = Object.entries(phases).filter(([, value]) => !value).map(([name]) => name);
const report = { runId, status: missingPhases.length ? "Blocked" : "Not Run", missingPhases, thresholds: { heapGrowthRatio: 0.1, cpuP95Percent: 80, dbPoolPercent: 80, containerRestarts: 0, oomEvents: 0 }, comparisons: [], notes: ["Heap, DB pool, restarts, and OOM metrics require the API/DB/container endpoints to be reachable and the expected metric names/config to be supplied.", "The analyzer never converts missing telemetry into a pass."] };
if (!missingPhases.length) {
  report.comparisons = ["warmup", "soak-end", "cooldown"].map((phase) => ({ phase, samples: phases[phase].samples.length, sourceStatuses: phases[phase].samples.map((sample) => ({ jvm: sample.jvm.status, minio: sample.minio.metrics.status, containers: sample.containers.status })) }));
  report.status = "Not Run";
}
const output = path.join(directory, "analysis.json");
await writeFile(output, `${JSON.stringify(report, null, 2)}\n`);
process.stdout.write(`${JSON.stringify({ output, ...report }, null, 2)}\n`);
clearTimeout(cliTimeout);
if (report.status !== "Pass") process.exitCode = 1;
