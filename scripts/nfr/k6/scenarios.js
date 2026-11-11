import http from "k6/http";
import { check, sleep } from "k6";
import { Counter, Rate } from "k6/metrics";

const mode = __ENV.MODE || "smoke";
const target = __ENV.TARGET || "http://127.0.0.1:8080/api/v1";
const allowed = new Set(["localhost", "127.0.0.1", "::1"]);
const targetUrl = new URL(target);
if (!["http:", "https:"].includes(targetUrl.protocol) || !allowed.has(targetUrl.hostname.replace(/^\[|\]$/g, ""))) {
  throw new Error(`Refusing non-loopback NFR target: ${targetUrl.hostname}`);
}

const profiles = {
  smoke: { executor: "constant-vus", vus: 3, duration: "5m" },
  baseline: { executor: "constant-vus", vus: 15, duration: "15m" },
  load: { executor: "ramping-vus", startVUs: 0, stages: [{ duration: "5m", target: 25 }, { duration: "5m", target: 50 }, { duration: "5m", target: 100 }, { duration: "15m", target: 100 }] },
  stress: { executor: "ramping-arrival-rate", startRate: 10, timeUnit: "1s", preAllocatedVUs: 50, maxVUs: 500, stages: [{ duration: "5m", target: 25 }, { duration: "5m", target: 50 }, { duration: "5m", target: 100 }, { duration: "5m", target: 200 }, { duration: "5m", target: 400 }] },
  spike: { executor: "ramping-arrival-rate", startRate: 10, timeUnit: "1s", preAllocatedVUs: 100, maxVUs: 500, stages: [{ duration: "30s", target: 50 }, { duration: "30s", target: 250 }, { duration: "5m", target: 250 }, { duration: "30s", target: 10 }] },
  soak: { executor: "constant-arrival-rate", rate: 20, timeUnit: "1s", duration: "4h", preAllocatedVUs: 50, maxVUs: 200 },
  cooldown: { executor: "ramping-arrival-rate", startRate: 250, timeUnit: "1s", preAllocatedVUs: 100, maxVUs: 500, stages: [{ duration: "30s", target: 10 }, { duration: "5m", target: 10 }] },
};
if (!Object.hasOwn(profiles, mode)) throw new Error(`Unknown NFR mode: ${mode}`);
if (__ENV.DRY_RUN === "1") {
  const profile = profiles[mode];
  if (profile.duration) profile.duration = "1s";
  if (profile.stages) profile.stages = profile.stages.map((stage) => ({ ...stage, duration: "1s" }));
}

const unexpectedErrors = new Rate("unexpected_errors");
const expectedBusinessOutcomes = new Counter("expected_business_outcomes");
const thresholds = {
  "http_req_duration{kind:read}": ["p(95)<=500", "p(99)<=1000"],
  "http_req_duration{kind:search}": ["p(95)<=800", "p(99)<=1500"],
  unexpected_errors: ["rate<0.01"],
};
export const options = {
  scenarios: { [mode]: { ...profiles[mode], exec: "journey" } },
  thresholds,
  discardResponseBodies: false,
  summaryTrendStats: ["avg", "min", "med", "max", "p(90)", "p(95)", "p(99)"],
};

const headers = __ENV.NFR_AUTH_TOKEN ? { Authorization: `Bearer ${__ENV.NFR_AUTH_TOKEN}` } : {};
const journeys = [
  { path: "/home/banners", label: "read" },
  { path: "/catalog/products?page=0&size=20", label: "search" },
  { path: "/cart", label: "read", authenticated: true },
];

export function journey() {
  const selected = journeys[__ITER % journeys.length];
  const cacheMode = __ITER === 0 ? "cold" : "warm";
  const authenticated = Boolean(headers.Authorization && selected.authenticated);
  const requestHeaders = selected.authenticated && headers.Authorization ? { ...headers } : {};
  if (cacheMode === "cold") requestHeaders["Cache-Control"] = "no-cache";
  const response = http.get(`${target}${selected.path}`, { headers: requestHeaders, tags: { kind: selected.label, journey: authenticated ? "authenticated" : "anonymous", cache_mode: cacheMode }, timeout: "10s" });
  const expected = [400, 401, 403, 404, 409, 422, 429].includes(response.status);
  if (expected) expectedBusinessOutcomes.add(1, { status: String(response.status), endpoint: selected.path });
  const unexpected = response.status === 0 || response.status >= 500 || (response.status >= 400 && !expected);
  unexpectedErrors.add(unexpected);
  check(response, {
    "HTTP status is successful or a declared expected business outcome": (res) => (res.status >= 200 && res.status < 400) || expected,
    "JSON response parses when a body is present": (res) => !res.body || (() => { try { JSON.parse(res.body); return true; } catch { return false; } })(),
  });
  sleep(0.2);
}

export function handleSummary(data) {
  const dropped = data.metrics.dropped_iterations?.values?.count ?? 0;
  return { stdout: `NFR mode=${mode}; target=${targetUrl.host}; dropped_iterations=${dropped}; expected_business_outcomes=${data.metrics.expected_business_outcomes?.values?.count ?? 0}\n` };
}
