import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StockForecast } from "@/features/seller/products/components/StockForecast";
import { getVisiblePages } from "@/features/seller/products/utils/pagination";
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

  it("shows at most two preview rows and renders API forecast and insufficient-data values in the modal", async () => {
    vi.mocked(api.get).mockResolvedValue([
      { listingId: 101, listingName: "Normal Forecast", availableStock: 4, completedSales30Days: 12, status: "FORECAST_AVAILABLE", daysRemaining: 10, estimatedStockoutDate: "2026-11-20" },
      { listingId: 102, listingName: "No Sales", availableStock: 7, completedSales30Days: 0, status: "NO_SALES", daysRemaining: null, estimatedStockoutDate: null },
      { listingId: 103, listingName: "Fast Seller", availableStock: 80, completedSales30Days: 120, status: "FORECAST_AVAILABLE", daysRemaining: 20, estimatedStockoutDate: "2026-11-30" },
    ]);

    const user = userEvent.setup();
    renderWithProviders(<StockForecast />);

    expect(await screen.findByText("Fast Seller")).toBeInTheDocument();
    expect(screen.getByText("Normal Forecast")).toBeInTheDocument();
    expect(screen.queryByText("No Sales")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "ดูทั้งหมด" }));
    const modal = screen.getByRole("dialog");
    const normalRow = within(modal).getByText("Normal Forecast").parentElement;
    const noSalesRow = within(modal).getByText("No Sales").parentElement;
    expect(modal.textContent!.indexOf("Normal Forecast")).toBeLessThan(modal.textContent!.indexOf("Fast Seller"));
    expect(normalRow).toHaveTextContent("4 ชิ้น");
    expect(normalRow).toHaveTextContent("12 ชิ้น");
    expect(normalRow).toHaveTextContent("~10 วัน");
    expect(normalRow).toHaveTextContent("20 พ.ย. 2569");
    expect(noSalesRow).toHaveTextContent("7 ชิ้น");
    expect(noSalesRow).toHaveTextContent("0 ชิ้น");
    expect(noSalesRow).toHaveTextContent("ยังไม่มีการขาย");
    expect(noSalesRow).not.toHaveTextContent(/~\d+ วัน|\d+ ม\.ค\.|\d+ พ\.ย\./);
    expect(within(normalRow!).getByRole("link", { name: "ดูสินค้า" })).toHaveAttribute("href", "/listings/101");
    expect(within(normalRow!).getByRole("link", { name: "เติมสต็อก" })).toHaveAttribute("href", "/seller/products/101/restock");
  });

  it("filters and searches the full API result set and resets pagination", async () => {
    const rows: Array<{
      listingId: number;
      listingName: string;
      availableStock: number;
      completedSales30Days: number;
      status: "FORECAST_AVAILABLE" | "NO_SALES";
      daysRemaining: number | null;
      estimatedStockoutDate: string | null;
    }> = Array.from({ length: 7 }, (_, index) => ({
      listingId: index + 1,
      listingName: index === 6 ? "Target on later page" : `Soon Card ${index + 1}`,
      availableStock: 3,
      completedSales30Days: 9,
      status: "FORECAST_AVAILABLE" as const,
      daysRemaining: 7,
      estimatedStockoutDate: "2026-11-17",
    }));
    rows.push({ listingId: 8, listingName: "No sale record", availableStock: 8, completedSales30Days: 0, status: "NO_SALES" as const, daysRemaining: null, estimatedStockoutDate: null });
    vi.mocked(api.get).mockResolvedValue(rows);

    const user = userEvent.setup();
    renderWithProviders(<StockForecast />);
    await user.click(await screen.findByRole("button", { name: "ดูทั้งหมด" }));
    const modal = screen.getByRole("dialog");

    await user.click(within(modal).getByRole("button", { name: "ใกล้หมดตามยอดขาย" }));
    expect(within(modal).getByText("แสดง 1–5 จาก 7 รายการ")).toBeInTheDocument();
    await user.click(within(modal).getByRole("button", { name: "2" }));
    expect(within(modal).getByText("Target on later page")).toBeInTheDocument();

    await user.click(within(modal).getByRole("button", { name: "ข้อมูลไม่พอ" }));
    expect(within(modal).getByText("แสดง 1–1 จาก 1 รายการ")).toBeInTheDocument();
    expect(within(modal).getByText("No sale record")).toBeInTheDocument();

    await user.click(within(modal).getByRole("button", { name: "ทั้งหมด" }));
    await user.type(within(modal).getByRole("textbox", { name: "ค้นหาสินค้า" }), "Target");
    expect(within(modal).getByText("แสดง 1–1 จาก 1 รายการ")).toBeInTheDocument();
    expect(within(modal).getByText("Target on later page")).toBeInTheDocument();
  });

  it("renders loading, API error, empty, and no-match states", async () => {
    let resolveForecast!: (rows: typeof mockItems) => void;
    vi.mocked(api.get).mockReturnValueOnce(new Promise((resolve) => { resolveForecast = resolve; }));
    const { unmount } = renderWithProviders(<StockForecast />);
    expect(screen.getByText("กำลังโหลดคาดการณ์…")).toBeInTheDocument();
    resolveForecast([]);
    expect(await screen.findByText("ยังไม่มีสินค้าในร้าน")).toBeInTheDocument();
    unmount();

    vi.mocked(api.get).mockRejectedValueOnce(new Error("unavailable"));
    const user = userEvent.setup();
    const { unmount: unmountError } = renderWithProviders(<StockForecast />);
    expect(await screen.findByText("โหลดคาดการณ์ไม่สำเร็จ")).toBeInTheDocument();
    unmountError();

    vi.mocked(api.get).mockResolvedValueOnce(mockItems.slice(0, 2));
    const { unmount: unmountLoaded } = renderWithProviders(<StockForecast />);
    await screen.findByText("Card Item #1");
    await user.click(screen.getByRole("button", { name: "ดูทั้งหมด" }));
    await user.type(screen.getByRole("textbox", { name: "ค้นหาสินค้า" }), "missing");
    expect(await screen.findByText("ไม่พบสินค้าที่ตรงกับการค้นหาหรือตัวกรอง")).toBeInTheDocument();
    unmountLoaded();
  });
});
