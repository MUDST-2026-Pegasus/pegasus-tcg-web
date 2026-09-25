import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
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
    columnsLabel: "Columns",
    sortOptions: [
      { value: "newest", label: "Newest" },
      { value: "price_asc", label: "Price (Low to High)" }
    ]
  },
  bulkActions: [
    { id: "delete", label: "Delete Selected", variant: "destructive", icon: "trash" }
  ],
  table: {
    columns: {
      product: "Product Name",
      price: "Price",
      stock: "Stock",
      status: "Status",
      action: "Action"
    },
    stockUnit: "pcs",
  },
  pagination: {
    pageLabel: "Page",
    prevLabel: "Prev",
    nextLabel: "Next",
    pageSizeLabel: "per page",
    page: 1,
    pageSize: 10,
    totalPages: 1,
    pages: [1],
  },
  deleteDialog: {
    title: "Delete Product?",
    description: "Are you sure?",
    cancelLabel: "Cancel",
    unpublishLabel: "Unpublish Instead",
    confirmLabel: "Delete",
  },
  rows: [
    {
      id: "prod-1",
      name: "Blue Eyes White Dragon",
      price: 1500,
      stock: 5,
      status: "active",
      statusLabel: "Active",
      image: "image.png",
      setCode: "LOB-001",
      condition: "NM",
      language: "EN",
      lastUpdated: "Today",
    },
    {
      id: "prod-2",
      name: "Dark Magician",
      price: 1000,
      stock: 0,
      status: "draft",
      statusLabel: "Draft",
      image: "image2.png",
      setCode: "LOB-005",
      condition: "NM",
      language: "EN",
      lastUpdated: "Yesterday",
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
    const checkboxes = screen.getAllByRole("checkbox");
    // [0] is header, [1] is row 1 (Blue Eyes), [2] is row 2
    await user.click(checkboxes[1]);
    
    // Bulk action bar should appear showing "1 รายการ"
    expect(screen.getByText(/1 รายการ/)).toBeInTheDocument();

    // Clear selection
    // Uncheck the row to clear
    await user.click(checkboxes[1]);
    expect(screen.queryByText(/1 รายการ/)).not.toBeInTheDocument();
    expect(screen.queryByText(/1 รายการ/)).not.toBeInTheDocument();
  });
});
