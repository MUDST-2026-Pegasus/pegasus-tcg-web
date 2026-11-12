const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);
// Explicit TCG-753 Dev targets authorized for the live VPN NFR run.
const TCG753_DEV_HOSTS = new Set(["pegasus-dev.gameinwza.com", "100.86.49.143", "100.86.61.35"]);
const PINNED_NODE_VERSION = "22.20.0";
if (process.versions.node !== PINNED_NODE_VERSION) {
  throw new Error(`Pinned Node.js ${PINNED_NODE_VERSION} is required; found ${process.versions.node}`);
}

/**
 * Accept loopback, the explicitly approved TCG-753 Dev targets, or test-only
 * hostnames configured in NFR_TEST_TARGET_HOSTS.
 */
export function assertAllowedTarget(target, { env = process.env } = {}) {
  let url;
  try {
    url = new URL(target);
  } catch {
    throw new Error(`Invalid NFR target URL: ${target}`);
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error(`NFR targets must use http or https: ${url.protocol}`);
  }

  const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (LOOPBACK_HOSTS.has(hostname)) return url;
  if (TCG753_DEV_HOSTS.has(hostname)) return url;

  const configuredHosts = (env.NFR_TEST_TARGET_HOSTS ?? "")
    .split(",")
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean);
  const isTestHostname = hostname.endsWith(".test") || hostname.endsWith(".localhost");
  if (isTestHostname && configuredHosts.includes(hostname)) return url;

  throw new Error(
    `NFR target is not allowlisted: ${hostname}. ` +
      "Use loopback, an approved TCG-753 Dev target, or an exact .test/.localhost host in NFR_TEST_TARGET_HOSTS.",
  );
}

export function assertSafeRunId(runId) {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]{2,63}$/.test(runId)) {
    throw new Error("run-id must be 3-64 letters, digits, underscores, or hyphens and start with a letter or digit");
  }
  return runId;
}
