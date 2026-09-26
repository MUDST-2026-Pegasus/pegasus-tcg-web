import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { InfoCard } from "@/features/seller/shop/components/InfoCard";

describe("InfoCard", () => {
  const mockProps = {
    title: "Shop Information",
    description: "Your shop details",
    fields: [
      {
        id: "shop-name",
        label: "Shop Name",
        value: "Test Shop",
        helper: "Publicly visible",
      },
      {
        id: "description",
        label: "Description",
        value: "We sell cards",
        helper: "Max 100 chars",
      },
    ],
  };

  it("renders title and description", () => {
    render(<InfoCard {...mockProps} />);
    expect(screen.getByText("Shop Information")).toBeInTheDocument();
    expect(screen.getByText("Your shop details")).toBeInTheDocument();
  });

  it("renders all fields correctly", () => {
    render(<InfoCard {...mockProps} />);
    
    // Field 1
    expect(screen.getByLabelText("Shop Name")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Test Shop")).toBeInTheDocument();
    expect(screen.getByText("Publicly visible")).toBeInTheDocument();

    // Field 2
    expect(screen.getByLabelText("Description")).toBeInTheDocument();
    expect(screen.getByDisplayValue("We sell cards")).toBeInTheDocument();
    expect(screen.getByText("Max 100 chars")).toBeInTheDocument();
  });
});
