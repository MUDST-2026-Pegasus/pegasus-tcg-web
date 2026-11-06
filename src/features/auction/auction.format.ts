import type { CardCondition } from "@/features/catalog/catalog.types";
import { formatBaht } from "@/features/seller/shared/seller.format";

import type { AdminAuctionRow, AdminAuctionTab, AuctionStatus, AuctionViewerState, BannedBidder, BanTab, MyAuctionTab } from "./auction.types";

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

const shortDateTimeFormatter = new Intl.DateTimeFormat("th-TH", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Bangkok",
});

/** "31 ต.ค. 21:06" — ไม่มีวันในสัปดาห์ (หัวแถวในหน้าการประมูลของฉัน) */
export function formatAuctionShortDateTime(iso: string): string {
  return shortDateTimeFormatter.format(new Date(iso)).replace(" เวลา", "");
}

const dayMonthFormatter = new Intl.DateTimeFormat("th-TH", {
  day: "numeric",
  month: "short",
  timeZone: "Asia/Bangkok",
});

/** "27 ต.ค." — วันที่จบในตารางผู้ขาย */
export function formatAuctionDayMonth(iso: string): string {
  return dayMonthFormatter.format(new Date(iso));
}

const dateFormatter = new Intl.DateTimeFormat("th-TH-u-ca-gregory", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Bangkok",
});

/** "29 พ.ย. 2026" — ปี ค.ศ. ตาม Figma (วันที่หมดโทษห้ามบิด) */
export function formatAuctionDate(iso: string): string {
  return dateFormatter.format(new Date(iso));
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
  | "Suspended";

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
  Suspended: "ถูกระงับ",
};

/** ป้ายของประมูลตามสถานะ (มุมผู้ขาย / แอดมิน / คนทั่วไป) — LIVE ที่เหลือ < 2 นาทีเป็น "ใกล้จบ" */
export function pillForStatus(status: AuctionStatus, remaining?: number): AuctionPillKind {
  switch (status) {
    case "LIVE":
      return remaining !== undefined && remaining < URGENT_THRESHOLD_MS ? "EndingSoon" : "Live";
    case "AWAITING_PAYMENT":
      return "AwaitingPayment";
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
  SOLD: "ขายแล้ว",
  UNSOLD: "ไม่มีผู้บิด",
  CANCELLED: "ยกเลิก",
  SUSPENDED: "ถูกระงับ",
};

// ---------- กล่องบิด (B2) ----------

/** ปุ่มลัดบวกเพิ่มจากค่าในช่อง */
export const BID_SHORTCUTS = [100, 500, 1_000] as const;

/** บิดได้เมื่อประมูลยังเปิด และราคาไม่ต่ำกว่าขั้นต่ำ */
export function canSubmitBid(amount: number, minNextBid: number, live: boolean): boolean {
  return live && Number.isFinite(amount) && amount >= minNextBid;
}

// ---------- การประมูลของฉัน (W1) ----------

export const MY_AUCTION_TABS: { key: MyAuctionTab; label: string }[] = [
  { key: "ALL", label: "ทั้งหมด" },
  { key: "BIDDING", label: "กำลังบิด" },
  { key: "TO_PAY", label: "ต้องชำระ" },
  { key: "WON", label: "ชนะแล้ว" },
  { key: "LOST", label: "ไม่ชนะ" },
];

/** แถวนี้อยู่ในแท็บไหน — ใช้ทั้ง mock และหน้า */
export function matchesMyAuctionTab(tab: MyAuctionTab, state: AuctionViewerState): boolean {
  switch (tab) {
    case "ALL":
      return true;
    case "BIDDING":
      return state === "LEADING" || state === "OUTBID";
    case "TO_PAY":
      return state === "WON_AWAITING_PAYMENT";
    case "WON":
      return state === "WON";
    case "LOST":
      return state === "LOST";
  }
}

/** ประมูลยังเปิดอยู่ไหม (หัวแถวเขียน "ปิด" แทน "ปิดเมื่อ") */
export function isBiddingState(state: AuctionViewerState): boolean {
  return state === "LEADING" || state === "OUTBID";
}

/** ป้ายของแถว — ชนะแล้วแต่ยังไม่ชำระก็ใช้ "ชนะประมูล" ตาม W1 */
export function myAuctionPill(state: AuctionViewerState): AuctionPillKind {
  return state === "WON_AWAITING_PAYMENT" ? "Won" : pillForViewer(state);
}

export type MyAuctionAction = "VIEW_AUCTION" | "PAY" | "BID" | "VIEW_ORDER";

/** ปุ่มท้ายแถวตามสถานะ เรียงซ้ายไปขวา (ตัวสุดท้ายเป็นปุ่มหลัก) */
export function myAuctionActions(state: AuctionViewerState): MyAuctionAction[] {
  switch (state) {
    case "WON_AWAITING_PAYMENT":
      return ["VIEW_AUCTION", "PAY"];
    case "LEADING":
      return ["VIEW_AUCTION"];
    case "OUTBID":
      return ["VIEW_AUCTION", "BID"];
    case "WON":
      return ["VIEW_ORDER"];
    case "LOST":
      return [];
  }
}

export type StrikeTone = "clear" | "warning" | "banned";

/** สีชิป "ไม่ชำระหลังชนะ n / 3 ครั้ง" — เขียวถ้า 0, amber ถ้ายังไม่ครบ */
export function strikeTone(strikes: number, limit: number): StrikeTone {
  if (strikes <= 0) return "clear";
  return strikes >= limit ? "banned" : "warning";
}

/** ยังติดโทษห้ามบิดอยู่ไหม */
export function isBiddingBanned(bannedUntil: string | null, now: number = Date.now()): boolean {
  return bannedUntil !== null && Date.parse(bannedUntil) > now;
}

/** "จากการประมูล #AUC-2026-0142" — ป้ายในหน้า checkout / ชำระเงิน */
export function auctionOrderLabel(auctionNumber: string): string {
  return `จากการประมูล #${auctionNumber.replace(/^#/, "")}`;
}

/** เลขประมูลจาก query `?auction=` — ค่าแปลก ๆ ไม่แสดงป้าย */
export function parseAuctionNumber(raw: string | null): string | null {
  return raw && /^AUC-\d{4}-\d{1,8}$/.test(raw) ? raw : null;
}

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

// ---------- แอดมิน [TCG-635] ----------

/** แถว A1 อยู่ในแท็บไหน — ใช้ทั้ง mock และหน้า */
export function matchesAdminAuctionTab(tab: AdminAuctionTab, row: AdminAuctionRow): boolean {
  switch (tab) {
    case "ALL":
      return true;
    case "FLAGGED":
      return row.signals.length > 0;
    case "LIVE":
    case "AWAITING_PAYMENT":
    case "SUSPENDED":
      return row.status === tab;
    case "ENDED":
      return row.status === "SOLD" || row.status === "UNSOLD" || row.status === "CANCELLED";
  }
}

/**
 * ผู้ใช้ A4 อยู่แท็บไหน — ห้ามบิดอยู่ / ใกล้ถูกห้าม (ขาดอีกครั้งเดียว) / ประวัติ (ยกเลิกโทษหรือพ้นโทษแล้ว)
 * `null` = ไม่อยู่ในหน้านี้ (ไม่ชำระครั้งเดียว)
 */
export function banTabOf(bidder: BannedBidder, now: number = Date.now()): BanTab | null {
  if (bidder.liftedAt !== null) return "HISTORY";
  if (isBiddingBanned(bidder.bannedUntil, now)) return "BANNED";
  if (bidder.bannedUntil !== null) return "HISTORY";
  return bidder.strikeCount >= bidder.strikeLimit - 1 ? "AT_RISK" : null;
}
