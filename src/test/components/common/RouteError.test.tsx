import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RouteError } from "@/components/common/RouteError";
import * as router from "react-router-dom";

vi.mock("react-router-dom", () => ({
  useRouteError: vi.fn(),
  isRouteErrorResponse: vi.fn(),
}));

describe("RouteError", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("renders standard error message", () => {
    vi.mocked(router.useRouteError).mockReturnValue(new Error("Test Error Message"));
    vi.mocked(router.isRouteErrorResponse).mockReturnValue(false);

    render(<RouteError />);
    expect(screen.getByText("Test Error Message")).toBeInTheDocument();
  });

  it("renders route error response", () => {
    const routeError = { status: 404, statusText: "Not Found" };
    vi.mocked(router.useRouteError).mockReturnValue(routeError);
    vi.mocked(router.isRouteErrorResponse).mockReturnValue(true);

    render(<RouteError />);
    expect(screen.getByText("404 Not Found")).toBeInTheDocument();
  });

  it("renders generic message for unknown errors", () => {
    vi.mocked(router.useRouteError).mockReturnValue("Some string error");
    vi.mocked(router.isRouteErrorResponse).mockReturnValue(false);

    render(<RouteError />);
    // Generic fallback text
    expect(screen.getByText(/ไม่ทราบสาเหตุ/)).toBeInTheDocument();
  });

  it("reloads page when button is clicked", async () => {
    vi.mocked(router.useRouteError).mockReturnValue(new Error());
    vi.mocked(router.isRouteErrorResponse).mockReturnValue(false);
    const user = userEvent.setup();
    
    const reloadSpy = vi.fn();
    vi.stubGlobal("location", { ...window.location, reload: reloadSpy });

    render(<RouteError />);
    const button = screen.getByRole("button");
    await user.click(button);

    expect(reloadSpy).toHaveBeenCalledTimes(1);
  });
});
