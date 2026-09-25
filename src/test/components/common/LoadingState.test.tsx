import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LoadingState } from "@/components/common/LoadingState";

describe("LoadingState", () => {
  it("renders with correct aria attributes", () => {
    const { container } = render(<LoadingState />);
    const statusDiv = container.firstElementChild;
    expect(statusDiv).toHaveAttribute("aria-busy", "true");
    expect(statusDiv).toHaveAttribute("role", "status");
  });

  it("renders label when provided", () => {
    render(<LoadingState label="Loading data..." />);
    expect(screen.getByText("Loading data...")).toBeInTheDocument();
  });

  it("applies custom classname", () => {
    const { container } = render(<LoadingState className="custom-loading" />);
    const statusDiv = container.firstElementChild;
    expect(statusDiv).toHaveClass("custom-loading");
  });
});
