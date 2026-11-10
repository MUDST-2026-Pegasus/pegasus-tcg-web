import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderWithProviders, screen } from "@/test/utils";

import { countdownParts, formatCountdown, useCountdown } from "@/components/sale";

describe("formatCountdown", () => {
  it("formats hours, minutes and seconds", () => {
    expect(formatCountdown((5 * 3600 + 42 * 60 + 18) * 1000)).toBe("05:42:18");
  });

  it("adds days past 24 hours", () => {
    expect(formatCountdown((27 * 86400 + 5 * 3600 + 42 * 60 + 18) * 1000)).toBe("27 วัน 05:42:18");
  });

  it("never goes below zero", () => {
    expect(formatCountdown(-5000)).toBe("00:00:00");
    expect(countdownParts(-1)).toEqual(["00", "00", "00"]);
  });

  it("splits hours including days for the home strip boxes", () => {
    expect(countdownParts((26 * 3600 + 5) * 1000)).toEqual(["26", "00", "05"]);
  });
});

function Timer({ endsAt, onDone }: { endsAt: string; onDone: () => void }) {
  const left = useCountdown(endsAt, onDone);
  return <span>{formatCountdown(left)}</span>;
}

describe("useCountdown", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-11T10:00:00Z"));
  });
  afterEach(() => vi.useRealTimers());

  it("ticks every second and calls onDone once at zero (→ refetch)", () => {
    const onDone = vi.fn();
    renderWithProviders(<Timer endsAt="2026-11-11T10:00:03Z" onDone={onDone} />);
    expect(screen.getByText("00:00:03")).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByText("00:00:02")).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(2000));
    expect(screen.getByText("00:00:00")).toBeInTheDocument();
    expect(onDone).toHaveBeenCalledTimes(1);

    act(() => vi.advanceTimersByTime(5000));
    expect(onDone).toHaveBeenCalledTimes(1);
  });
});
