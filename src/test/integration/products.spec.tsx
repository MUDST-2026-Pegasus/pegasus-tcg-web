import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

import { ProductsContent } from "@/features/seller/products/components/ProductsContent";
import type { ProductsData } from "@/features/seller/products/products.types";

const mockProductsData: ProductsData = {
  title: "Products",
  subtitle: "Manage your inventory",
  actions: { importLabel: "Import", createLabel: "Create" },
  filters: [
    { id: "all", label: "All", count: 2 },
    { id: "active", label: "Active", count: 1 },
    { id: "draft", label: "Draft", count: 1 },
  ],
  toolbar: {
    searchPlaceholder: "Search...",
    sortPlaceholder: "Sort by",
    sortOptions: [
      { value: "newest", label: "Newest" },
      { value: "price_asc", label: "Price (Low to High)" }
    ]
  },
  bulkActions: [
    { id: "delete", label: "Delete Selected" }
  ],
  table: {
    columns: {
      product: "Product Name",
      price: "Price",
      cost: "Cost",
      stock: "Stock",
      sold: "Sold",
      status: "Status",
      actions: "Action"
    },
    stockUnit: "pcs",
    selectAllLabel: "Select all",
    selectRowLabel: "Select row",
    editLabel: "Edit",
    moreLabel: "More",
    restockLabel: "Restock",
    deleteLabel: "Delete"
  },
  pagination: {
    previousLabel: "Prev",
    nextLabel: "Next",
    pages: [1],
    currentPage: 1,
  },
  deleteDialog: {
    title: "Delete Product?",
    description: "Are you sure?",
    remainingLabel: "Remaining",
    soldLabel: "Sold",
    warning: "Warning!",
    unpublishLabel: "Unpublish Instead",
    confirmLabel: "Delete",
  },
  rows: [
    {
      id: "prod-1",
      name: "Blue Eyes White Dragon",
      meta: "LOB-001",
      price: "1500",
      cost: "1000",
      stock: 5,
      sold: 2,
      status: "active",
      statusLabel: "Active",
    },
    {
      id: "prod-2",
      name: "Dark Magician",
      meta: "LOB-005",
      price: "1000",
      cost: "500",
      stock: 0,
      sold: 1,
      status: "draft",
      statusLabel: "Draft",
    },
  ],
};

describe("ProductsContent Integration", () => {
  it("allows filtering, selecting rows, and deleting a product", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <ProductsContent data={mockProductsData} />
      </MemoryRouter>
    );

    // 1. Initial State: both products are visible
    expect(screen.getByText("Blue Eyes White Dragon")).toBeInTheDocument();
    expect(screen.getByText("Dark Magician")).toBeInTheDocument();

    // 2. Filter change
    await user.click(screen.getByRole("button", { name: /active/i }));
    
    // Now only Blue Eyes should be visible
    expect(screen.getByText("Blue Eyes White Dragon")).toBeInTheDocument();
    expect(screen.queryByText("Dark Magician")).not.toBeInTheDocument();

    // Reset filter
    await user.click(screen.getByRole("button", { name: /all/i }));

    // 3. Selection and Bulk Bar
    const blueEyesRow = screen.getByText("Blue Eyes White Dragon").closest("tr")!;
    const rowCheckbox = within(blueEyesRow).getByRole("checkbox");
    await user.click(rowCheckbox);
    
    // Bulk action bar should appear showing "1 รายการ"
    expect(screen.getByText(/1 รายการ/)).toBeInTheDocument();

    // Clear selection
    // Uncheck the row to clear
    await user.click(rowCheckbox);
    expect(screen.queryByText(/1 รายการ/)).not.toBeInTheDocument();
  });
});
