import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";

import { ProfitWarningCard } from "@/features/seller/products/components/restock/ProfitWarningCard";
import type { RestockCalculation } from "@/features/seller/products/restock.calc";
import { renderWithProviders } from "@/test/utils";

describe("ProfitWarningCard", () => {
  it("renders the supplied cost/profit warning values and links to the listing price editor", () => {
    const result = {
      previousProfit: 400,
      newProfit: 250,
      newAverageCost: 750,
      suggestedPrice: 1200,
    } as RestockCalculation;
    renderWithProviders(
      <Routes>
        <Route path="/" element={<ProfitWarningCard title="Profit margin changed" adjustPriceLabel="Adjust price" productId="101" averageCost={600} result={result} />} />
      </Routes>,
    );

    expect(screen.getByRole("status")).toHaveTextContent("Profit margin changed");
    expect(screen.getByRole("status")).toHaveTextContent("THB 600.00");
    expect(screen.getByRole("status")).toHaveTextContent("THB 750.00");
    expect(screen.getByRole("status")).toHaveTextContent("THB 400.00");
    expect(screen.getByRole("status")).toHaveTextContent("THB 250.00");
    expect(screen.getByRole("status")).toHaveTextContent("THB 1,200.00");
    expect(screen.getByRole("button", { name: "Adjust price" })).toHaveAttribute("href", "/seller/products/101/edit?focus=price");
  });
});
