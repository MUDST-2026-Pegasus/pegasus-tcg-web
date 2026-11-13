import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { toast } from "@/components/ui/toast";
import * as catalogApi from "@/features/admin/catalog.api";
import type { Game } from "@/features/admin/catalog.types";
import { AdminWeeklyReportPage } from "@/features/admin/pages/AdminWeeklyReportPage";
import * as reportApi from "@/features/admin/weekly-report.api";
import type { WeeklyReport } from "@/features/admin/weekly-report.types";
import { downloadBlob } from "@/lib/download";
import { renderWithProviders } from "@/test/utils";

vi.mock("@/features/admin/weekly-report.api", () => ({
  getWeeklyReport: vi.fn(),
  exportWeeklyReport: vi.fn(),
  getWeeklyThresholds: vi.fn(),
  updateWeeklyThresholds: vi.fn(),
}));
vi.mock("@/features/admin/catalog.api", () => ({ getGames: vi.fn() }));
vi.mock("@/lib/download", () => ({ downloadBlob: vi.fn() }));

const ROUTE = "/admin/reports/weekly-stock-profit?week=2026-08-03";

const report: WeeklyReport = {
  startDate: "2026-08-03",
  endDate: "2026-08-09",
  hasData: true,
  meta: {
    startDate: "2026-08-03",
    endDate: "2026-08-09",
    timezone: "Asia/Bangkok",
    gameCategory: null,
    productType: null,
    commissionRatePercent: 3,
  },
  summary: {
    gmv: 428500,
    weeklyGmv: 428500,
    commission: 12000,
    commissionCollected: 12000,
    netProfit: 12855,
    initialStock: 7654,
    soldCount: 1470,
    remainingStock: 6184,
    stockDepleted: 1470,
    wowChangePercent: 18.2,
  },
  chartData: [{ date: "2026-08-03", singles: 100, sealed: 50, other: 0 }],
  kpiHistory: [{ date: "2026-08-03", gmv: 150, netProfit: 20, commission: 5, remainingStock: 6184 }],
  gameDistribution: [
    { game: "Pokémon", gameSlug: "pokemon", gmv: 240000, netProfit: 7200, remainingStock: 2469, percentage: 56 },
    { game: "One Piece", gameSlug: "one-piece", gmv: 103500, netProfit: 3105, remainingStock: 1970, percentage: 24 },
  ],
  breakdownByGameAndType: [
    {
      game: "Pokémon", gameSlug: "pokemon", productType: "SINGLE_CARD", productTypeLabel: "การ์ดเดี่ยว",
      initialStock: 2350, soldCount: 610, remainingStock: 1740, gmv: 146800, commission: 4404, netProfit: 4404,
      status: "FAST_MOVING", statusLabel: "สต็อกหมุนเวียนเร็ว",
    },
    {
      game: "Pokémon", gameSlug: "pokemon", productType: "SEALED", productTypeLabel: "กล่อง/ซองสุ่ม",
      initialStock: 395, soldCount: 145, remainingStock: 250, gmv: 39200, commission: 1176, netProfit: 1176,
      status: "LOW_STOCK", statusLabel: "สต็อกต่ำ",
    },
  ],
  totals: {
    initialStock: 7654, soldCount: 1470, remainingStock: 6184, singleCards: 4500, sealedBoxes: 1684, otherItems: 0,
    gmv: 428500, weeklyGmv: 428500, commission: 12000, commissionCollected: 12000, netProfit: 12855,
  },
};

const emptyReport: WeeklyReport = {
  ...report,
  hasData: false,
  summary: {
    gmv: 0, weeklyGmv: 0, commission: 0, commissionCollected: 0, netProfit: 0,
    initialStock: 0, soldCount: 0, remainingStock: 0, stockDepleted: 0, wowChangePercent: 0,
  },
  chartData: [{ date: "2026-08-03", singles: 0, sealed: 0, other: 0 }],
  kpiHistory: [{ date: "2026-08-03", gmv: 0, netProfit: 0, commission: 0, remainingStock: 0 }],
  gameDistribution: [],
  breakdownByGameAndType: [],
  totals: {
    initialStock: 0, soldCount: 0, remainingStock: 0, singleCards: 0, sealedBoxes: 0, otherItems: 0,
    gmv: 0, weeklyGmv: 0, commission: 0, commissionCollected: 0, netProfit: 0,
  },
};

const games = [
  { id: 1, name: "Pokémon", slug: "pokemon", active: true },
  { id: 2, name: "One Piece", slug: "one-piece", active: true },
  { id: 3, name: "Retired", slug: "retired", active: false },
] as Game[];

async function openExportDialog(user: ReturnType<typeof userEvent.setup>) {
  await screen.findByText("THB 428,500.00", { selector: "p" });
  await user.click(screen.getByRole("button", { name: "ส่งออกรายงาน" }));
  return screen.findByRole("dialog");
}

describe("AdminWeeklyReportPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(reportApi.getWeeklyReport).mockResolvedValue(report);
    vi.mocked(catalogApi.getGames).mockResolvedValue(games);
  });

  it("requests the selected Monday-to-Sunday week and shows API figures", async () => {
    renderWithProviders(<AdminWeeklyReportPage />, { route: ROUTE });

    expect(await screen.findByText("THB 428,500.00", { selector: "p" })).toBeInTheDocument();
    expect(reportApi.getWeeklyReport).toHaveBeenCalledWith({ weekStart: "2026-08-03", game: null });
    expect(screen.getByText("THB 12,855.00", { selector: "p" })).toBeInTheDocument();
    expect(screen.getByText("THB 12,000.00", { selector: "p" })).toBeInTheDocument();
    expect(screen.getByText("6,184", { selector: "p" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /สัปดาห์ที่ 3 - 9 ส.ค. 2569/ })).toBeInTheDocument();
  });

  it("renders breakdown rows and backend totals", async () => {
    renderWithProviders(<AdminWeeklyReportPage />, { route: ROUTE });

    const single = (await screen.findByRole("cell", { name: "การ์ดเดี่ยว" })).closest("tr")!;
    expect(within(single).getByText("Pokémon")).toBeInTheDocument();
    expect(within(single).getByText("1,740")).toBeInTheDocument();
    expect(within(single).getByText("THB 146,800.00")).toBeInTheDocument();
    expect(within(single).getByText("สต็อกหมุนเวียนเร็ว")).toBeInTheDocument();

    const sealed = screen.getByRole("cell", { name: "กล่อง/ซองสุ่ม" }).closest("tr")!;
    expect(within(sealed).getByText("สต็อกต่ำ")).toBeInTheDocument();

    const totals = screen.getByRole("cell", { name: "รวมทั้งหมด" }).closest("tr")!;
    expect(within(totals).getByText("7,654")).toBeInTheDocument();
    expect(within(totals).getByText("THB 428,500.00")).toBeInTheDocument();
    expect(within(totals).getByText("THB 12,855.00")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "กำไรสุทธิ" })).toBeInTheDocument();
  });

  it("refetches when the game filter changes and lists only active games with shares", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AdminWeeklyReportPage />, { route: ROUTE });
    await screen.findByText("THB 428,500.00", { selector: "p" });

    await user.click(screen.getByRole("button", { name: /ทุกเกม/ }));
    expect(screen.queryByRole("button", { name: /Retired/ })).not.toBeInTheDocument();
    await user.click(await screen.findByRole("button", { name: /Pokémon.*56%/ }));

    await waitFor(() =>
      expect(reportApi.getWeeklyReport).toHaveBeenCalledWith({ weekStart: "2026-08-03", game: "pokemon" }),
    );
  });

  it("refetches when the week changes", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AdminWeeklyReportPage />, { route: ROUTE });
    await screen.findByText("THB 428,500.00", { selector: "p" });

    await user.click(screen.getByRole("button", { name: /สัปดาห์ที่ 3 - 9 ส.ค. 2569/ }));
    await user.click(await screen.findByRole("button", { name: /สัปดาห์ก่อนหน้า/ }));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /สัปดาห์ที่/ })).not.toHaveTextContent("3 - 9 ส.ค. 2569"),
    );
  });

  it("shows the empty state instead of charts, with no NaN or undefined", async () => {
    vi.mocked(reportApi.getWeeklyReport).mockResolvedValue(emptyReport);
    const { container } = renderWithProviders(<AdminWeeklyReportPage />, { route: ROUTE });

    expect(
      await screen.findByText("ไม่พบรายการเคลื่อนไหวสต็อกและกำไรในสัปดาห์ที่เลือก"),
    ).toBeInTheDocument();
    expect(screen.queryByText("สัดส่วนสต็อกและกำไรตามเกม")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "กลับไปสัปดาห์ปัจจุบัน" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "ส่งออกรายงาน" })).toBeDisabled();
    expect(container.textContent).not.toMatch(/NaN|undefined/);
  });

  it("shows a retryable error when the report fails", async () => {
    vi.mocked(reportApi.getWeeklyReport).mockRejectedValue(new Error("Network Error"));
    renderWithProviders(<AdminWeeklyReportPage />, { route: ROUTE });

    expect(await screen.findByText("โหลดรายงานรายสัปดาห์ไม่สำเร็จ", {}, { timeout: 5000 })).toBeInTheDocument();
  });

  it("disables filters and export while fetching", async () => {
    vi.mocked(reportApi.getWeeklyReport).mockReturnValue(new Promise(() => {}));
    renderWithProviders(<AdminWeeklyReportPage />, { route: ROUTE });

    expect(screen.getByRole("button", { name: /สัปดาห์ที่ 3 - 9/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /ทุกเกม/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: "ส่งออกรายงาน" })).toBeDisabled();
  });

  it("downloads the chosen format with a loading state, once, then a success toast", async () => {
    const user = userEvent.setup();
    const add = vi.spyOn(toast, "add");
    let finish!: (value: { blob: Blob; filename: string | null }) => void;
    vi.mocked(reportApi.exportWeeklyReport).mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    renderWithProviders(<AdminWeeklyReportPage />, { route: ROUTE });

    const dialog = await openExportDialog(user);
    expect(within(dialog).getByText("2 หมวดหมู่ (ยอดขายรวม THB 428,500.00)")).toBeInTheDocument();
    await user.click(within(dialog).getByText("Excel (.xlsx)"));
    await user.click(within(dialog).getByRole("button", { name: "ดาวน์โหลดรายงาน" }));

    const busy = await within(dialog).findByRole("button", { name: /กำลังสร้างไฟล์/ });
    expect(busy).toBeDisabled();
    expect(within(dialog).getByRole("button", { name: "ยกเลิก" })).toBeDisabled();
    expect(reportApi.exportWeeklyReport).toHaveBeenCalledTimes(1);
    expect(reportApi.exportWeeklyReport).toHaveBeenCalledWith(
      { weekStart: "2026-08-03", game: null },
      "xlsx",
      ["kpi", "breakdown"],
    );

    const blob = new Blob(["x"]);
    finish({ blob, filename: "pegasus_weekly_report_2026_32.xlsx" });

    await waitFor(() =>
      expect(downloadBlob).toHaveBeenCalledWith(blob, "pegasus_weekly_report_2026_32.xlsx"),
    );
    expect(add).toHaveBeenCalledWith(expect.objectContaining({ type: "success" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("sends one export request when the button is clicked twice in the same tick", async () => {
    const user = userEvent.setup();
    vi.mocked(reportApi.exportWeeklyReport).mockReturnValue(new Promise(() => {}));
    renderWithProviders(<AdminWeeklyReportPage />, { route: ROUTE });

    const dialog = await openExportDialog(user);
    const button = within(dialog).getByRole<HTMLButtonElement>("button", { name: "ดาวน์โหลดรายงาน" });
    button.click();
    button.click();

    await within(dialog).findByRole("button", { name: /กำลังสร้างไฟล์/ });
    expect(reportApi.exportWeeklyReport).toHaveBeenCalledTimes(1);
  });

  it("exports only the chosen datasets and needs at least one", async () => {
    const user = userEvent.setup();
    vi.mocked(reportApi.exportWeeklyReport).mockResolvedValue({ blob: new Blob(["x"]), filename: null });
    renderWithProviders(<AdminWeeklyReportPage />, { route: ROUTE });

    const dialog = await openExportDialog(user);
    const download = within(dialog).getByRole("button", { name: "ดาวน์โหลดรายงาน" });

    await user.click(within(dialog).getByRole("checkbox", { name: /สรุป KPI/ }));
    await user.click(within(dialog).getByRole("checkbox", { name: /ตารางแยกตามเกม/ }));
    expect(download).toBeDisabled();
    expect(within(dialog).getByText("เลือกข้อมูลอย่างน้อย 1 ชุด")).toBeInTheDocument();

    await user.click(within(dialog).getByRole("checkbox", { name: /ตารางแยกตามเกม/ }));
    await user.click(download);

    await waitFor(() =>
      expect(reportApi.exportWeeklyReport).toHaveBeenCalledWith(
        { weekStart: "2026-08-03", game: null },
        "csv",
        ["breakdown"],
      ),
    );
  });

  describe("settings dialog", () => {
    const thresholds = { lowStockThreshold: 500, fastMovingPercent: 30, standardCommissionRatePercent: 5 };

    async function openSettings(user: ReturnType<typeof userEvent.setup>) {
      await user.click(screen.getByRole("button", { name: "ตั้งค่าระบบ" }));
      await screen.findByLabelText(/เกณฑ์แจ้งเตือนสต็อกต่ำ/);
    }

    beforeEach(() => {
      vi.mocked(reportApi.getWeeklyThresholds).mockResolvedValue(thresholds);
    });

    it("shows saved thresholds and a read-only commission rate", async () => {
      const user = userEvent.setup();
      renderWithProviders(<AdminWeeklyReportPage />, { route: ROUTE });
      await openSettings(user);

      expect(screen.getByLabelText(/เกณฑ์แจ้งเตือนสต็อกต่ำ/)).toHaveValue("500");
      expect(screen.getByLabelText(/เกณฑ์สต็อกหมุนเวียนเร็ว/)).toHaveValue("30");
      expect(screen.getByLabelText(/อัตราค่าคอมมิชชั่นมาตรฐาน/)).toHaveValue("5%");
      expect(screen.getByLabelText(/อัตราค่าคอมมิชชั่นมาตรฐาน/)).toBeDisabled();
    });

    it("saves as numbers, refetches the report and closes", async () => {
      const user = userEvent.setup();
      const add = vi.spyOn(toast, "add");
      vi.mocked(reportApi.updateWeeklyThresholds).mockResolvedValue({ ...thresholds, lowStockThreshold: 800 });
      renderWithProviders(<AdminWeeklyReportPage />, { route: ROUTE });
      await screen.findByText("THB 428,500.00", { selector: "p" });
      await openSettings(user);
      vi.mocked(reportApi.getWeeklyReport).mockClear();

      const low = screen.getByLabelText(/เกณฑ์แจ้งเตือนสต็อกต่ำ/);
      await user.clear(low);
      await user.type(low, "800");
      await user.click(screen.getByRole("button", { name: "บันทึกการตั้งค่า" }));

      await waitFor(() =>
        expect(reportApi.updateWeeklyThresholds).toHaveBeenCalledWith({
          lowStockThreshold: 800,
          fastMovingPercent: 30,
        }),
      );
      await waitFor(() => expect(reportApi.getWeeklyReport).toHaveBeenCalled());
      expect(add).toHaveBeenCalledWith(expect.objectContaining({ type: "success" }));
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    });

    it("rejects values the API would refuse", async () => {
      const user = userEvent.setup();
      renderWithProviders(<AdminWeeklyReportPage />, { route: ROUTE });
      await openSettings(user);

      const percent = screen.getByLabelText(/เกณฑ์สต็อกหมุนเวียนเร็ว/);
      await user.clear(percent);
      await user.type(percent, "101");
      await user.click(screen.getByRole("button", { name: "บันทึกการตั้งค่า" }));

      expect(await screen.findByText("ระบุเปอร์เซ็นต์เป็นเลขจำนวนเต็ม 1-100")).toBeInTheDocument();
      expect(reportApi.updateWeeklyThresholds).not.toHaveBeenCalled();
    });

    it("keeps the dialog open with an error toast when saving fails", async () => {
      const user = userEvent.setup();
      const add = vi.spyOn(toast, "add");
      vi.mocked(reportApi.updateWeeklyThresholds).mockRejectedValue(new Error("boom"));
      renderWithProviders(<AdminWeeklyReportPage />, { route: ROUTE });
      await openSettings(user);

      await user.click(screen.getByRole("button", { name: "บันทึกการตั้งค่า" }));

      await waitFor(() => expect(add).toHaveBeenCalledWith(expect.objectContaining({ type: "error" })));
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });

  it("keeps the dialog open with an error toast when export fails", async () => {
    const user = userEvent.setup();
    const add = vi.spyOn(toast, "add");
    vi.mocked(reportApi.exportWeeklyReport).mockRejectedValue(new Error("boom"));
    renderWithProviders(<AdminWeeklyReportPage />, { route: ROUTE });

    const dialog = await openExportDialog(user);
    await user.click(within(dialog).getByRole("button", { name: "ดาวน์โหลดรายงาน" }));

    await waitFor(() =>
      expect(add).toHaveBeenCalledWith(expect.objectContaining({ type: "error" })),
    );
    expect(downloadBlob).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
