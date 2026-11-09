import { beforeEach, describe, expect, it, vi } from "vitest";

import * as auditApi from "@/features/admin/audit.api";
import type { AuditLogEntry, AuditSummary } from "@/features/admin/audit.types";
import { AdminActivityLogPage } from "@/features/admin/pages/AdminActivityLogPage";
import { ApiError, type PageResponse } from "@/lib/api";
import { renderWithProviders, screen, userEvent, waitFor, within } from "@/test/utils";

vi.mock("@/features/admin/audit.api", () => ({
  getAuditLogs: vi.fn(),
  getAuditSummary: vi.fn(),
}));

const kant = { userId: 7, username: "admin_kant", displayName: "Kant Somsak" };

function entry(overrides: Partial<AuditLogEntry>): AuditLogEntry {
  return {
    id: 1,
    occurredAt: new Date().toISOString(),
    actor: kant,
    action: "SELLER_VERIFICATION_APPROVED",
    targetType: "SELLER_VERIFICATION",
    targetId: "12",
    summary: "Approved seller verification #12",
    metadata: { sellerProfileId: 4 },
    ipAddress: "203.0.113.4",
    ...overrides,
  };
}

const approve = entry({ id: 3 });
const rateChange = entry({
  id: 2,
  action: "SETTING_UPDATED",
  targetType: "SETTING",
  targetId: "commission.default_rate",
  summary: "Changed setting commission.default_rate",
  metadata: { before: 5, after: 7 },
});
const autoRelease = entry({
  id: 1,
  actor: null,
  action: "ORDERS_AUTO_RELEASED",
  targetType: "JOB",
  targetId: "orderAutoRelease",
  summary: "Auto-completed 4 order(s) and released escrow",
  metadata: { completed: 4, failed: 0 },
  ipAddress: null,
});

function page(items: AuditLogEntry[], overrides: Partial<PageResponse<AuditLogEntry>> = {}): PageResponse<AuditLogEntry> {
  return { items, page: 0, size: 20, totalItems: items.length, totalPages: items.length ? 1 : 0, ...overrides };
}

const summary: AuditSummary = {
  total: 318,
  byAdmins: 47,
  bySystem: 271,
  byAction: { SETTING_UPDATED: 2, USER_ROLE_GRANTED: 1, SELLER_VERIFICATION_APPROVED: 9 },
  topActors: [
    { ...kant, count: 28 },
    { userId: 8, username: "admin_sorravit", displayName: "Sorravit", count: 19 },
  ],
};

describe("AdminActivityLogPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auditApi.getAuditSummary).mockResolvedValue(summary);
  });

  it("shows the timeline, the system as ระบบ, and today's summary from the API", async () => {
    vi.mocked(auditApi.getAuditLogs).mockResolvedValue(page([approve, rateChange, autoRelease]));

    renderWithProviders(<AdminActivityLogPage />, { route: "/admin/activity-log" });

    expect(screen.getByRole("heading", { name: "บันทึกกิจกรรม" })).toBeInTheDocument();
    expect(await screen.findByText("อนุมัติคำขอเปิดร้าน")).toBeInTheDocument();
    expect(screen.getByText("แก้ไขการตั้งค่าระบบ")).toBeInTheDocument();
    expect(screen.getByText("ค่าคอมมิชชั่นพื้นฐาน · 5 → 7")).toBeInTheDocument();
    expect(screen.getByText("ระบบ")).toBeInTheDocument();
    expect(screen.getByText("ปิดคำสั่งซื้อและปล่อยเงินอัตโนมัติ")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /^วันนี้ · / })).toBeInTheDocument();

    // สรุปวันนี้ + ผู้ดูแลที่ใช้งานมากสุด
    expect(await screen.findByText("318")).toBeInTheDocument();
    expect(screen.getByText("47")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument(); // SETTING_UPDATED 2 + USER_ROLE_GRANTED 1
    expect(screen.getByText("admin_sorravit")).toBeInTheDocument();
    expect(screen.getByText("28 การกระทำ")).toBeInTheDocument();
    expect(screen.getByText("บันทึกนี้แก้ไขไม่ได้")).toBeInTheDocument();

    // ค่าเริ่มต้น: 7 วันล่าสุด หน้าแรก
    const params = vi.mocked(auditApi.getAuditLogs).mock.calls[0][0];
    expect(params).toMatchObject({ page: 0, size: 20 });
    expect(params.from).toBeDefined();
    expect(params.targetType).toBeUndefined();
  });

  it("reads filters and the page from the URL, so a reload stays where it was", async () => {
    vi.mocked(auditApi.getAuditLogs).mockResolvedValue(page([approve], { page: 1, totalItems: 21, totalPages: 2 }));

    renderWithProviders(<AdminActivityLogPage />, {
      route: "/admin/activity-log?q=rule&type=finance&range=all&page=2",
    });

    await screen.findByText("อนุมัติคำขอเปิดร้าน");
    expect(auditApi.getAuditLogs).toHaveBeenCalledWith(
      expect.objectContaining({
        q: "rule",
        targetType: ["COMMISSION_RULE", "PAYMENT", "PAYOUT", "REFUND"],
        from: undefined,
        page: 1,
      }),
    );
    expect(screen.getByRole("searchbox", { name: "ค้นหาในบันทึกกิจกรรม" })).toHaveValue("rule");
    expect(screen.getByText("หน้า 2 จาก 2")).toBeInTheDocument();
  });

  it("shows an action the page does not know with a fallback label instead of crashing", async () => {
    vi.mocked(auditApi.getAuditLogs).mockResolvedValue(
      page([entry({ action: "PROMOTION_PAUSED", targetType: "PROMOTION", targetId: "9", summary: "Paused promotion" })]),
    );

    renderWithProviders(<AdminActivityLogPage />, { route: "/admin/activity-log" });

    expect(await screen.findByText("Promotion paused")).toBeInTheDocument();
    expect(screen.getByText("Promotion #9")).toBeInTheDocument();
  });

  it("opens the details sheet with old → new values instead of raw JSON", async () => {
    const user = userEvent.setup();
    vi.mocked(auditApi.getAuditLogs).mockResolvedValue(page([rateChange]));

    renderWithProviders(<AdminActivityLogPage />, { route: "/admin/activity-log" });

    await user.click(await screen.findByRole("button", { name: /แก้ไขการตั้งค่าระบบ/ }));

    const sheet = await screen.findByRole("dialog");
    expect(within(sheet).getByText("รายละเอียดกิจกรรม")).toBeInTheDocument();
    expect(within(sheet).getByText("Kant Somsak (@admin_kant)")).toBeInTheDocument();
    expect(within(sheet).getByText("5")).toBeInTheDocument();
    expect(within(sheet).getByText("7")).toBeInTheDocument();
    expect(within(sheet).queryByText(/"before"/)).not.toBeInTheDocument();
    expect(within(sheet).getByRole("link", { name: /ไปที่หน้าที่เกี่ยวข้อง/ })).toHaveAttribute("href", "/admin/commission");
  });

  it("offers to clear filters when nothing matches", async () => {
    const user = userEvent.setup();
    vi.mocked(auditApi.getAuditLogs).mockResolvedValue(page([]));

    renderWithProviders(<AdminActivityLogPage />, { route: "/admin/activity-log?q=nothing" });

    expect(await screen.findByText("ไม่พบกิจกรรมที่ตรงกับตัวกรอง")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "ล้างตัวกรอง" }));
    await waitFor(() =>
      expect(auditApi.getAuditLogs).toHaveBeenLastCalledWith(expect.objectContaining({ q: undefined, page: 0 })),
    );
  });

  it("shows an error state when the log cannot be loaded", async () => {
    vi.mocked(auditApi.getAuditLogs).mockRejectedValue(
      new ApiError({ status: 500, code: "INTERNAL_ERROR", message: "boom" }),
    );

    renderWithProviders(<AdminActivityLogPage />, { route: "/admin/activity-log" });

    expect(await screen.findByText("โหลดบันทึกกิจกรรมไม่สำเร็จ")).toBeInTheDocument();
  });
});
