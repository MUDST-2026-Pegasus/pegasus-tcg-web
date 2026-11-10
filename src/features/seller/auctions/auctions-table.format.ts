import {
  AUCTION_STATUS_LABEL,
  formatAuctionDayMonth,
  formatBaht,
  type AuctionPillKind,
} from "@/features/auction/auction.format";
import type { AuctionStatus, SellerAuctionPage, SellerAuctionRow } from "@/features/auction/auction.types";
import { translate } from "@/lib/i18n";

/**
 * ค่าในแต่ละคอลัมน์ของตาราง S1 ตามสถานะ (ตารางในการ์ด FE-6) [TCG-632]
 * ไม่มี React — ทดสอบได้ตรง ๆ
 */

export type CellTone = "primary" | "bold" | "amber" | "muted";
export type TextCell = { text: string; tone: CellTone };

export type TimeCell =
  /** ตัวนับถอยหลังไปหา `endsAt` (แดงเมื่อ < 2 นาที) */
  | { kind: "countdown" }
  /** "ชำระใน HH:MM" ไปหา `deadline` */
  | { kind: "payment" }
  /** "จบ 27 ต.ค." */
  | { kind: "ended"; text: string };

export type RowAction = "VIEW" | "CANCEL" | "VIEW_ORDER" | "RELIST";

export type SellerAuctionRowView = {
  currentPrice: TextCell;
  buyNow: TextCell;
  time: TimeCell;
  pill: { kind: AuctionPillKind; label?: string };
  action: RowAction;
};

const DASH: TextCell = { text: "—", tone: "muted" };

export function sellerAuctionRowView(row: SellerAuctionRow): SellerAuctionRowView {
  const ended: TimeCell = { kind: "ended", text: translate("auction", "seller.auctionsTableFormat.text", "จบ {endsAt}", { endsAt: formatAuctionDayMonth(row.endsAt) }) };
  const hasBids = row.bidCount > 0;

  switch (row.status) {
    case "LIVE":
      return hasBids
        ? {
            currentPrice: { text: formatBaht(row.currentPrice), tone: "primary" },
            buyNow: { text: row.buyNowPrice !== null ? translate("auction", "seller.auctionsTableFormat.text2", "ปิดแล้ว (มีบิด)") : translate("auction", "seller.auctionsTableFormat.text3", "ไม่ได้ตั้ง"), tone: "muted" },
            time: { kind: "countdown" },
            pill: { kind: "Live" },
            action: "VIEW",
          }
        : {
            currentPrice: DASH,
            buyNow: row.buyNowPrice !== null ? { text: formatBaht(row.buyNowPrice), tone: "amber" } : { text: translate("auction", "seller.auctionsTableFormat.text3", "ไม่ได้ตั้ง"), tone: "muted" },
            time: { kind: "countdown" },
            pill: { kind: "Live" },
            action: "CANCEL",
          };
    case "AWAITING_PAYMENT":
      return {
        currentPrice: { text: formatBaht(row.currentPrice), tone: "bold" },
        buyNow: DASH,
        time: { kind: "payment" },
        pill: { kind: "AwaitingPayment" },
        action: "VIEW",
      };
    case "SOLD":
      return {
        currentPrice: { text: formatBaht(row.currentPrice), tone: "bold" },
        buyNow: DASH,
        time: ended,
        pill: { kind: "Won", label: translate("auction", "seller.auctionsTableFormat.label", "ขายแล้ว") },
        action: "VIEW_ORDER",
      };
    case "UNSOLD":
      // มีบิด = ผู้ชนะไม่ชำระ · ไม่มีบิด = ไม่มีผู้บิด
      return hasBids
        ? {
            currentPrice: { text: formatBaht(row.currentPrice), tone: "muted" },
            buyNow: DASH,
            time: ended,
            pill: { kind: "Unsold", label: translate("auction", "seller.auctionsTableFormat.label2", "ไม่มีผู้ชำระ") },
            action: "RELIST",
          }
        : {
            currentPrice: DASH,
            buyNow: row.buyNowPrice !== null ? { text: formatBaht(row.buyNowPrice), tone: "muted" } : DASH,
            time: ended,
            pill: { kind: "Unsold" },
            action: "RELIST",
          };
    case "CANCELLED":
      return {
        currentPrice: DASH,
        buyNow: row.buyNowPrice !== null ? { text: formatBaht(row.buyNowPrice), tone: "muted" } : DASH,
        time: ended,
        pill: { kind: "Unsold", label: AUCTION_STATUS_LABEL.CANCELLED },
        action: "VIEW",
      };
    case "SUSPENDED":
      return {
        currentPrice: { text: formatBaht(row.currentPrice), tone: "muted" },
        buyNow: DASH,
        time: ended,
        pill: { kind: "Suspended" },
        action: "VIEW",
      };
  }
}

/** แท็บตามแบบ S1 — `null` = ทั้งหมด */
export const SELLER_AUCTION_TABS: { status: AuctionStatus | null; label: string }[] = [
  { status: null, get label() {
    return translate("auction", "seller.auctionsTableFormat.label3", "ทั้งหมด");
  } },
  { status: "LIVE", label: AUCTION_STATUS_LABEL.LIVE },
  { status: "AWAITING_PAYMENT", label: AUCTION_STATUS_LABEL.AWAITING_PAYMENT },
  { status: "SOLD", label: AUCTION_STATUS_LABEL.SOLD },
  { status: "UNSOLD", label: AUCTION_STATUS_LABEL.UNSOLD },
  { status: "CANCELLED", label: AUCTION_STATUS_LABEL.CANCELLED },
];

/** จำนวนในแท็บ "ทั้งหมด" */
export function totalAuctionCount(counts: SellerAuctionPage["statusCounts"]): number {
  return Object.values(counts).reduce((sum, n) => sum + n, 0);
}

/** "ครบกำหนดใน {n} ชม." — ปัดขึ้น ไม่ต่ำกว่า 0 */
export function hoursUntil(iso: string, offsetMs: number, now: number = Date.now()): number {
  return Math.max(0, Math.ceil((Date.parse(iso) - (now + offsetMs)) / 3_600_000));
}

/** "+12%" / "−4%" — `null` = ข้อมูลไม่พอ */
export function formatPercentChange(percent: number | null): string {
  if (percent === null) return "—";
  if (percent > 0) return `+${percent}%`;
  if (percent < 0) return `−${Math.abs(percent)}%`;
  return "0%";
}

/** "18:22" สำหรับ "ชำระใน HH:MM" */
export function formatHoursMinutes(ms: number): string {
  const safe = Math.max(0, ms);
  const hours = Math.floor(safe / 3_600_000);
  const minutes = Math.floor((safe % 3_600_000) / 60_000);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

// @tolgee-key {"key": "seller.auctionsTableFormat.text", "ns": "auction", "defaultValue": "จบ {endsAt}"}
// @tolgee-key {"key": "seller.auctionsTableFormat.text2", "ns": "auction", "defaultValue": "ปิดแล้ว (มีบิด)"}
// @tolgee-key {"key": "seller.auctionsTableFormat.text3", "ns": "auction", "defaultValue": "ไม่ได้ตั้ง"}
// @tolgee-key {"key": "seller.auctionsTableFormat.label", "ns": "auction", "defaultValue": "ขายแล้ว"}
// @tolgee-key {"key": "seller.auctionsTableFormat.label2", "ns": "auction", "defaultValue": "ไม่มีผู้ชำระ"}
// @tolgee-key {"key": "seller.auctionsTableFormat.label3", "ns": "auction", "defaultValue": "ทั้งหมด"}
