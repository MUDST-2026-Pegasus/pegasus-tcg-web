#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { assertAllowedTarget, assertSafeRunId } from "./target-guard.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const config = JSON.parse(await readFile(path.join(root, "scripts/nfr/fe/config.json"), "utf8"));
const target = assertAllowedTarget(process.env.NFR_UI_TARGET ?? "http://127.0.0.1:4173");
const runId = assertSafeRunId(process.env.NFR_RUN_ID ?? "tcg753-fe-local");
const apiBase = assertAllowedTarget(process.env.NFR_API_BASE_URL ?? "https://pegasus-dev.gameinwza.com");
const apiTimeout = AbortSignal.timeout(8_000);
let listingId = process.env.NFR_LISTING_ID;
if (!listingId) {
  const response = await fetch(new URL("/api/v1/listings?page=0&size=20", apiBase), { signal: apiTimeout, headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`Could not discover a Dev listing ID: HTTP ${response.status}`);
  const envelope = await response.json();
  const items = envelope?.data?.items;
  if (!Array.isArray(items) || !items.length || items[0]?.id == null) throw new Error("Dev API returned no usable listing IDs");
  listingId = String(items[0].id);
}
if (!/^\d+$/.test(listingId)) throw new Error("NFR_LISTING_ID must be a numeric Dev listing ID");
const browser = process.env.NFR_BROWSER ?? "electron";
if (!["chrome", "edge", "firefox", "webkit", "electron"].includes(browser)) throw new Error("NFR_BROWSER must be chrome, edge, firefox, webkit, or electron");
const packageJson = JSON.parse(await readFile(path.join(root, "node_modules/cypress/package.json"), "utf8"));
if (packageJson.version !== config.cypressVersion) throw new Error(`Expected Cypress ${config.cypressVersion}; found ${packageJson.version}`);
const output = path.join(root, "artifacts/nfr", runId, "frontend");
await mkdir(output, { recursive: true });
const cypress = path.join(root, "node_modules/cypress/bin/cypress");
const cypressEnv = [`nfrRunId=${runId}`, `listingId=${listingId}`, `nfrApiHost=${apiBase.hostname.toLowerCase()}`];
if (process.env.NFR_MOBILE === "1") cypressEnv.push("mobile=true");
const args = [cypress, "run", "--spec", "src/test/cypress/e2e/nfr/tcg-753-nfr.cy.ts", "--browser", browser, "--config", `baseUrl=${target.origin},screenshotsFolder=${path.join(output, "screenshots")}`, "--env", cypressEnv.join(",")];
const result = spawnSync(process.execPath, args, { cwd: root, encoding: "utf8", timeout: config.timeoutSeconds * 1000, windowsHide: true, maxBuffer: 30 * 1024 * 1024 });
const log = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
await writeFile(path.join(output, "cypress.log"), log);
let summary = { status: "Blocked", reasons: ["Cypress NFR measurements were not produced"], measurements: 0, thresholdBreaches: [] };
try {
  const measurements = JSON.parse(await readFile(path.join(output, "measurements.json"), "utf8"));
  const expectedMeasurements = config.pages.length * config.runsPerPage;
  const missingLcp = measurements.filter((item) => item.lcpMs === null || item.lcpMs === undefined).length;
  const missingInteraction = measurements.filter((item) => item.interactionLatencyMs === null || item.interactionLatencyMs === undefined).length;
  const incompletePage = measurements.filter((item) => !item.mainContentVisible).length;
  const thresholdBreaches = measurements.filter((item) => item.lcpMs > 2500 || item.cls > 0.1 || item.interactionLatencyMs > 200).map(({ page, run, lcpMs, cls, interactionLatencyMs }) => ({ page, run, lcpMs, cls, interactionLatencyMs }));
  const reasons = [];
  if (result.status !== 0) reasons.push(`Cypress exited with ${result.status}; review cypress.log for failed UI/a11y assertions`);
  if (measurements.length !== expectedMeasurements) reasons.push(`Expected ${expectedMeasurements} page runs; captured ${measurements.length}`);
  if (missingLcp) reasons.push(`LCP unavailable in ${missingLcp} page runs`);
  if (missingInteraction) reasons.push(`Interaction latency unavailable in ${missingInteraction} page runs`);
  if (incompletePage) reasons.push(`Main app content unavailable in ${incompletePage} page runs`);
  if (thresholdBreaches.length) reasons.push(`${thresholdBreaches.length} frozen performance budget breaches`);
  summary = { status: thresholdBreaches.length || result.status !== 0 ? "Fail" : reasons.length ? "Blocked" : "Pass", reasons, measurements: measurements.length, expectedMeasurements, missingLcp, missingInteraction, incompletePage, thresholdBreaches };
} catch (error) {
  summary.reasons = [`Could not read measurement evidence: ${error.message}`];
}
await writeFile(path.join(output, "summary.json"), `${JSON.stringify({ runId, target: target.origin, apiTarget: apiBase.origin, listingId, browser, cypressVersion: config.cypressVersion, cypressExitCode: result.status, ...summary }, null, 2)}\n`);
if (result.error) {
  process.stderr.write(`Frontend NFR execution failed: ${result.error.message}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(log);
  process.stdout.write(`\nFrontend NFR summary: ${JSON.stringify(summary)}\n`);
  process.exitCode = result.status === 0 && summary.status === "Pass" ? 0 : 1;
}
