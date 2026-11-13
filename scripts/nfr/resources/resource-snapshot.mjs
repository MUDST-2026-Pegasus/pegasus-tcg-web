#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { assertAllowedTarget, assertSafeRunId } from "../target-guard.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const config = JSON.parse(await readFile(path.join(root, "scripts/nfr/resources/config.json"), "utf8"));
if (process.versions.node !== config.nodeVersion) throw new Error(`Pinned Node ${config.nodeVersion} required; found ${process.versions.node}`);
const runId = assertSafeRunId(process.env.NFR_RUN_ID ?? "tcg753-resources-local");
const phase = process.env.NFR_RESOURCE_PHASE ?? "warmup";
if (!["warmup", "soak-end", "cooldown"].includes(phase)) throw new Error("NFR_RESOURCE_PHASE must be warmup, soak-end, or cooldown");
const sampleCount = Number(process.env.NFR_RESOURCE_SAMPLES ?? "1");
if (!Number.isInteger(sampleCount) || sampleCount < 1 || sampleCount > 240) throw new Error("NFR_RESOURCE_SAMPLES must be an integer from 1 to 240");
const intervalMs = Number(process.env.NFR_RESOURCE_INTERVAL_MS ?? "1000");
if (!Number.isInteger(intervalMs) || intervalMs < 1000 || intervalMs > 60000) throw new Error("NFR_RESOURCE_INTERVAL_MS must be 1000-60000 ms");
const api = assertAllowedTarget(process.env.NFR_TARGET ?? "http://127.0.0.1:8080");
const minio = process.env.NFR_MINIO_TARGET ? assertAllowedTarget(process.env.NFR_MINIO_TARGET) : null;
const outDir = path.join(root, "artifacts/nfr", runId, "resources");
await mkdir(outDir, { recursive: true });
const maxRunMs = 5 * 60 * 60 * 1000;
if (sampleCount * (intervalMs + 15_000) > maxRunMs) throw new Error("Requested time series exceeds the 5-hour CLI timeout");
const cliTimeout = setTimeout(() => {
  process.stderr.write("Resource snapshot timed out after 5 hours\n");
  process.exit(1);
}, maxRunMs);
cliTimeout.unref();

async function getMetric(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.requestTimeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal, headers: { Accept: "text/plain, application/json" } });
    if (!response.ok) return { status: "Blocked", reason: `HTTP ${response.status}` };
    return { status: "Pass", body: await response.text() };
  } catch (error) {
    return { status: "Blocked", reason: error.name === "AbortError" ? `timeout after ${config.requestTimeoutMs}ms` : error.message };
  } finally {
    clearTimeout(timeout);
  }
}

function dockerStats() {
  const version = spawnSync("docker", ["version", "--format", "{{.Client.Version}}"], { cwd: root, encoding: "utf8", timeout: config.dockerTimeoutMs, windowsHide: true });
  if (version.error || version.status !== 0 || !version.stdout.includes(config.dockerCliVersion)) return { status: "Blocked", reason: version.error?.message ?? `Docker CLI must be ${config.dockerCliVersion}; got ${version.stdout?.trim()}` };
  const result = spawnSync("docker", ["stats", "--no-stream", "--format", "{{json .}}"], { cwd: root, encoding: "utf8", timeout: config.dockerTimeoutMs, windowsHide: true });
  return result.error || result.status !== 0 ? { status: "Blocked", reason: result.error?.message ?? result.stderr?.trim() } : { status: "Pass", rows: result.stdout.trim().split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line)) };
}

async function sample(index) {
  const [memory, prometheus, minioMetrics, minioHealth] = await Promise.all([
    getMetric(new URL("/actuator/metrics/jvm.memory.used", api)),
    getMetric(new URL("/actuator/prometheus", api)),
    minio ? getMetric(new URL("/minio/v2/metrics/cluster", minio)) : Promise.resolve({ status: "Blocked", reason: "NFR_MINIO_TARGET not configured" }),
    minio ? getMetric(new URL("/minio/health/live", minio)) : Promise.resolve({ status: "Blocked", reason: "NFR_MINIO_TARGET not configured" }),
  ]);
  return {
    index,
    capturedAt: new Date().toISOString(),
    host: { platform: `${os.platform()}-${os.arch()}`, cpuCount: os.cpus().length, loadAverage: os.loadavg(), totalMemoryBytes: os.totalmem(), freeMemoryBytes: os.freemem(), processMemory: process.memoryUsage() },
    jvm: memory.status === "Pass" ? { status: "Pass", memoryMetric: memory.body, prometheusStatus: prometheus.status, prometheus: prometheus.status === "Pass" ? prometheus.body : undefined } : { status: "Blocked", reason: memory.reason, prometheusStatus: prometheus.status, prometheusReason: prometheus.reason },
    minio: { metrics: minioMetrics, health: minioHealth },
    containers: dockerStats(),
  };
}

const samples = [];
for (let index = 0; index < sampleCount; index += 1) {
  samples.push(await sample(index + 1));
  if (index + 1 < sampleCount) await new Promise((resolve) => setTimeout(resolve, intervalMs));
}
const snapshot = { runId, phase, target: api.origin, minioTarget: minio?.origin ?? null, nodeVersion: process.versions.node, timeoutMs: config.requestTimeoutMs, requestedSamples: sampleCount, samples };
const output = path.join(outDir, `${phase}.json`);
await writeFile(output, `${JSON.stringify(snapshot, null, 2)}\n`);
process.stdout.write(`${JSON.stringify({ output, phases: samples.length, sourceStatuses: { jvm: samples.map((s) => s.jvm.status), minio: samples.map((s) => s.minio.metrics.status), containers: samples.map((s) => s.containers.status) } }, null, 2)}\n`);
clearTimeout(cliTimeout);
if (samples.some((item) => item.jvm.status !== "Pass" || item.containers.status !== "Pass" || item.minio.metrics.status !== "Pass")) process.exitCode = 1;
