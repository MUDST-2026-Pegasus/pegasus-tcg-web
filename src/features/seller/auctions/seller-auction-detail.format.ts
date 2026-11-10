import { formatAuctionShortDateTime, formatBaht } from "@/features/auction/auction.format";
import type { AuctionBid, SellerAuctionDetail, SellerAuctionRow } from "@/features/auction/auction.types";
import { translate } from "@/lib/i18n";

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
  const extended = detail.extensionCount > 0 ? translate("auction", "seller.sellerAuctionDetailFormat.text", " (ต่อเวลาแล้ว {extensionCount} ครั้ง)", { extensionCount: detail.extensionCount }) : "";
  return translate("auction", "seller.sellerAuctionDetailFormat.text2", "{condition} · ใบ {unitLabel} · ปิด {endsAt}{extended}", { condition: detail.item.condition, unitLabel: detail.unitLabel, endsAt: formatAuctionShortDateTime(detail.endsAt), extended });
}

/** แถว "ซื้อทันที" ในการ์ดการตั้งค่า */
export function buyNowSetting(detail: SellerAuctionDetail): string {
  if (detail.buyNowPrice === null) return translate("auction", "seller.sellerAuctionDetailFormat.text3", "ไม่ได้ตั้ง");
  if (!detail.buyNowAvailable && detail.firstBidAt !== null) return translate("auction", "seller.sellerAuctionDetailFormat.text4", "{buyNowPrice} · ปิดแล้ว (มีบิดแรก)", { buyNowPrice: formatBaht(detail.buyNowPrice) });
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

const CLOSE_STEP = () => translate("auction", "seller.sellerAuctionDetailFormat.text5", "ปิดประมูล → ผู้ชนะชำระใน 24 ชม.");
const SHIP_STEP = () => translate("auction", "seller.sellerAuctionDetailFormat.text6", "จัดส่งการ์ด");
const RECEIVE_STEP = () => translate("auction", "seller.sellerAuctionDetailFormat.text7", "ผู้ซื้อยืนยันรับ → รับเงิน");

/** ขั้นตอนของประมูลตามสถานะ — โครงตาม Figma S4 */
export function timelineSteps(detail: SellerAuctionDetail): TimelineStep[] {
  const time = (iso: string | null) => (iso ? formatAuctionShortDateTime(iso) : null);
  const live = detail.status === "LIVE";

  const steps: TimelineStep[] = [{ id: "open", label: translate("auction", "seller.sellerAuctionDetailFormat.label", "เปิดประมูล"), detail: time(detail.startedAt), tone: "done" }];

  if (detail.firstBidAt !== null) {
    steps.push({
      id: "first-bid",
      label: detail.buyNowPrice !== null ? translate("auction", "seller.sellerAuctionDetailFormat.text8", "บิดแรก — ปุ่มซื้อทันทีหายไป") : translate("auction", "seller.sellerAuctionDetailFormat.text9", "บิดแรก"),
      detail: time(detail.firstBidAt),
      tone: "done",
    });
  }

  const extended = detail.extensionCount > 0 ? translate("auction", "seller.sellerAuctionDetailFormat.text10", " · ต่อเวลา {extensionCount} ครั้ง", { extensionCount: detail.extensionCount }) : "";
  // ขายด้วยซื้อทันที = ไม่ได้ประมูลจนหมดเวลา ข้ามขั้น "กำลังประมูล"
  if (!soldByBuyNow(detail)) {
    steps.push({
      id: "live",
      label: translate("auction", "seller.sellerAuctionDetailFormat.label2", "กำลังประมูล{extended}", { extended }),
      detail: live ? translate("auction", "seller.sellerAuctionDetailFormat.text11", "ตอนนี้") : null,
      tone: live ? "current" : "done",
    });
  }

  switch (detail.status) {
    case "LIVE":
      return [
        ...steps,
        { id: "close", label: CLOSE_STEP(), detail: null, tone: "pending" },
        { id: "ship", label: SHIP_STEP(), detail: null, tone: "pending" },
        { id: "receive", label: RECEIVE_STEP(), detail: null, tone: "pending" },
      ];
    case "AWAITING_PAYMENT":
      return [
        ...steps,
        {
          id: "close",
          label: soldByBuyNow(detail) ? translate("auction", "seller.sellerAuctionDetailFormat.text12", "ขายด้วยซื้อทันที {currentPrice}", { currentPrice: formatBaht(detail.currentPrice) }) : CLOSE_STEP(),
          detail: translate("auction", "seller.sellerAuctionDetailFormat.text11", "ตอนนี้"),
          tone: "current",
        },
        { id: "ship", label: SHIP_STEP(), detail: null, tone: "pending" },
        { id: "receive", label: RECEIVE_STEP(), detail: null, tone: "pending" },
      ];
    case "SOLD":
      return [
        ...steps,
        { id: "close", label: CLOSE_STEP(), detail: time(detail.endsAt), tone: "done" },
        { id: "ship", label: SHIP_STEP(), detail: translate("auction", "seller.sellerAuctionDetailFormat.text11", "ตอนนี้"), tone: "current" },
        { id: "receive", label: RECEIVE_STEP(), detail: null, tone: "pending" },
      ];
    case "UNSOLD":
      return hadWinner(detail)
        ? [
            ...steps,
            { id: "close", label: CLOSE_STEP(), detail: time(detail.endsAt), tone: "done" },
            { id: "unpaid", label: translate("auction", "seller.sellerAuctionDetailFormat.label3", "ผู้ชนะไม่ชำระใน 24 ชม. → ยกเลิกคำสั่งซื้อ · การ์ดกลับเข้าสต็อก"), detail: null, tone: "failed" },
          ]
        : [...steps, { id: "no-bids", label: translate("auction", "seller.sellerAuctionDetailFormat.label4", "ไม่มีผู้บิด — การ์ดกลับเข้าสต็อกแล้ว"), detail: time(detail.endsAt), tone: "ended" }];
    case "CANCELLED":
      return [...steps, { id: "cancelled", label: translate("auction", "seller.sellerAuctionDetailFormat.label5", "ยกเลิกประมูล"), detail: null, tone: "ended" }];
    case "SUSPENDED":
      return [...steps, { id: "suspended", label: translate("auction", "seller.sellerAuctionDetailFormat.label6", "ถูกระงับ"), detail: null, tone: "failed" }];
  }
}

// ---------- แจ้งเตือน S3-C ----------

export type SellerNoticeKind = "NEW_BID" | "BUY_NOW_SOLD" | "AWAITING_PAYMENT" | "WINNER_UNPAID" | "NO_BIDS" | "CANCELLED";

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
    // ผู้ขายยกเลิกเอง การ์ดก็กลับเข้ามือเหมือนกัน — บอกให้ชัดพร้อมทางไปต่อ [TCG-639]
    case "CANCELLED":
      return "CANCELLED";
    default:
      return null;
  }
}

// @tolgee-key {"key": "seller.sellerAuctionDetailFormat.text", "ns": "auction", "defaultValue": " (ต่อเวลาแล้ว {extensionCount} ครั้ง)"}
// @tolgee-key {"key": "seller.sellerAuctionDetailFormat.text2", "ns": "auction", "defaultValue": "{condition} · ใบ {unitLabel} · ปิด {endsAt}{extended}"}
// @tolgee-key {"key": "seller.sellerAuctionDetailFormat.text3", "ns": "auction", "defaultValue": "ไม่ได้ตั้ง"}
// @tolgee-key {"key": "seller.sellerAuctionDetailFormat.text4", "ns": "auction", "defaultValue": "{buyNowPrice} · ปิดแล้ว (มีบิดแรก)"}
// @tolgee-key {"key": "seller.sellerAuctionDetailFormat.text5", "ns": "auction", "defaultValue": "ปิดประมูล → ผู้ชนะชำระใน 24 ชม."}
// @tolgee-key {"key": "seller.sellerAuctionDetailFormat.text6", "ns": "auction", "defaultValue": "จัดส่งการ์ด"}
// @tolgee-key {"key": "seller.sellerAuctionDetailFormat.text7", "ns": "auction", "defaultValue": "ผู้ซื้อยืนยันรับ → รับเงิน"}
// @tolgee-key {"key": "seller.sellerAuctionDetailFormat.label", "ns": "auction", "defaultValue": "เปิดประมูล"}
// @tolgee-key {"key": "seller.sellerAuctionDetailFormat.text8", "ns": "auction", "defaultValue": "บิดแรก — ปุ่มซื้อทันทีหายไป"}
// @tolgee-key {"key": "seller.sellerAuctionDetailFormat.text9", "ns": "auction", "defaultValue": "บิดแรก"}
// @tolgee-key {"key": "seller.sellerAuctionDetailFormat.text10", "ns": "auction", "defaultValue": " · ต่อเวลา {extensionCount} ครั้ง"}
// @tolgee-key {"key": "seller.sellerAuctionDetailFormat.label2", "ns": "auction", "defaultValue": "กำลังประมูล{extended}"}
// @tolgee-key {"key": "seller.sellerAuctionDetailFormat.text11", "ns": "auction", "defaultValue": "ตอนนี้"}
// @tolgee-key {"key": "seller.sellerAuctionDetailFormat.text12", "ns": "auction", "defaultValue": "ขายด้วยซื้อทันที {currentPrice}"}
// @tolgee-key {"key": "seller.sellerAuctionDetailFormat.label3", "ns": "auction", "defaultValue": "ผู้ชนะไม่ชำระใน 24 ชม. → ยกเลิกคำสั่งซื้อ · การ์ดกลับเข้าสต็อก"}
// @tolgee-key {"key": "seller.sellerAuctionDetailFormat.label4", "ns": "auction", "defaultValue": "ไม่มีผู้บิด — การ์ดกลับเข้าสต็อกแล้ว"}
// @tolgee-key {"key": "seller.sellerAuctionDetailFormat.label5", "ns": "auction", "defaultValue": "ยกเลิกประมูล"}
// @tolgee-key {"key": "seller.sellerAuctionDetailFormat.label6", "ns": "auction", "defaultValue": "ถูกระงับ"}
