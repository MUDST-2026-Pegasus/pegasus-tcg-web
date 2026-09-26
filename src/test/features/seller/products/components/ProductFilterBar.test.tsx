import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProductFilterBar } from "@/features/seller/products/components/ProductFilterBar";
import type { ListingCounts } from "@/features/seller/products/products.queries";

function makeCounts(overrides: Partial<ListingCounts["counts"]> = {}): ListingCounts {
  const counts = {
    ACTIVE: 7,
    SOLD_OUT: 1,
    PAUSED: 0,
    DRAFT: 2,
    DELISTED: 0,
    BLOCKED: 0,
    ...overrides,
  };
  return {
    counts,
    total: Object.values(counts).reduce((sum, count) => sum + count, 0),
    isPending: false,
  };
}

describe("ProductFilterBar", () => {
  it("renders one chip per status with its count, hiding BLOCKED when empty", () => {
    render(
      <ProductFilterBar
        counts={makeCounts()}
        activeStatus={undefined}
        onStatusChange={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: "ทั้งหมด 10" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "พร้อมขาย 7" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "หมดสต็อก 1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "ฉบับร่าง 2" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /ถูกระงับ/ })).not.toBeInTheDocument();
  });

  it("shows the BLOCKED chip once a listing is blocked", () => {
    render(
      <ProductFilterBar
        counts={makeCounts({ BLOCKED: 1 })}
        activeStatus={undefined}
        onStatusChange={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: "ถูกระงับ 1" })).toBeInTheDocument();
  });

  it("calls onStatusChange with the chip's status, or undefined for all", async () => {
    const onStatusChange = vi.fn();
    const user = userEvent.setup();
    render(
      <ProductFilterBar
        counts={makeCounts()}
        activeStatus="DRAFT"
        onStatusChange={onStatusChange}
      />
    );

    await user.click(screen.getByRole("button", { name: "พร้อมขาย 7" }));
    expect(onStatusChange).toHaveBeenLastCalledWith("ACTIVE");

    await user.click(screen.getByRole("button", { name: "ทั้งหมด 10" }));
    expect(onStatusChange).toHaveBeenLastCalledWith(undefined);
  });

  it("marks only the active chip as pressed", () => {
    render(
      <ProductFilterBar
        counts={makeCounts()}
        activeStatus="ACTIVE"
        onStatusChange={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: "พร้อมขาย 7" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "ทั้งหมด 10" })).toHaveAttribute("aria-pressed", "false");
  });

  it("shows a placeholder instead of counts while they load", () => {
    render(
      <ProductFilterBar
        counts={{ ...makeCounts(), isPending: true }}
        activeStatus={undefined}
        onStatusChange={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: "พร้อมขาย …" })).toBeInTheDocument();
  });

  it("keeps search disabled because the backend cannot search yet", () => {
    render(
      <ProductFilterBar
        counts={makeCounts()}
        activeStatus={undefined}
        onStatusChange={vi.fn()}
      />
    );

    expect(screen.getByPlaceholderText("ค้นหาสินค้า...")).toBeDisabled();
  });
});
