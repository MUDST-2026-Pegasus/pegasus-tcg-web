import { afterEach, describe, expect, it, vi } from "vitest";

import * as auctionApi from "@/features/auction/auction.api";
import { SELLER_AUCTION_DETAIL_FIXTURES } from "@/features/auction/auction.fixture";
import type { SellerAuctionDetail } from "@/features/auction/auction.types";
import { SellerAuctionDetailContent } from "@/features/seller/auctions/SellerAuctionDetailPage";
import { ApiError } from "@/lib/api/errors";
import { renderWithProviders, screen, userEvent, within } from "@/test/utils";

const withBids = SELLER_AUCTION_DETAIL_FIXTURES[142];
const noBids = SELLER_AUCTION_DETAIL_FIXTURES[150];

function renderDetail(detail: SellerAuctionDetail) {
  return renderWithProviders(<SellerAuctionDetailContent detail={detail} />, { route: `/seller/auctions/${detail.id}` });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("SellerAuctionDetailContent — มีบิดแล้ว", () => {
  it("disables cancel and hides edit once someone has bid", () => {
    renderDetail(withBids);

    expect(screen.getByRole("button", { name: "ยกเลิกประมูล" })).toBeDisabled();
    expect(screen.getByText("ยกเลิกไม่ได้ — มีผู้บิดแล้ว")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "แก้ไข" })).not.toBeInTheDocument();
    expect(screen.getByText("มีผู้บิดแล้ว จึงแก้การตั้งค่าไม่ได้")).toBeInTheDocument();
  });

  it("shows the header, numbers and bid history from the card", () => {
    renderDetail(withBids);

    expect(screen.getByRole("heading", { name: "Charizard VMAX #020" })).toBeInTheDocument();
    expect(screen.getByText("#AUC-2026-0142")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "ดูหน้าประมูล" })).toHaveAttribute("href", "/auctions/142");
    expect(screen.getByText("จาก 7 ผู้บิด")).toBeInTheDocument();
    expect(screen.getByText("34")).toBeInTheDocument();
    expect(screen.getByText("หลังค่าคอมมิชชั่น 5%")).toBeInTheDocument();
    expect(screen.getByText("฿12,000 · ปิดแล้ว (มีบิดแรก)")).toBeInTheDocument();

    const rows = screen.getAllByRole("row").slice(1);
    expect(rows).toHaveLength(withBids.bids.length);
    expect(within(rows[0]).getByText("สูงสุด")).toBeInTheDocument();
    expect(within(rows[rows.length - 1]).getByText(/· บิดแรก$/)).toBeInTheDocument();
  });

  it("shows a new-bid banner when a poll brings more bids", () => {
    const { rerender } = renderDetail(withBids);
    expect(screen.queryByText(/^มีบิดใหม่/)).not.toBeInTheDocument();

    rerender(<SellerAuctionDetailContent detail={{ ...withBids, bidCount: 13, currentPrice: 8550 }} />);

    expect(screen.getByText("มีบิดใหม่ ฿8,550")).toBeInTheDocument();
  });
});

describe("SellerAuctionDetailContent — ยังไม่มีบิด", () => {
  it("cancels the auction through the cancel dialog", async () => {
    const cancel = vi.spyOn(auctionApi, "cancelAuction").mockResolvedValue({ ...noBids, status: "CANCELLED", cancellable: false, editable: false });
    const user = userEvent.setup();
    renderDetail(noBids);

    await user.click(screen.getByRole("button", { name: "ยกเลิกประมูล" }));
    const dialog = await screen.findByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "ยกเลิกประมูล" }));

    expect(cancel).toHaveBeenCalledWith(150);
  });

  it("saves a new buy-now price", async () => {
    const update = vi.spyOn(auctionApi, "updateAuction").mockResolvedValue({ ...noBids, buyNowPrice: 3200 });
    const user = userEvent.setup();
    renderDetail(noBids);

    await user.click(screen.getByRole("button", { name: "แก้ไข" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Pikachu VMAX — Rainbow · ยังไม่มีผู้บิด · ราคาเริ่มต้น ฿2,400")).toBeInTheDocument();
    expect(within(dialog).getByText("เดิม ฿3,500 · ต้องสูงกว่าราคาเริ่มต้น ฿2,400")).toBeInTheDocument();

    const input = within(dialog).getByLabelText("ราคาซื้อทันที");
    await user.clear(input);
    await user.type(input, "3200");
    await user.click(within(dialog).getByRole("button", { name: "บันทึก" }));

    expect(update).toHaveBeenCalledWith(150, { buyNowPrice: 3200, sellerNote: null });
  });

  it("turns buy-now off with a null price", async () => {
    const update = vi.spyOn(auctionApi, "updateAuction").mockResolvedValue({ ...noBids, buyNowPrice: null, buyNowAvailable: false });
    const user = userEvent.setup();
    renderDetail(noBids);

    await user.click(screen.getByRole("button", { name: "แก้ไข" }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("switch"));
    expect(within(dialog).queryByLabelText("ราคาซื้อทันที")).not.toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "บันทึก" }));

    expect(update).toHaveBeenCalledWith(150, { buyNowPrice: null, sellerNote: null });
  });

  it("does not save a price at or below the starting price", async () => {
    const update = vi.spyOn(auctionApi, "updateAuction");
    const user = userEvent.setup();
    renderDetail(noBids);

    await user.click(screen.getByRole("button", { name: "แก้ไข" }));
    const dialog = await screen.findByRole("dialog");
    const input = within(dialog).getByLabelText("ราคาซื้อทันที");
    await user.clear(input);
    await user.type(input, "2400");
    await user.click(within(dialog).getByRole("button", { name: "บันทึก" }));

    expect(within(dialog).getByText("ราคาซื้อทันทีต้องสูงกว่าราคาเริ่มต้น")).toBeInTheDocument();
    expect(update).not.toHaveBeenCalled();
  });

  it("locks the dialog when the first bid lands before saving", async () => {
    vi.spyOn(auctionApi, "updateAuction").mockRejectedValue(
      new ApiError({ status: 409, code: "AUCTION_HAS_BIDS", message: "auction has bids" }),
    );
    const user = userEvent.setup();
    renderDetail(noBids);

    await user.click(screen.getByRole("button", { name: "แก้ไข" }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "บันทึก" }));

    expect(await within(dialog).findByText("แก้ไม่ได้แล้ว — มีผู้บิดคนแรก")).toBeInTheDocument();
    expect(within(dialog).getByText("ปุ่มซื้อทันทีหายไปแล้ว ประมูลนี้เป็นประมูลปกติจนหมดเวลา")).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "บันทึก" })).toBeDisabled();
  });
});

describe("SellerAuctionDetailContent — จบแล้ว", () => {
  it("winner did not pay: notice, red last step and relist links", () => {
    renderDetail(SELLER_AUCTION_DETAIL_FIXTURES[121]);

    expect(screen.getByText("ไม่มีผู้ชำระ")).toBeInTheDocument();
    expect(screen.getByText("ผู้ชนะไม่ชำระ — การ์ดกลับเข้าสต็อกแล้ว")).toBeInTheDocument();
    const lastStep = screen.getByText("ผู้ชนะไม่ชำระใน 24 ชม. → ยกเลิกคำสั่งซื้อ · การ์ดกลับเข้าสต็อก").closest("li");
    expect(lastStep).toHaveAttribute("data-tone", "failed");

    const relist = screen.getAllByRole("button", { name: "ประมูลใหม่" });
    expect(relist).toHaveLength(2);
    for (const link of relist) expect(link).toHaveAttribute("href", "/seller/auctions/new?from=121");
    expect(screen.queryByRole("button", { name: "ยกเลิกประมูล" })).not.toBeInTheDocument();
  });

  it("no bids: notice with relist", () => {
    renderDetail(SELLER_AUCTION_DETAIL_FIXTURES[126]);

    expect(screen.getAllByText("ไม่มีผู้บิด — การ์ดกลับเข้าสต็อกแล้ว").length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: "ประมูลใหม่" })[0]).toHaveAttribute("href", "/seller/auctions/new?from=126");
  });

  it("awaiting payment: waiting notice", () => {
    renderDetail(SELLER_AUCTION_DETAIL_FIXTURES[117]);
    expect(screen.getByText("ประมูลจบ — รอผู้ชนะชำระเงิน")).toBeInTheDocument();
  });

  it("bought with buy-now: buy-now notice", () => {
    renderDetail(SELLER_AUCTION_DETAIL_FIXTURES[158]);
    expect(within(screen.getByRole("status")).getByText("ขายด้วยซื้อทันที ฿3,500")).toBeInTheDocument();
  });
});
