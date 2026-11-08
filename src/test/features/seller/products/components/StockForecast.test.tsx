import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StockForecast, getVisiblePages } from "@/features/seller/products/components/StockForecast";
import { renderWithProviders } from "@/test/utils";
import { api } from "@/lib/api";

vi.mock("@/lib/api", () => ({
  api: {
    get: vi.fn(),
  },
}));

describe("getVisiblePages", () => {
  it("returns all pages when totalPages <= 5", () => {
    expect(getVisiblePages(1, 1)).toEqual([1]);
    expect(getVisiblePages(1, 3)).toEqual([1, 2, 3]);
    expect(getVisiblePages(2, 4)).toEqual([1, 2, 3, 4]);
    expect(getVisiblePages(5, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it("shows pages [1, 2, 3, 4, 5] when currentPage <= 3 and totalPages > 5", () => {
    expect(getVisiblePages(1, 30)).toEqual([1, 2, 3, 4, 5]);
    expect(getVisiblePages(2, 30)).toEqual([1, 2, 3, 4, 5]);
    expect(getVisiblePages(3, 30)).toEqual([1, 2, 3, 4, 5]);
  });

  it("shows pages [totalPages - 4 .. totalPages] when currentPage >= totalPages - 2", () => {
    expect(getVisiblePages(28, 30)).toEqual([26, 27, 28, 29, 30]);
    expect(getVisiblePages(29, 30)).toEqual([26, 27, 28, 29, 30]);
    expect(getVisiblePages(30, 30)).toEqual([26, 27, 28, 29, 30]);
  });

  it("shows sliding window [currentPage - 2 .. currentPage + 2] when in the middle", () => {
    // Reference example: on page 5 with 30 total pages -> [3, 4, 5, 6, 7]
    expect(getVisiblePages(5, 30)).toEqual([3, 4, 5, 6, 7]);
    expect(getVisiblePages(10, 30)).toEqual([8, 9, 10, 11, 12]);
  });
});

describe("StockForecast component pagination", () => {
  const mockItems = Array.from({ length: 30 * 5 }, (_, i) => ({
    listingId: i + 1,
    listingName: `Card Item #${i + 1}`,
    availableStock: 10,
    completedSales30Days: 5,
    status: "FORECAST_AVAILABLE" as const,
    daysRemaining: 10,
    estimatedStockoutDate: "2026-11-20",
  }));

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.get).mockResolvedValue(mockItems);
  });

  it("opens modal and displays sliding window pagination without wrapping all 30 pages", async () => {
    const user = userEvent.setup();
    renderWithProviders(<StockForecast />);

    // Click "ดูทั้งหมด" to open modal
    const openBtn = await screen.findByRole("button", { name: "ดูทั้งหมด" });
    await user.click(openBtn);

    // Modal title should appear
    expect(await screen.findByText("คาดการณ์การเติมสต็อกทั้งหมด")).toBeInTheDocument();

    // Verify pagination nav exists and has flex-nowrap
    const nav = screen.getByRole("navigation", { name: "เปลี่ยนหน้า" });
    expect(nav).toHaveClass("flex-nowrap");

    // On page 1 of 30: visible pages should be [1, 2, 3, 4, 5]
    expect(screen.getByRole("button", { name: "1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "2" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "3" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "4" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "5" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "6" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "30" })).not.toBeInTheDocument();

    // Active page 1 should have active teal styling
    const page1Btn = screen.getByRole("button", { name: "1" });
    expect(page1Btn).toHaveClass("bg-teal-600");
    expect(page1Btn).toHaveAttribute("aria-current", "page");

    // Previous button should be disabled on page 1
    const prevBtn = screen.getByRole("button", { name: "ก่อนหน้า" });
    expect(prevBtn).toBeDisabled();
    expect(prevBtn).toHaveClass("disabled:cursor-not-allowed");

    // Next button should be enabled
    const nextBtn = screen.getByRole("button", { name: "ถัดไป" });
    expect(nextBtn).toBeEnabled();

    // Click page 5
    // First click page 3 to shift
    const page3Btn = screen.getByRole("button", { name: "3" });
    await user.click(page3Btn);

    // Now on page 3, [1, 2, 3, 4, 5] visible. Click page 5.
    const page5Btn = screen.getByRole("button", { name: "5" });
    await user.click(page5Btn);

    // Now on page 5: visible pages should be [3, 4, 5, 6, 7]
    await waitFor(() => {
      expect(screen.queryByRole("button", { name: "2" })).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "3" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "4" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "5" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "6" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "7" })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "8" })).not.toBeInTheDocument();
    });

    const activePage5 = screen.getByRole("button", { name: "5" });
    expect(activePage5).toHaveClass("bg-teal-600");
    expect(activePage5).toHaveAttribute("aria-current", "page");

    // Click "ถัดไป" to advance to page 6: visible pages should be [4, 5, 6, 7, 8]
    await user.click(nextBtn);

    await waitFor(() => {
      expect(screen.queryByRole("button", { name: "3" })).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "4" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "5" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "6" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "7" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "8" })).toBeInTheDocument();
    });

    // Click "ก่อนหน้า" to go back to page 5
    await user.click(prevBtn);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "3" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "7" })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "8" })).not.toBeInTheDocument();
    });
  });

  it("disables 'ถัดไป' on the last page and renders correctly with fewer pages", async () => {
    const fewItems = Array.from({ length: 12 }, (_, i) => ({
      listingId: i + 1,
      listingName: `Card Item #${i + 1}`,
      availableStock: 10,
      completedSales30Days: 5,
      status: "FORECAST_AVAILABLE" as const,
      daysRemaining: 10,
      estimatedStockoutDate: "2026-11-20",
    }));
    vi.mocked(api.get).mockResolvedValue(fewItems);

    const user = userEvent.setup();
    renderWithProviders(<StockForecast />);

    const openBtn = await screen.findByRole("button", { name: "ดูทั้งหมด" });
    await user.click(openBtn);

    // 12 items / 5 = 3 pages
    expect(screen.getByRole("button", { name: "1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "2" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "3" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "4" })).not.toBeInTheDocument();

    const nextBtn = screen.getByRole("button", { name: "ถัดไป" });
    const page3Btn = screen.getByRole("button", { name: "3" });
    await user.click(page3Btn);

    // On page 3 of 3, next button is disabled
    expect(nextBtn).toBeDisabled();
    expect(nextBtn).toHaveClass("disabled:cursor-not-allowed");
  });
});
