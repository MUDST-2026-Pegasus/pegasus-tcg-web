import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EmptyState } from "@/components/common/EmptyState";

describe("EmptyState", () => {
  it("renders title correctly", () => {
    render(<EmptyState title="No items found" />);
    expect(screen.getByText("No items found")).toBeInTheDocument();
  });

  it("renders description when provided", () => {
    render(
      <EmptyState title="Empty" description="Please add some items" />
    );
    expect(screen.getByText("Please add some items")).toBeInTheDocument();
  });

  it("renders custom children", () => {
    render(
      <EmptyState title="Empty">
        <button>Create Item</button>
      </EmptyState>
    );
    expect(screen.getByRole("button", { name: "Create Item" })).toBeInTheDocument();
  });

  it("applies custom classname", () => {
    const { container } = render(
      <EmptyState title="Empty" className="custom-empty-class" />
    );
    // The main container should have the class
    expect(container.firstElementChild).toHaveClass("custom-empty-class");
  });
});
