import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useIsMobile } from "@/hooks/use-mobile";

describe("useIsMobile", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let matchMediaMock: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let addEventListenerMock: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let removeEventListenerMock: any;

  beforeEach(() => {
    addEventListenerMock = vi.fn();
    removeEventListenerMock = vi.fn();

    matchMediaMock = vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: addEventListenerMock,
      removeEventListener: removeEventListenerMock,
      dispatchEvent: vi.fn(),
    }));

    vi.stubGlobal("matchMedia", matchMediaMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("should return true if window.innerWidth < 768", () => {
    vi.stubGlobal("innerWidth", 500);
    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(true);
  });

  it("should return false if window.innerWidth >= 768", () => {
    vi.stubGlobal("innerWidth", 800);
    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(false);
  });

  it("should update state on resize change", () => {
    vi.stubGlobal("innerWidth", 800);
    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(false);

    act(() => {
      vi.stubGlobal("innerWidth", 500);
      // simulate the event listener firing
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const changeCall = addEventListenerMock.mock.calls.find((call: any[]) => call[0] === "change");
      const onChange = changeCall?.[1];
      expect(onChange).toBeDefined();
      onChange();
    });

    expect(result.current).toBe(true);
  });
});
