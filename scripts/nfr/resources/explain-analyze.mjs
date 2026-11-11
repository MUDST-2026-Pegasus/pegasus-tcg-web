#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { assertSafeRunId } from "../target-guard.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const config = JSON.parse(await readFile(path.join(root, "scripts/nfr/resources/config.json"), "utf8"));
const runId = assertSafeRunId(process.env.NFR_RUN_ID ?? "tcg753-db-local");
const host = process.env.PGHOST ?? "127.0.0.1";
const port = process.env.PGPORT ?? "5432";
const allowedHosts = new Set(["localhost", "127.0.0.1", "::1", ...(process.env.NFR_TEST_TARGET_HOSTS ?? "").split(",").map((item) => item.trim().toLowerCase()).filter((item) => item.endsWith(".test") || item.endsWith(".localhost"))]);
if (!allowedHosts.has(host.toLowerCase())) throw new Error(`PostgreSQL host is not allowlisted: ${host}`);
const outputDirectory = path.join(root, "artifacts/nfr", runId, "resources");
await mkdir(outputDirectory, { recursive: true });
const psqlVersion = spawnSync("psql", ["--version"], { cwd: root, encoding: "utf8", timeout: 5000, windowsHide: true });
if (psqlVersion.error || psqlVersion.status !== 0 || !psqlVersion.stdout.includes(config.psqlVersion)) {
  const report = { runId, status: "Blocked", reason: psqlVersion.error?.message ?? `Expected psql ${config.psqlVersion}; got ${psqlVersion.stdout?.trim()}` };
  await writeFile(path.join(outputDirectory, "postgres.json"), `${JSON.stringify(report, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  process.exit(1);
}
const statSql = (await readFile(path.join(root, "scripts/nfr/resources/pg-stat-snapshot.sql"), "utf8")).trim();
const stat = spawnSync("psql", ["-X", "--no-password", "--quiet", "--tuples-only", "--set=ON_ERROR_STOP=1", "--command", statSql], { cwd: root, encoding: "utf8", timeout: config.psqlTimeoutMs, windowsHide: true, env: { ...process.env, PGHOST: host, PGPORT: port, PGCONNECT_TIMEOUT: "5" } });
const report = { runId, host, port, psqlVersion: config.psqlVersion, snapshot: stat.status === 0 ? stat.stdout.trim() : null, pgStatStatements: "Not Run: extension data is collected separately when pg_stat_statements is installed", status: stat.status === 0 ? "Pass" : "Blocked", reason: stat.error?.message ?? stat.stderr?.trim() };
if (stat.status === 0 && /"pg_stat_statements_available"\s*:\s*true/.test(stat.stdout)) {
  const slowSql = (await readFile(path.join(root, "scripts/nfr/resources/pg-slow-queries.sql"), "utf8")).trim();
  const slow = spawnSync("psql", ["-X", "--no-password", "--quiet", "--tuples-only", "--set=ON_ERROR_STOP=1", "--command", slowSql], { cwd: root, encoding: "utf8", timeout: config.psqlTimeoutMs, windowsHide: true, env: { ...process.env, PGHOST: host, PGPORT: port, PGCONNECT_TIMEOUT: "5" } });
  report.pgStatStatements = { status: slow.status === 0 ? "Pass" : "Blocked", topSlowQueries: slow.stdout.trim(), reason: slow.error?.message ?? slow.stderr?.trim() };
} else if (stat.status === 0) {
  report.pgStatStatements = { status: "Not Run", reason: "pg_stat_statements extension is not available" };
}

const queryFile = process.env.NFR_EXPLAIN_QUERY_FILE;
if (queryFile) {
  const resolved = path.resolve(root, queryFile);
  if (!resolved.startsWith(`${root}${path.sep}`)) throw new Error("EXPLAIN query file must be inside the repository");
  const sql = (await readFile(resolved, "utf8")).trim();
  const withoutComments = sql.replace(/--[^\r\n]*/g, " ").replace(/\/\*[\s\S]*?\*\//g, " ");
  if (!/^(SELECT|WITH)\b/i.test(withoutComments) || /;|\b(INSERT|UPDATE|DELETE|MERGE|COPY|CALL|DO|CREATE|ALTER|DROP|TRUNCATE|GRANT|REVOKE)\b/i.test(withoutComments)) throw new Error("EXPLAIN accepts one read-only SELECT/WITH statement only; semicolons and write/DDL verbs are refused");
  const explain = spawnSync("psql", ["-X", "--no-password", "--set=ON_ERROR_STOP=1", "--command", `BEGIN TRANSACTION READ ONLY; SET LOCAL statement_timeout='10s'; EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${sql}; ROLLBACK;`], { cwd: root, encoding: "utf8", timeout: config.psqlTimeoutMs, windowsHide: true, env: { ...process.env, PGHOST: host, PGPORT: port, PGCONNECT_TIMEOUT: "5" } });
  report.explain = { status: explain.status === 0 ? "Pass" : "Blocked", queryFile: path.relative(root, resolved), result: explain.stdout, reason: explain.error?.message ?? explain.stderr?.trim() };
}

await writeFile(path.join(outputDirectory, "postgres.json"), `${JSON.stringify(report, null, 2)}\n`);
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (report.status !== "Pass" || report.explain?.status === "Blocked") process.exitCode = 1;
