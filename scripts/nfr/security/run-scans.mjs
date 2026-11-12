#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { assertAllowedTarget, assertSafeRunId } from "../target-guard.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const versions = JSON.parse(await readFile(path.join(root, "scripts/nfr/security/tool-versions.json"), "utf8"));
const target = assertAllowedTarget(process.env.NFR_TARGET ?? "http://127.0.0.1:8080");
const runId = assertSafeRunId(process.env.NFR_RUN_ID ?? "tcg753-security-local");
const output = path.join(root, "artifacts/nfr", runId, "security");
await mkdir(output, { recursive: true });
const commands = [
  { name: "gitleaks", versionArgs: ["version"], args: ["detect", "--source", root, "--no-git", "--redact", "--report-format", "json", "--report-path", path.join(output, "gitleaks.json")] },
  { name: "semgrep", versionArgs: ["--version"], args: ["scan", "--config", "auto", "--json", "--output", path.join(output, "semgrep.json"), root] },
  { name: "trivy", versionArgs: ["--version"], args: ["fs", "--scanners", "vuln,misconfig,secret,license", "--format", "json", "--output", path.join(output, "trivy-fs.json"), root] },
];
const results = [];
for (const command of commands) {
  const expected = versions[command.name];
  const version = spawnSync(command.name, command.versionArgs, { cwd: root, encoding: "utf8", timeout: 10_000, windowsHide: true });
  const versionText = `${version.stdout ?? ""}${version.stderr ?? ""}`;
  if (version.error || version.status !== 0 || !versionText.includes(expected)) {
    results.push({ tool: command.name, status: "Blocked", expectedVersion: expected, reason: version.error?.message ?? `Version mismatch or command failed: ${versionText.trim()}` });
    continue;
  }
  const result = spawnSync(command.name, command.args, { cwd: root, encoding: "utf8", timeout: versions.timeoutSeconds * 1000, windowsHide: true, maxBuffer: 20 * 1024 * 1024 });
  results.push({ tool: command.name, version: expected, status: result.status === 0 ? "Pass" : "Fail", exitCode: result.status, timedOut: result.error?.code === "ETIMEDOUT", stderr: result.stderr?.slice(-4000) });
}

const dockerVersion = spawnSync("docker", ["version", "--format", "{{.Server.Version}}"], { cwd: root, encoding: "utf8", timeout: 10_000, windowsHide: true });
if (dockerVersion.error || dockerVersion.status !== 0) {
  results.push({ tool: "OWASP ZAP", status: "Blocked", image: versions.zapImage, reason: dockerVersion.error?.message ?? "Docker daemon unavailable" });
} else {
  const zap = spawnSync("docker", ["run", "--rm", "--network", "host", versions.zapImage, "zap-baseline.py", "-t", target.toString(), "-m", "5", "-J", path.join(output, "zap.json")], { cwd: root, encoding: "utf8", timeout: versions.timeoutSeconds * 1000, windowsHide: true, maxBuffer: 20 * 1024 * 1024 });
  results.push({ tool: "OWASP ZAP", image: versions.zapImage, status: zap.status === 0 ? "Pass" : "Fail", exitCode: zap.status, timedOut: zap.error?.code === "ETIMEDOUT", stderr: zap.stderr?.slice(-4000) });
}
await writeFile(path.join(output, "scan-run.json"), `${JSON.stringify({ target: target.origin, runId, timeoutSeconds: versions.timeoutSeconds, results }, null, 2)}\n`);
process.stdout.write(`${JSON.stringify(results, null, 2)}\n`);
if (results.some((item) => item.status !== "Pass")) process.exitCode = 1;
