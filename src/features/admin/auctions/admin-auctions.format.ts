import type {
  AdminAuctionDetail,
  AdminAuctionRow,
  AdminAuctionTab,
  AuctionSignal,
  AuctionStatus,
  BanTab,
  BannedBidder,
} from "@/features/auction/auction.types";

/**
 * ตรรกะหน้าแอดมินของระบบประมูล A1–A4 [TCG-635 · FE-9]
 * ไม่มี React — test ได้ตรง ๆ
 */

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const BANGKOK_OFFSET_MS = 7 * HOUR;

export const ADMIN_AUCTION_TABS: { key: AdminAuctionTab; label: string }[] = [
  { key: "ALL", label: "ทั้งหมด" },
  { key: "LIVE", label: "กำลังประมูล" },
  { key: "FLAGGED", label: "ถูกรายงาน" },
  { key: "AWAITING_PAYMENT", label: "รอชำระ" },
  { key: "ENDED", label: "จบแล้ว" },
  { key: "SUSPENDED", label: "ถูกระงับ" },
];

export const BAN_TABS: { key: BanTab; label: string }[] = [
  { key: "BANNED", label: "ห้ามบิดอยู่" },
  { key: "AT_RISK", label: "ใกล้ถูกห้าม" },
  { key: "HISTORY", label: "ประวัติ" },
];

/** ค่าที่ไม่รู้จักใน URL ถือว่าไม่ได้เลือก */
export function readAdminAuctionTab(value: string | null): AdminAuctionTab {
  return ADMIN_AUCTION_TABS.find((tab) => tab.key === value)?.key ?? "ALL";
}

export function readBanTab(value: string | null): BanTab {
  return BAN_TABS.find((tab) => tab.key === value)?.key ?? "BANNED";
}

/** ระงับได้เฉพาะประมูลที่ยังเปิด */
export function canSuspend(status: AuctionStatus): boolean {
  return status === "LIVE";
}

/** ชิปในตาราง Log การบิด (A3) */
export const BID_SIGNAL_LABEL: Record<AuctionSignal, string> = {
  NEW_ACCOUNT_RAPID_BIDS: "บัญชีใหม่บิดถี่",
  SHARED_ADDRESS_WITH_SELLER: "ที่อยู่ตรงผู้ขาย",
  REPORTED: "ถูกรายงาน",
};

/** ชิปข้างชื่อการ์ด (A1, หัว A3) — สัญญาณเรื่องการบิดรวมเป็น "บิดผิดปกติ" */
export function auctionFlags(signals: AuctionSignal[], reportCount: number): string[] {
  const flags: string[] = [];
  if (signals.some((signal) => signal !== "REPORTED")) flags.push("บิดผิดปกติ");
  if (signals.includes("REPORTED") || reportCount > 0) flags.push(`ถูกรายงาน ${reportCount}`);
  return flags;
}

export function detailFlags(detail: AdminAuctionDetail): string[] {
  return auctionFlags(
    detail.signals.map((item) => item.signal),
    detail.reportCount,
  );
}

/** "2 วัน", "2 สัปดาห์", "8 เดือน", "1 ปี" */
export function memberAge(since: string, now: number = Date.now()): string {
  const days = Math.max(0, Math.floor((now - Date.parse(since)) / DAY));
  if (days < 14) return `${Math.max(days, 1)} วัน`;
  if (days < 30) return `${Math.floor(days / 7)} สัปดาห์`;
  if (days < 365) return `${Math.floor(days / 30)} เดือน`;
  return `${Math.floor(days / 365)} ปี`;
}

/** สมาชิกไม่ถึง 30 วันนับเป็นบัญชีใหม่ → "สมัคร" */
export function bidderMeta(memberSince: string, orderCount: number, now: number = Date.now()): string {
  const isNew = now - Date.parse(memberSince) < 30 * DAY;
  return `${isNew ? "สมัคร" : "สมาชิก"} ${memberAge(memberSince, now)} · ${orderCount} คำสั่งซื้อ`;
}

const THAI_MONTHS_SHORT = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
const pad = (value: number) => String(value).padStart(2, "0");

/**
 * "31 ต.ค. 20:59:41" เวลาไทย ถึงวินาที (Log การบิด)
 * เขียนเองไม่ใช้ Intl — ICU ต่างเวอร์ชัน Node ให้ผลไม่เหมือนกัน
 */
export function formatBidSecond(iso: string): string {
  const shifted = new Date(Date.parse(iso) + BANGKOK_OFFSET_MS);
  return `${shifted.getUTCDate()} ${THAI_MONTHS_SHORT[shifted.getUTCMonth()]} ${pad(shifted.getUTCHours())}:${pad(shifted.getUTCMinutes())}:${pad(shifted.getUTCSeconds())}`;
}

/** "29 ต.ค." เวลาไทย */
export function formatDayMonth(iso: string): string {
  const shifted = new Date(Date.parse(iso) + BANGKOK_OFFSET_MS);
  return `${shifted.getUTCDate()} ${THAI_MONTHS_SHORT[shifted.getUTCMonth()]}`;
}

/** "29 พ.ย. 2026" เวลาไทย ปี ค.ศ. */
export function formatDayMonthYear(iso: string): string {
  const shifted = new Date(Date.parse(iso) + BANGKOK_OFFSET_MS);
  return `${formatDayMonth(iso)} ${shifted.getUTCFullYear()}`;
}

/** คอลัมน์ "เวลา" ของ A1 */
export type AdminTimeCell =
  | { kind: "countdown" }
  | { kind: "payment" }
  | { kind: "text"; text: string };

export function adminTimeCell(row: AdminAuctionRow): AdminTimeCell {
  switch (row.status) {
    case "LIVE":
      return { kind: "countdown" };
    case "AWAITING_PAYMENT":
      return row.deadline ? { kind: "payment" } : { kind: "text", text: `จบ ${formatDayMonth(row.endsAt)}` };
    case "SUSPENDED":
      return { kind: "text", text: `ระงับ ${formatDayMonth(row.suspendedAt ?? row.endsAt)}` };
    default:
      return { kind: "text", text: `จบ ${formatDayMonth(row.endsAt)}` };
  }
}

/** ครั้งที่ไม่ชำระล่าสุด "#AUC-2026-0121 · 29 ต.ค." */
export function latestStrike(bidder: BannedBidder): string {
  const latest = bidder.strikes[0];
  return latest ? `#${latest.auctionNumber} · ${formatDayMonth(latest.at)}` : "—";
}

/** ยกเลิกโทษได้เฉพาะคนที่ยังห้ามบิดอยู่ */
export function canLiftBan(bidder: BannedBidder, now: number = Date.now()): boolean {
  return bidder.liftedAt === null && bidder.bannedUntil !== null && Date.parse(bidder.bannedUntil) > now;
}
