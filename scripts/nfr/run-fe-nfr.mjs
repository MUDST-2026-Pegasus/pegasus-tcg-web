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
const browser = process.env.NFR_BROWSER ?? "electron";
if (!["chrome", "edge", "firefox", "webkit", "electron"].includes(browser)) throw new Error("NFR_BROWSER must be chrome, edge, firefox, webkit, or electron");
const packageJson = JSON.parse(await readFile(path.join(root, "node_modules/cypress/package.json"), "utf8"));
if (packageJson.version !== config.cypressVersion) throw new Error(`Expected Cypress ${config.cypressVersion}; found ${packageJson.version}`);
const output = path.join(root, "artifacts/nfr", runId, "frontend");
await mkdir(output, { recursive: true });
const cypress = path.join(root, "node_modules/cypress/bin/cypress");
const cypressEnv = [`nfrRunId=${runId}`];
if (process.env.NFR_MOBILE === "1") cypressEnv.push("mobile=true");
const args = [cypress, "run", "--spec", "src/test/cypress/e2e/nfr/tcg-753-nfr.cy.ts", "--browser", browser, "--config", `baseUrl=${target.origin},screenshotsFolder=${path.join(output, "screenshots")}`, "--env", cypressEnv.join(",")];
const result = spawnSync(process.execPath, args, { cwd: root, encoding: "utf8", timeout: config.timeoutSeconds * 1000, windowsHide: true, maxBuffer: 30 * 1024 * 1024 });
const log = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
await writeFile(path.join(output, "cypress.log"), log);
if (result.error) {
  process.stderr.write(`Frontend NFR execution failed: ${result.error.message}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(log);
  process.exitCode = result.status ?? 1;
}
