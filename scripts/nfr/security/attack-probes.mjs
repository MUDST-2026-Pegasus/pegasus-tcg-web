#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { assertAllowedTarget, assertSafeRunId } from "../target-guard.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const target = assertAllowedTarget(process.env.NFR_TARGET ?? "http://127.0.0.1:8080/api/v1");
const runId = assertSafeRunId(process.env.NFR_RUN_ID ?? "tcg753-attacks-local");
const timeoutMs = 5_000;
const output = path.join(root, "artifacts/nfr", runId, "security");
await mkdir(output, { recursive: true });

async function probe(name, request) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const started = performance.now();
  try {
    const response = await fetch(new URL(request.path, target), { ...request, signal: controller.signal, redirect: "manual" });
    const body = await response.text();
    const leakPattern = /(\bpassword\b\s*[:=]\s*"[^\"]+"|\bsecret\b\s*[:=]\s*"[^\"]+"|eyJ[a-zA-Z0-9_-]{20,}\.[a-zA-Z0-9_-]{10,})/i;
    const expectedAuthGate = ["anonymous-profile-access", "anonymous-seller-access", "anonymous-admin-access"].includes(name);
    const expectedStatus = expectedAuthGate ? [401, 403].includes(response.status) : response.status < 500;
    const sensitiveMaterialDetected = leakPattern.test(body);
    const reflectedUntrustedOrigin = name === "cors-untrusted-origin" && response.headers.get("access-control-allow-origin") === "https://untrusted.example";
    const failed = response.status >= 500 || !expectedStatus || sensitiveMaterialDetected || reflectedUntrustedOrigin;
    return { name, status: response.status, durationMs: Math.round(performance.now() - started), result: failed ? "Fail" : "Observed", headers: { accessControlAllowOrigin: response.headers.get("access-control-allow-origin"), contentSecurityPolicy: response.headers.get("content-security-policy"), xContentTypeOptions: response.headers.get("x-content-type-options"), strictTransportSecurity: response.headers.get("strict-transport-security") }, responseBodyBytes: Buffer.byteLength(body), sensitiveMaterialDetected, reflectedUntrustedOrigin };
  } catch (error) {
    return { name, result: "Blocked", reason: error.name === "AbortError" ? `timeout after ${timeoutMs}ms` : error.message };
  } finally {
    clearTimeout(timeout);
  }
}

const probes = [
  { name: "anonymous-profile-access", path: "/users/me" },
  { name: "anonymous-seller-access", path: "/sellers/me" },
  { name: "anonymous-admin-access", path: "/admin/metrics/overview" },
  { name: "catalog-injection-and-xss-query", path: `/catalog/products?search=${encodeURIComponent("' OR 1=1 -- <img src=x onerror=alert(1)>")}` },
  { name: "actuator-exposure", path: "/actuator" },
  { name: "metrics-exposure", path: "/actuator/prometheus" },
  { name: "swagger-exposure", path: "/swagger-ui/index.html" },
  { name: "debug-exposure", path: "/debug" },
];
const results = [];
for (const item of probes) {
  results.push(await probe(item.name, { method: "GET", path: item.path }));
}
results.push(await probe("cors-untrusted-origin", { method: "OPTIONS", path: "/auth/me", headers: { Origin: "https://untrusted.example", "Access-Control-Request-Method": "GET" } }));

const missingFixtures = ["NFR_USER_A_TOKEN", "NFR_USER_B_TOKEN", "NFR_SELLER_A_TOKEN", "NFR_SELLER_B_TOKEN", "NFR_TEST_PAYMENT_ID", "NFR_TEST_PRIVATE_UPLOAD_KEY"].filter((name) => !process.env[name]);
const report = { runId, target: target.origin, perRequestTimeoutMs: timeoutMs, probeCount: results.length, probes: results, authenticatedIdorJwtReplayRefreshCsrfUploadMassAssignmentOversizedAndRateLimit: missingFixtures.length ? { status: "Blocked", reason: "Disposable local auth and entity fixtures are not configured", missingFixtureNames: missingFixtures } : { status: "Not Run", reason: "Probe execution requires endpoint-specific server contract and approved local disposable fixtures" } };
await writeFile(path.join(output, "attack-probes.json"), `${JSON.stringify(report, null, 2)}\n`);
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (results.some((item) => item.result === "Fail" || item.sensitiveMaterialDetected)) process.exitCode = 1;
if (results.every((item) => item.result === "Blocked")) process.exitCode = 2;
