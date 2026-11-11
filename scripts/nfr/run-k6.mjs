#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { assertAllowedTarget } from "./target-guard.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const profiles = JSON.parse(await readFile(path.join(root, "scripts/nfr/k6/profiles.json"), "utf8"));
const [mode = "smoke", ...flags] = process.argv.slice(2);
if (!Object.hasOwn(profiles.profiles, mode)) throw new Error(`Usage: node scripts/nfr/run-k6.mjs <${Object.keys(profiles.profiles).join("|")}> [--dry-run]`);
const dryRun = flags.includes("--dry-run");
if (flags.some((flag) => flag !== "--dry-run")) throw new Error(`Unknown option: ${flags.find((flag) => flag !== "--dry-run")}`);
const target = assertAllowedTarget(process.env.NFR_TARGET ?? "http://127.0.0.1:8080/api/v1");
const executable = process.platform === "win32" ? "k6.exe" : "k6";
const version = spawnSync(executable, ["version"], { encoding: "utf8", timeout: 10_000, windowsHide: true });
if (version.error || version.status !== 0) throw new Error(`Pinned k6 ${profiles.version} is required; executable unavailable: ${version.error?.message ?? version.stderr}`);
if (!version.stdout.includes(profiles.version)) throw new Error(`Expected pinned k6 ${profiles.version}, found: ${version.stdout.trim()}`);

const runId = process.env.NFR_RUN_ID ?? `tcg753-${mode}`;
const outputDirectory = path.join(root, "artifacts/nfr", runId, "performance");
await mkdir(outputDirectory, { recursive: true });
const args = ["run", "--tag", `run_id=${runId}`, "--env", `MODE=${mode}`, "--env", `TARGET=${target.toString().replace(/\/$/, "")}`, "--summary-export", path.join(outputDirectory, `${mode}-summary.json`), path.join(root, "scripts/nfr/k6/scenarios.js")];
if (dryRun) args.splice(1, 0, "--duration", "1s");
const result = spawnSync(executable, args, { cwd: root, stdio: "inherit", timeout: profiles.timeoutSeconds[mode] * 1000, windowsHide: true, env: { ...process.env, DRY_RUN: dryRun ? "1" : "0" } });
if (result.error) throw new Error(`k6 failed or timed out: ${result.error.message}`);
process.exitCode = result.status ?? 1;
