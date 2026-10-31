import type { CardCondition } from "@/features/catalog/catalog.types";
import { formatBaht } from "@/features/seller/shared/seller.format";

import type { AuctionStatus, AuctionViewerState } from "./auction.types";

/**
 * ตัวช่วยแปลงค่าดิบของระบบประมูล → ข้อความบนหน้าจอ [TCG-627 · FE-1]
 * ไม่มี React — ทดสอบได้ตรง ๆ ทุกหน้าในระบบประมูลใช้ตัวช่วยชุดนี้ ไม่ต้องเขียนเอง
 */

export { formatBaht };

// ---------- เวลา ----------

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** เหลือน้อยกว่านี้ ตัวนับเป็นสีแดง (ตรงกับกติกาต่อเวลา 2 นาที) */
export const URGENT_THRESHOLD_MS = 2 * MINUTE;

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * เวลาที่เหลือ เป็นข้อความบนตัวนับ
 * - มากกว่า 1 วัน → "1 วัน 04:12:36"
 * - 1 ชม.–1 วัน → "04:12:36"
 * - น้อยกว่า 1 ชม. → "01:42"
 * - หมดแล้ว → "00:00"
 */
export function formatRemaining(ms: number): string {
  const safe = Math.max(0, Math.floor(ms / SECOND) * SECOND);
  const days = Math.floor(safe / DAY);
  const hours = Math.floor((safe % DAY) / HOUR);
  const minutes = Math.floor((safe % HOUR) / MINUTE);
  const seconds = Math.floor((safe % MINUTE) / SECOND);
  if (days > 0) return `${days} วัน ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  if (hours > 0) return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  return `${pad(minutes)}:${pad(seconds)}`;
}

/**
 * ส่วนต่างนาฬิกาเครื่องกับ server (ms) — บวกกับ `Date.now()` แล้วได้เวลาฝั่ง server
 * @param serverTime ค่า `serverTime` จาก response ล่าสุด
 */
export function clockOffset(serverTime: string | undefined, now: number = Date.now()): number {
  if (!serverTime) return 0;
  const server = Date.parse(serverTime);
  return Number.isNaN(server) ? 0 : server - now;
}

/** ms ที่เหลือจนถึง `target` ตามนาฬิกา server */
export function remainingMs(target: string, offsetMs: number, now: number = Date.now()): number {
  return Date.parse(target) - (now + offsetMs);
}

const dateTimeFormatter = new Intl.DateTimeFormat("th-TH", {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Bangkok",
});

/** "จ. 2 พ.ย. 21:00" — เวลาประเทศไทยเสมอ */
export function formatAuctionDateTime(iso: string): string {
  return dateTimeFormatter.format(new Date(iso)).replace(" เวลา", "");
}

/** "2 นาทีที่แล้ว", "1 ชม.ที่แล้ว", "เมื่อวาน 22:14" สำหรับประวัติบิด */
export function formatBidTime(iso: string, now: number = Date.now()): string {
  const diff = now - Date.parse(iso);
  if (diff < MINUTE) return "เมื่อสักครู่";
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)} นาทีที่แล้ว`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)} ชม.ที่แล้ว`;
  return formatAuctionDateTime(iso);
}

// ---------- ป้ายสถานะ ----------

/** ป้ายทั้ง 12 แบบใน Figma (Components › AUC / Status Pill) */
export type AuctionPillKind =
  | "Live"
  | "EndingSoon"
  | "Leading"
  | "Outbid"
  | "Won"
  | "AwaitingPayment"
  | "Lost"
  | "Ended"
  | "Unsold"
  | "SecondChance"
  | "Suspended"
  | "NeedsDecision";

export const AUCTION_PILL_LABEL: Record<AuctionPillKind, string> = {
  Live: "กำลังประมูล",
  EndingSoon: "ใกล้จบ",
  Leading: "คุณนำอยู่",
  Outbid: "ถูกบิดแซง",
  Won: "ชนะประมูล",
  AwaitingPayment: "รอชำระเงิน",
  Lost: "ไม่ชนะ",
  Ended: "จบแล้ว",
  Unsold: "ไม่มีผู้บิด",
  SecondChance: "ข้อเสนออันดับ 2",
  Suspended: "ถูกระงับ",
  NeedsDecision: "รอผู้ขายเลือก",
};

/** ป้ายของประมูลตามสถานะ (มุมผู้ขาย / แอดมิน / คนทั่วไป) — LIVE ที่เหลือ < 2 นาทีเป็น "ใกล้จบ" */
export function pillForStatus(status: AuctionStatus, remaining?: number): AuctionPillKind {
  switch (status) {
    case "LIVE":
      return remaining !== undefined && remaining < URGENT_THRESHOLD_MS ? "EndingSoon" : "Live";
    case "AWAITING_PAYMENT":
      return "AwaitingPayment";
    case "AWAITING_SELLER_DECISION":
      return "NeedsDecision";
    case "OFFERED_TO_SECOND":
      return "SecondChance";
    case "SOLD":
      return "Ended";
    case "UNSOLD":
    case "CANCELLED":
      return "Unsold";
    case "SUSPENDED":
      return "Suspended";
  }
}

/** ป้ายสำหรับผู้ซื้อที่เคยบิด (หน้าการประมูลของฉัน / กล่องบิด) */
export function pillForViewer(state: AuctionViewerState): AuctionPillKind {
  switch (state) {
    case "LEADING":
      return "Leading";
    case "OUTBID":
      return "Outbid";
    case "WON_AWAITING_PAYMENT":
      return "AwaitingPayment";
    case "SECOND_CHANCE":
      return "SecondChance";
    case "WON":
      return "Won";
    case "LOST":
      return "Lost";
  }
}

/** ข้อความแท็บ/ตัวกรองตามสถานะ (หน้าผู้ขาย S1) */
export const AUCTION_STATUS_LABEL: Record<AuctionStatus, string> = {
  LIVE: "กำลังประมูล",
  AWAITING_PAYMENT: "รอชำระ",
  AWAITING_SELLER_DECISION: "รอเลือกทางต่อ",
  OFFERED_TO_SECOND: "เสนออันดับ 2",
  SOLD: "ขายแล้ว",
  UNSOLD: "ไม่มีผู้บิด",
  CANCELLED: "ยกเลิก",
  SUSPENDED: "ถูกระงับ",
};

// ---------- อื่น ๆ ----------

/** "NM · CardVault BKK" */
export function conditionAndShop(condition: CardCondition, shopName: string): string {
  return `${condition} · ${shopName}`;
}

/** ป้ายราคาบนการ์ด: ยังไม่มีบิดใช้ "ราคาเริ่มต้น" */
export function priceLabel(bidCount: number): string {
  return bidCount === 0 ? "ราคาเริ่มต้น" : "ราคาปัจจุบัน";
}

/** "12 บิด" */
export function formatBidCount(count: number): string {
  return `${count.toLocaleString("th-TH")} บิด`;
}
