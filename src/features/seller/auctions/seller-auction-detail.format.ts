import { translate } from "@/lib/language";
import { formatAuctionShortDateTime, formatBaht } from "@/features/auction/auction.format";
import type { AuctionBid, SellerAuctionDetail, SellerAuctionRow } from "@/features/auction/auction.types";

/**
 * ตรรกะของหน้า S4 รายละเอียดประมูลฝั่งผู้ขาย [TCG-634 · FE-8]
 * แยกจาก component ให้ test ได้ตรง ๆ
 */

/** รายละเอียด → แถวตาราง S1 ใช้ป้ายสถานะและ dialog ยกเลิกชุดเดียวกับ S1 */
export function toSellerAuctionRow(detail: SellerAuctionDetail): SellerAuctionRow {
  return {
    id: detail.id,
    auctionNumber: detail.auctionNumber,
    item: detail.item,
    unitLabel: detail.unitLabel,
    startingPrice: detail.startingPrice,
    currentPrice: detail.currentPrice,
    bidCount: detail.bidCount,
    buyNowPrice: detail.buyNowPrice,
    buyNowAvailable: detail.buyNowAvailable,
    status: detail.status,
    endsAt: detail.endsAt,
    deadline: detail.paymentDueAt,
    orderId: detail.orderId,
  };
}

/** มีผู้ชนะ — ชนะจากการบิด หรือกดซื้อทันที (ซื้อทันทีไม่นับเป็นบิด) */
export function hadWinner(detail: SellerAuctionDetail): boolean {
  return detail.winnerAlias !== null || detail.bidCount > 0;
}

/** ซื้อทันทีได้เฉพาะตอนยังไม่มีบิด — มีผู้ชนะแต่ไม่มีบิด = ขายด้วยซื้อทันที */
export function soldByBuyNow(detail: SellerAuctionDetail): boolean {
  return detail.winnerAlias !== null && detail.bidCount === 0;
}

/** ปุ่ม "ประมูลใหม่" — เติมฟอร์มจากใบเดิม */
export function relistPath(auctionId: number): string {
  return `/seller/auctions/new?from=${auctionId}`;
}

/** "{สภาพ} · ใบ {รหัสใบ} · ปิด {วันเวลา} (ต่อเวลาแล้ว {n} ครั้ง)" ใต้ชื่อการ์ด */
export function headerMeta(detail: SellerAuctionDetail): string {
  const extended = detail.extensionCount > 0 ? ` (ต่อเวลาแล้ว ${detail.extensionCount} ครั้ง)` : "";
  return `${detail.item.condition} · ใบ ${detail.unitLabel} · ปิด ${formatAuctionShortDateTime(detail.endsAt)}${extended}`;
}

/** แถว "ซื้อทันที" ในการ์ดการตั้งค่า */
export function buyNowSetting(detail: SellerAuctionDetail): string {
  if (detail.buyNowPrice === null) return translate("ไม่ได้ตั้ง", "Not set");
  if (!detail.buyNowAvailable && detail.firstBidAt !== null) return `${formatBaht(detail.buyNowPrice)} · ปิดแล้ว (มีบิดแรก)`;
  return formatBaht(detail.buyNowPrice);
}

/** แถวท้ายของประวัติเป็นบิดแรกสุดจริงไหม (ประวัติอาจตัดมาแค่บางส่วน) */
export function isFirstBid(bid: AuctionBid, detail: SellerAuctionDetail): boolean {
  return detail.firstBidAt !== null && bid.placedAt === detail.firstBidAt;
}

// ---------- ขั้นตอน (timeline) ----------

/** done = เขียว (ผ่านแล้ว) · current = primary (ตอนนี้) · pending = เทา · failed = แดง · ended = จบแบบไม่มีการขาย */
export type TimelineTone = "done" | "current" | "pending" | "failed" | "ended";

export type TimelineStep = { id: string; label: string; detail: string | null; tone: TimelineTone };

const CLOSE_STEP = "ปิดประมูล → ผู้ชนะชำระใน 24 ชม.";
const SHIP_STEP = "จัดส่งการ์ด";
const RECEIVE_STEP = "ผู้ซื้อยืนยันรับ → รับเงิน";

/** ขั้นตอนของประมูลตามสถานะ — โครงตาม Figma S4 */
export function timelineSteps(detail: SellerAuctionDetail): TimelineStep[] {
  const time = (iso: string | null) => (iso ? formatAuctionShortDateTime(iso) : null);
  const live = detail.status === "LIVE";

  const steps: TimelineStep[] = [{ id: "open", label: translate("เปิดประมูล", "Start auction"), detail: time(detail.startedAt), tone: "done" }];

  if (detail.firstBidAt !== null) {
    steps.push({
      id: "first-bid",
      label: detail.buyNowPrice !== null ? "บิดแรก — ปุ่มซื้อทันทีหายไป" : "บิดแรก",
      detail: time(detail.firstBidAt),
      tone: "done",
    });
  }

  const extended = detail.extensionCount > 0 ? ` · ต่อเวลา ${detail.extensionCount} ครั้ง` : "";
  // ขายด้วยซื้อทันที = ไม่ได้ประมูลจนหมดเวลา ข้ามขั้น "กำลังประมูล"
  if (!soldByBuyNow(detail)) {
    steps.push({
      id: "live",
      label: `กำลังประมูล${extended}`,
      detail: live ? translate("ตอนนี้", "Now") : null,
      tone: live ? "current" : "done",
    });
  }

  switch (detail.status) {
    case "LIVE":
      return [
        ...steps,
        { id: "close", label: CLOSE_STEP, detail: null, tone: "pending" },
        { id: "ship", label: SHIP_STEP, detail: null, tone: "pending" },
        { id: "receive", label: RECEIVE_STEP, detail: null, tone: "pending" },
      ];
    case "AWAITING_PAYMENT":
      return [
        ...steps,
        {
          id: "close",
          label: soldByBuyNow(detail) ? `ขายด้วยซื้อทันที ${formatBaht(detail.currentPrice)}` : CLOSE_STEP,
          detail: translate("ตอนนี้", "Now"),
          tone: "current",
        },
        { id: "ship", label: SHIP_STEP, detail: null, tone: "pending" },
        { id: "receive", label: RECEIVE_STEP, detail: null, tone: "pending" },
      ];
    case "SOLD":
      return [
        ...steps,
        { id: "close", label: CLOSE_STEP, detail: time(detail.endsAt), tone: "done" },
        { id: "ship", label: SHIP_STEP, detail: translate("ตอนนี้", "Now"), tone: "current" },
        { id: "receive", label: RECEIVE_STEP, detail: null, tone: "pending" },
      ];
    case "UNSOLD":
      return hadWinner(detail)
        ? [
            ...steps,
            { id: "close", label: CLOSE_STEP, detail: time(detail.endsAt), tone: "done" },
            { id: "unpaid", label: "ผู้ชนะไม่ชำระใน 24 ชม. → ยกเลิกคำสั่งซื้อ · การ์ดกลับเข้าสต็อก", detail: null, tone: "failed" },
          ]
        : [...steps, { id: "no-bids", label: translate("ไม่มีผู้บิด — การ์ดกลับเข้าสต็อกแล้ว", "No bids — cards returned to stock"), detail: time(detail.endsAt), tone: "ended" }];
    case "CANCELLED":
      return [...steps, { id: "cancelled", label: translate("ยกเลิกประมูล", "Cancel auction"), detail: null, tone: "ended" }];
    case "SUSPENDED":
      return [...steps, { id: "suspended", label: translate("ถูกระงับ", "Suspended"), detail: null, tone: "failed" }];
  }
}

// ---------- แจ้งเตือน S3-C ----------

export type SellerNoticeKind = "NEW_BID" | "BUY_NOW_SOLD" | "AWAITING_PAYMENT" | "WINNER_UNPAID" | "NO_BIDS";

/**
 * แบนเนอร์บนหัวหน้า S4 — `null` = ไม่มี
 * @param newBid มีบิดเพิ่มระหว่างที่เปิดหน้านี้อยู่ (realtime เป็นเฟสหน้า จึงดูจากรอบ poll)
 */
export function sellerNoticeKind(detail: SellerAuctionDetail, newBid: boolean): SellerNoticeKind | null {
  switch (detail.status) {
    case "LIVE":
      return newBid && detail.bidCount > 0 ? "NEW_BID" : null;
    case "AWAITING_PAYMENT":
      return soldByBuyNow(detail) ? "BUY_NOW_SOLD" : "AWAITING_PAYMENT";
    case "UNSOLD":
      return hadWinner(detail) ? "WINNER_UNPAID" : "NO_BIDS";
    default:
      return null;
  }
}
