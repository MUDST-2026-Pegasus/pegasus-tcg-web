import { beforeEach, describe, expect, it, vi } from "vitest";

const { getWebInstrumentations, initializeFaro } = vi.hoisted(() => ({
  initializeFaro: vi.fn(() => ({
    api: {
      pushView: vi.fn(),
    },
  })),
  getWebInstrumentations: vi.fn(() => []),
}));

vi.mock("@grafana/faro-web-sdk", () => ({
  getWebInstrumentations,
  initializeFaro,
}));

import { initializeFaroClient, scrubFaroEvent } from "@/observability/faro";

describe("Faro frontend observability", () => {
  beforeEach(() => {
    initializeFaro.mockClear();
    getWebInstrumentations.mockClear();
    vi.stubEnv("VITE_FARO_URL", "");
    vi.stubEnv("MODE", "production");
    delete window.Cypress;
  });

  it("does not initialize or make network calls when the collector URL is empty", () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    expect(initializeFaroClient()).toBeNull();
    expect(initializeFaro).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();

    vi.unstubAllGlobals();
  });

  it("skips initialization in Vitest and Cypress even when a URL is configured", () => {
    vi.stubEnv("VITE_FARO_URL", "https://faro.example.test/collect/app");
    vi.stubEnv("MODE", "test");
    expect(initializeFaroClient()).toBeNull();

    vi.stubEnv("MODE", "production");
    window.Cypress = {};
    expect(initializeFaroClient()).toBeNull();
    expect(initializeFaro).not.toHaveBeenCalled();
    expect(getWebInstrumentations).not.toHaveBeenCalled();
  });

  it("scrubs PII from URLs, logs, exceptions, stackframes, and context", () => {
    const event = {
      meta: {
        page: {
          url: "https://shop.test/checkout?token=secret-token&email=buyer%40example.com&step=1",
        },
      },
      payload: {
        message:
          "Failed for buyer@example.com with Bearer abc123 and eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMifQ.signature",
        logs: ["bankbook 1234567890123"],
        exceptions: [
          {
            value: "account number: 998877665544",
            stacktrace: {
              frames: [{ filename: "https://shop.test/app.js?code=private" }],
            },
          },
        ],
        context: {
          account: "998877665544",
          accountNumber: "1234567890123",
          paymentAccountNumber: "1234567890123",
        },
      },
    };

    scrubFaroEvent(event);

    expect(event.meta.page.url).toContain("token=[REDACTED]");
    expect(event.meta.page.url).toContain("email=[REDACTED]");
    expect(event.meta.page.url).toContain("step=1");
    expect(event.payload.message).not.toContain("buyer@example.com");
    expect(event.payload.message).not.toContain("abc123");
    expect(event.payload.message).not.toContain("eyJhbGciOiJIUzI1NiJ9");
    expect(event.payload.logs[0]).toContain("[REDACTED]");
    expect(event.payload.exceptions[0].value).toBe("account number: [REDACTED]");
    expect(event.payload.exceptions[0].stacktrace.frames[0].filename).toContain(
      "code=[REDACTED]",
    );
    expect(event.payload.context.account).toBe("[REDACTED]");
    expect(event.payload.context.accountNumber).toBe("[REDACTED]");
    expect(event.payload.context.paymentAccountNumber).toBe("[REDACTED]");
  });
});
