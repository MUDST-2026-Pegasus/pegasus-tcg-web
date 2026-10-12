import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { AuthLayout } from "@/components/layout/AuthLayout";

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    Outlet: () => <div data-testid="outlet" />,
  };
});

describe("AuthLayout", () => {
  it("renders the main wrapper and Outlet", () => {
    const { container } = render(
      <BrowserRouter>
        <AuthLayout />
      </BrowserRouter>
    );

    const main = container.querySelector("main");
    expect(main).toBeInTheDocument();
    expect(main).toHaveClass("relative", "flex", "overflow-hidden");

    expect(screen.getByTestId("outlet")).toBeInTheDocument();
  });
});
