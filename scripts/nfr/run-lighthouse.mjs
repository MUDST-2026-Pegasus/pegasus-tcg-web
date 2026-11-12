#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { assertAllowedTarget, assertSafeRunId } from "./target-guard.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const config = JSON.parse(await readFile(path.join(root, "scripts/nfr/fe/config.json"), "utf8"));
const target = assertAllowedTarget(process.env.NFR_UI_TARGET ?? "http://127.0.0.1:4173");
const runId = assertSafeRunId(process.env.NFR_RUN_ID ?? "tcg753-lighthouse-local");
const apiBase = assertAllowedTarget(process.env.NFR_API_BASE_URL ?? "https://pegasus-dev.gameinwza.com");
let listingId = process.env.NFR_LISTING_ID;
if (!listingId) {
  const response = await fetch(new URL("/api/v1/listings?page=0&size=20", apiBase), { signal: AbortSignal.timeout(8_000), headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`Could not discover a Dev listing ID: HTTP ${response.status}`);
  const envelope = await response.json();
  const items = envelope?.data?.items;
  if (!Array.isArray(items) || !items.length || items[0]?.id == null) throw new Error("Dev API returned no usable listing IDs");
  listingId = String(items[0].id);
}
if (!/^\d+$/.test(listingId)) throw new Error("NFR_LISTING_ID must be a numeric Dev listing ID");
const output = path.join(root, "artifacts/nfr", runId, "lighthouse");
await mkdir(output, { recursive: true });
const usePnpmDlx = process.env.NFR_LIGHTHOUSE_VIA_PNPM === "1";
function runLighthouse(args, timeout) {
  if (process.env.NFR_LIGHTHOUSE_CLI) {
    return spawnSync(process.execPath, [process.env.NFR_LIGHTHOUSE_CLI, ...args], { cwd: root, encoding: "utf8", timeout, windowsHide: true, maxBuffer: 15 * 1024 * 1024 });
  }
  if (usePnpmDlx) {
    const bin = process.platform === "win32" ? "corepack.cmd" : "corepack";
    return spawnSync(bin, ["pnpm", "dlx", `lighthouse@${config.lighthouseVersion}`, ...args], { cwd: root, encoding: "utf8", timeout, windowsHide: true, shell: true, maxBuffer: 15 * 1024 * 1024 });
  }
  return spawnSync("lighthouse", args, { cwd: root, encoding: "utf8", timeout, windowsHide: true, maxBuffer: 15 * 1024 * 1024 });
}
const version = runLighthouse(["--version"], 30_000);
if (version.error || version.status !== 0 || !version.stdout.includes(config.lighthouseVersion)) {
  const reason = version.error?.message ?? `Expected Lighthouse ${config.lighthouseVersion}; found ${version.stdout?.trim() ?? version.stderr?.trim()}`;
  await writeFile(path.join(output, "run.json"), `${JSON.stringify({ runId, target: target.origin, status: "Blocked", reason }, null, 2)}\n`);
  process.stderr.write(`Lighthouse NFR run blocked: ${reason}\n`);
  process.exit(1);
}

const results = [];
let failed = false;
for (const page of config.pages) {
  for (let run = 1; run <= config.runsPerPage; run += 1) {
    const url = new URL(page.path.replace("{listingId}", listingId), target);
    const reportPath = path.join(output, `${page.name}-run-${run}.json`);
    const args = [url.toString(), "--quiet", "--chrome-flags=--headless --no-sandbox", "--only-categories=performance", "--output=json", `--output-path=${reportPath}`, "--max-wait-for-load=45000"];
    if (process.env.CHROME_PATH) args.push(`--chrome-path=${process.env.CHROME_PATH}`);
    const result = runLighthouse(args, 120_000);
    if (result.error || result.status !== 0) {
      failed = true;
      results.push({ page: page.name, run, status: "Fail", reason: result.error?.message ?? result.stderr?.slice(-2000), exitCode: result.status });
      continue;
    }
    const report = JSON.parse(await readFile(reportPath, "utf8"));
    const audits = report.audits;
    const metrics = { lcpMs: audits["largest-contentful-paint"]?.numericValue, cls: audits["cumulative-layout-shift"]?.numericValue, tbtMs: audits["total-blocking-time"]?.numericValue, jsTransferBytes: audits["total-byte-weight"]?.numericValue };
    const passed = metrics.lcpMs <= 2500 && metrics.cls <= 0.1 && metrics.tbtMs <= 200;
    if (!passed) failed = true;
    results.push({ page: page.name, run, status: passed ? "Pass" : "Fail", metrics, interactionLatencyNote: "TBT is a lab proxy; real INP/interaction <=200ms requires browser interaction trace or field data." });
  }
}
await writeFile(path.join(output, "run.json"), `${JSON.stringify({ runId, target: target.origin, apiTarget: apiBase.origin, listingId, lighthouseVersion: config.lighthouseVersion, runsPerPage: config.runsPerPage, results }, null, 2)}\n`);
process.stdout.write(`${JSON.stringify({ results, report: path.join(output, "run.json") }, null, 2)}\n`);
if (failed) process.exitCode = 1;
