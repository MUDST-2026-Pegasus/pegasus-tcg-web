import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProductFilterBar } from "@/features/seller/products/components/ProductFilterBar";
import type { ProductFilter, ProductsData } from "@/features/seller/products/products.types";

const MOCK_FILTERS: ProductFilter[] = [
  { id: "all", label: "All", count: 10 },
  { id: "active", label: "Active", count: 7 },
  { id: "inactive" as never, label: "Inactive", count: 3 },
];

const MOCK_TOOLBAR: ProductsData["toolbar"] = {
  searchPlaceholder: "Search products...",
  sortPlaceholder: "Sort by",
  sortOptions: [
    { label: "Newest", value: "newest" },
    { label: "Oldest", value: "oldest" },
  ],
};

describe("ProductFilterBar", () => {
  it("renders all filters correctly", () => {
    const onFilterChange = vi.fn();
    render(
      <ProductFilterBar
        filters={MOCK_FILTERS}
        activeFilterId="all"
        onFilterChange={onFilterChange}
        toolbar={MOCK_TOOLBAR}
      />
    );

    expect(screen.getByRole("button", { name: "All 10" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Active 7" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Inactive 3" })).toBeInTheDocument();
  });

  it("calls onFilterChange when a filter button is clicked", async () => {
    const onFilterChange = vi.fn();
    const user = userEvent.setup();
    render(
      <ProductFilterBar
        filters={MOCK_FILTERS}
        activeFilterId="all"
        onFilterChange={onFilterChange}
        toolbar={MOCK_TOOLBAR}
      />
    );

    await user.click(screen.getByRole("button", { name: "Active 7" }));
    expect(onFilterChange).toHaveBeenCalledWith("active");
  });

  it("applies active styling to the active filter", () => {
    const onFilterChange = vi.fn();
    render(
      <ProductFilterBar
        filters={MOCK_FILTERS}
        activeFilterId="active"
        onFilterChange={onFilterChange}
        toolbar={MOCK_TOOLBAR}
      />
    );

    const activeBtn = screen.getByRole("button", { name: "Active 7" });
    expect(activeBtn).toHaveAttribute("aria-pressed", "true");
    
    const inactiveBtn = screen.getByRole("button", { name: "All 10" });
    expect(inactiveBtn).toHaveAttribute("aria-pressed", "false");
  });

  it("renders search input with placeholder", () => {
    const onFilterChange = vi.fn();
    render(
      <ProductFilterBar
        filters={MOCK_FILTERS}
        activeFilterId="all"
        onFilterChange={onFilterChange}
        toolbar={MOCK_TOOLBAR}
      />
    );

    const searchBox = screen.getByPlaceholderText("Search products...");
    expect(searchBox).toBeInTheDocument();
  });
});
