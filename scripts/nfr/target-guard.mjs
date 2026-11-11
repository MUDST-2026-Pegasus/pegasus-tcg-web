const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);
const PINNED_NODE_VERSION = "22.20.0";
if (process.versions.node !== PINNED_NODE_VERSION) {
  throw new Error(`Pinned Node.js ${PINNED_NODE_VERSION} is required; found ${process.versions.node}`);
}

/**
 * Accept only loopback targets or explicitly configured test-only hostnames.
 * Non-loopback hosts must end in .test or .localhost and match the exact
 * NFR_TEST_TARGET_HOSTS allowlist. Production hostnames are never accepted.
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

  const configuredHosts = (env.NFR_TEST_TARGET_HOSTS ?? "")
    .split(",")
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean);
  const isTestHostname = hostname.endsWith(".test") || hostname.endsWith(".localhost");
  if (isTestHostname && configuredHosts.includes(hostname)) return url;

  throw new Error(
    `NFR target is not allowlisted: ${hostname}. ` +
      "Use localhost/127.0.0.1/::1 or an exact .test/.localhost host in NFR_TEST_TARGET_HOSTS.",
  );
}

export function assertSafeRunId(runId) {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]{2,63}$/.test(runId)) {
    throw new Error("run-id must be 3-64 letters, digits, underscores, or hyphens and start with a letter or digit");
  }
  return runId;
}
