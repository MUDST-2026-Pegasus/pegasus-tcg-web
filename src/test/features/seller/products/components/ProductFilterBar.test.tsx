import type { ComponentProps } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
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

type BarProps = ComponentProps<typeof ProductFilterBar>;

/** Search and sort default to "nothing typed, most recently changed first". */
function renderBar(props: Partial<BarProps> = {}) {
  const all: BarProps = {
    counts: makeCounts(),
    activeStatus: undefined,
    onStatusChange: vi.fn(),
    search: "",
    onSearchChange: vi.fn(),
    sort: "updated",
    onSortChange: vi.fn(),
    ...props,
  };
  return { ...render(<ProductFilterBar {...all} />), props: all };
}

describe("ProductFilterBar", () => {
  it("renders one chip per status with its count, hiding BLOCKED when empty", () => {
    renderBar();

    expect(screen.getByRole("button", { name: "ทั้งหมด 10" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "พร้อมขาย 7" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "หมดสต็อก 1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "ฉบับร่าง 2" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /ถูกระงับ/ })).not.toBeInTheDocument();
  });

  it("shows the BLOCKED chip once a listing is blocked", () => {
    renderBar({ counts: makeCounts({ BLOCKED: 1 }) });

    expect(screen.getByRole("button", { name: "ถูกระงับ 1" })).toBeInTheDocument();
  });

  it("calls onStatusChange with the chip's status, or undefined for all", async () => {
    const onStatusChange = vi.fn();
    const user = userEvent.setup();
    renderBar({ activeStatus: "DRAFT", onStatusChange });

    await user.click(screen.getByRole("button", { name: "พร้อมขาย 7" }));
    expect(onStatusChange).toHaveBeenLastCalledWith("ACTIVE");

    await user.click(screen.getByRole("button", { name: "ทั้งหมด 10" }));
    expect(onStatusChange).toHaveBeenLastCalledWith(undefined);
  });

  it("marks only the active chip as pressed", () => {
    renderBar({ activeStatus: "ACTIVE" });

    expect(screen.getByRole("button", { name: "พร้อมขาย 7" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "ทั้งหมด 10" })).toHaveAttribute("aria-pressed", "false");
  });

  it("shows a placeholder instead of counts while they load", () => {
    renderBar({ counts: { ...makeCounts(), isPending: true } });

    expect(screen.getByRole("button", { name: "พร้อมขาย …" })).toBeInTheDocument();
  });

  it("searches once the seller stops typing, not on every key", async () => {
    const user = userEvent.setup();
    const { props } = renderBar();

    await user.type(screen.getByRole("searchbox", { name: "ค้นหาสินค้า" }), "chariz");

    await waitFor(() => expect(props.onSearchChange).toHaveBeenCalledWith("chariz"));
    expect(props.onSearchChange).toHaveBeenCalledTimes(1);
  });

  it("searches straight away on Enter", async () => {
    const user = userEvent.setup();
    const { props } = renderBar();

    await user.type(screen.getByRole("searchbox", { name: "ค้นหาสินค้า" }), "SKU-1{Enter}");

    expect(props.onSearchChange).toHaveBeenCalledWith("SKU-1");
  });

  it("follows the search in the URL when it changes elsewhere, e.g. after clearing it", () => {
    const { rerender, props } = renderBar({ search: "pikachu" });
    const box = screen.getByRole("searchbox", { name: "ค้นหาสินค้า" });
    expect(box).toHaveValue("pikachu");

    rerender(<ProductFilterBar {...props} search="" />);

    expect(box).toHaveValue("");
  });

  it("shows the current sort on the sort control", () => {
    renderBar({ sort: "stock_asc" });

    expect(screen.getByRole("combobox", { name: "เรียงลำดับ" })).toHaveTextContent(
      "เรียง: คงเหลือน้อย → มาก",
    );
  });
});
