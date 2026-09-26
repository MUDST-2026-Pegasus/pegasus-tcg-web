import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PagePlaceholder } from "@/components/common/PagePlaceholder";

describe("PagePlaceholder", () => {
  it("renders title correctly", () => {
    render(<PagePlaceholder title="Test Page" />);
    expect(screen.getByText("Test Page")).toBeInTheDocument();
  });

  it("renders Figma node text when provided", () => {
    render(<PagePlaceholder title="Test Page" figmaNode="123:456" />);
    expect(screen.getByText(/Figma node 123:456/i)).toBeInTheDocument();
  });
});
