import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { AdminAuctionDetailContent } from "@/features/admin/auctions/AdminAuctionDetailPage";
import { AdminAuctionsPage } from "@/features/admin/auctions/AdminAuctionsPage";
import { AdminBannedBiddersPage } from "@/features/admin/auctions/AdminBannedBiddersPage";
import { StrikeDots } from "@/features/admin/auctions/components/StrikeDots";
import * as auctionApi from "@/features/auction/auction.api";
import { ADMIN_AUCTION_DETAIL_FIXTURES } from "@/features/auction/auction.fixture";
import { render, renderWithProviders, screen, userEvent, waitFor, within } from "@/test/utils";
import { toast } from "@/components/ui/toast";

afterEach(() => {
  vi.restoreAllMocks();
});

// หน้าแอดมินใช้ API จริงแล้ว [TCG-640] — เทสต์นี้ยังใช้ข้อมูล fixture (กรองแท็บ/ค้นหาใน mock)
beforeAll(() => {
  auctionApi.AUCTION_MOCK.admin = true;
});
afterAll(() => {
  auctionApi.AUCTION_MOCK.admin = false;
});

/** แถวในตารางที่มีชื่อการ์ดนี้ */
async function findRow(cardName: string) {
  const cell = await screen.findByText(cardName);
  const row = cell.closest("tr");
  if (!row) throw new Error(`no row for ${cardName}`);
  return within(row);
}

describe("A1 AdminAuctionsPage", () => {
  it("exports every page and builds no file when a page fails [TCG-749]", async () => {
    Object.defineProperty(URL, "createObjectURL", { configurable: true, value: vi.fn(() => "blob:auctions") });
    Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: vi.fn() });
    const toastSpy = vi.spyOn(toast, "add").mockImplementation(vi.fn());
    const all = vi.spyOn(auctionApi, "getAllAdminAuctions").mockRejectedValueOnce(new Error("page 3 failed"));
    const user = userEvent.setup();
    renderWithProviders(<AdminAuctionsPage />, { route: "/admin/auctions?tab=LIVE&q=pika&page=2" });
    await findRow("Pikachu Illustrator");

    await user.click(screen.getByRole("button", { name: "ส่งออก CSV" }));

    await waitFor(() => expect(toastSpy).toHaveBeenCalledWith(expect.objectContaining({ type: "error", title: "ส่งออกไฟล์ไม่สำเร็จ" })));
    expect(all).toHaveBeenCalledWith({ tab: "LIVE", q: "pika" });
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });

  it("shows suspend only on auctions that are still open", async () => {
    renderWithProviders(<AdminAuctionsPage />, { route: "/admin/auctions" });

    for (const live of ["Rayquaza VMAX Alt Art", "Pikachu Illustrator", "Umbreon VMAX Alt Art"]) {
      expect((await findRow(live)).getByRole("button", { name: "ระงับ" })).toBeInTheDocument();
    }
    for (const closed of ["Charizard VMAX #020", "Mewtwo GX Rainbow", "Gengar VMAX Alt Art"]) {
      expect((await findRow(closed)).queryByRole("button", { name: "ระงับ" })).not.toBeInTheDocument();
    }
    expect((await findRow("Gengar VMAX Alt Art")).getByRole("link", { name: "ดูเหตุผล" })).toHaveAttribute("href", "/admin/auctions/98");
  });

  it("shows flags, the flagged banner and the banned-user count", async () => {
    renderWithProviders(<AdminAuctionsPage />, { route: "/admin/auctions" });

    expect((await findRow("Rayquaza VMAX Alt Art")).getByText("บิดผิดปกติ")).toBeInTheDocument();
    expect((await findRow("Pikachu Illustrator")).getByText("ถูกรายงาน 3")).toBeInTheDocument();
    expect(screen.getByText("มี 1 ประมูลที่ถูกรายงาน และ 1 ประมูลที่มีรูปแบบบิดผิดปกติ")).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: "ผู้ใช้ที่ห้ามบิด (5)" })).toBeInTheDocument();
  });

  it("filters rows by tab", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AdminAuctionsPage />, { route: "/admin/auctions" });
    await findRow("Rayquaza VMAX Alt Art");

    await user.click(screen.getByRole("tab", { name: /ถูกระงับ/ }));

    // แถวเดิมค้างไว้ระหว่างโหลดแท็บใหม่ (keepPreviousData)
    await waitFor(() => expect(screen.queryByText("Rayquaza VMAX Alt Art")).not.toBeInTheDocument());
    expect(await findRow("Gengar VMAX Alt Art")).toBeTruthy();
  });

  it("suspends with the typed reason and needs a reason first", async () => {
    const suspend = vi.spyOn(auctionApi, "suspendAuction").mockResolvedValue({ ...ADMIN_AUCTION_DETAIL_FIXTURES[139], status: "SUSPENDED" });
    const user = userEvent.setup();
    renderWithProviders(<AdminAuctionsPage />, { route: "/admin/auctions" });

    await user.click((await findRow("Rayquaza VMAX Alt Art")).getByRole("button", { name: "ระงับ" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText(/Rayquaza VMAX Alt Art · #AUC-2026-0139 · 41 บิด —/)).toBeInTheDocument();

    const confirm = within(dialog).getByRole("button", { name: "ระงับประมูล" });
    expect(confirm).toBeDisabled();
    const reason = within(dialog).getByLabelText("เหตุผล (ผู้ขายและผู้บิดจะเห็น) *");
    await user.type(reason, "   ");
    expect(confirm).toBeDisabled();

    await user.clear(reason);
    await user.type(reason, "  บิดปั่นราคาจากบัญชีที่เชื่อมกับผู้ขาย ");
    await user.click(confirm);

    expect(suspend).toHaveBeenCalledWith(139, { reason: "บิดปั่นราคาจากบัญชีที่เชื่อมกับผู้ขาย" });
  });
});

describe("A3 AdminAuctionDetailContent", () => {
  it("live auction: suspend button, signals and full-name bid log", () => {
    renderWithProviders(<AdminAuctionDetailContent detail={ADMIN_AUCTION_DETAIL_FIXTURES[139]} />);

    expect(screen.getByRole("button", { name: "ระงับประมูล" })).toBeInTheDocument();
    expect(screen.getByText("สัญญาณที่ควรตรวจสอบ (2)")).toBeInTheDocument();
    expect(screen.getAllByText("บัญชีใหม่บิดถี่")).toHaveLength(2);
    expect(screen.getByText("ที่อยู่ตรงผู้ขาย")).toBeInTheDocument();
    expect(screen.getAllByText(/^สมัคร 2 วัน · 0 คำสั่งซื้อ$/).length).toBeGreaterThan(0);
    expect(screen.getByText("ยังไม่มีการดำเนินการ — การระงับ/ยกเลิกโทษจะถูกบันทึกที่นี่และในบันทึกกิจกรรม")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "ดูโปรไฟล์ผู้ขาย" })).toHaveAttribute("href", "/admin/users?q=rarecard_station");
  });

  it("suspended auction: no suspend button, reason in the admin log", () => {
    renderWithProviders(<AdminAuctionDetailContent detail={ADMIN_AUCTION_DETAIL_FIXTURES[98]} />);

    expect(screen.queryByRole("button", { name: "ระงับประมูล" })).not.toBeInTheDocument();
    expect(screen.getByText("รูปการ์ดคัดลอกจากร้านอื่น ผู้ขายไม่มีการ์ดใบนี้จริง")).toBeInTheDocument();
  });
});

describe("StrikeDots", () => {
  it.each([0, 1, 2, 3])("fills %i dot(s) out of 3", (count) => {
    const { container } = render(<StrikeDots count={count} limit={3} />);
    expect(container.querySelectorAll("[data-filled]")).toHaveLength(count);
    expect(screen.getByText(`${count}/3`)).toBeInTheDocument();
    expect(screen.getByLabelText(`ไม่ชำระ ${count} จาก 3 ครั้ง`)).toBeInTheDocument();
  });
});

describe("A4 AdminBannedBiddersPage", () => {
  it("lifts a ban from the dialog", async () => {
    const lift = vi.spyOn(auctionApi, "liftBiddingBan").mockImplementation(async (userId) => ({
      userId,
      username: "kanok.a",
      maskedEmail: "k***a@gmail.com",
      memberSince: new Date().toISOString(),
      strikeCount: 0,
      strikeLimit: 3,
      bannedUntil: null,
      liftedAt: new Date().toISOString(),
      strikes: [],
    }));
    const user = userEvent.setup();
    renderWithProviders(<AdminBannedBiddersPage />, { route: "/admin/auctions/banned-bidders" });

    const row = await findRow("kanok.a");
    expect(row.getByText("3/3")).toBeInTheDocument();
    await user.click(row.getByRole("button", { name: "ยกเลิกโทษ" }));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("ยกเลิกโทษห้ามบิดของ kanok.a?")).toBeInTheDocument();
    expect(within(dialog).getByText("#AUC-2026-0090")).toBeInTheDocument();
    expect(within(dialog).getByText("#AUC-2026-0121")).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "ยกเลิกโทษ" }));

    expect(lift).toHaveBeenCalledWith(401, { reason: null });
  });

  it("near-ban tab shows 2/3 without a lift action", async () => {
    renderWithProviders(<AdminBannedBiddersPage />, { route: "/admin/auctions/banned-bidders?tab=AT_RISK" });

    const row = await findRow("jay.collect");
    expect(row.getByText("2/3")).toBeInTheDocument();
    expect(row.queryByRole("button", { name: "ยกเลิกโทษ" })).not.toBeInTheDocument();
    expect(row.getByRole("button", { name: "ดูประวัติ" })).toBeInTheDocument();
  });

  it("shows the empty state when nobody matches", async () => {
    renderWithProviders(<AdminBannedBiddersPage />, { route: "/admin/auctions/banned-bidders?q=nobody-here" });

    expect(await screen.findByText("ไม่มีผู้ใช้ที่ถูกห้ามบิด")).toBeInTheDocument();
    expect(screen.getByText("ผู้ที่ไม่ชำระหลังชนะครบ 3 ครั้งจะแสดงที่นี่โดยอัตโนมัติ")).toBeInTheDocument();
  });
});
