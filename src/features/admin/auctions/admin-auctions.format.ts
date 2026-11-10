import type {
  AdminAuctionDetail,
  AdminAuctionRow,
  AdminAuctionTab,
  AuctionSignal,
  AuctionStatus,
  BanTab,
  BannedBidder,
} from "@/features/auction/auction.types";
import { translate } from "@/lib/i18n";

/**
 * ตรรกะหน้าแอดมินของระบบประมูล A1–A4 [TCG-635 · FE-9]
 * ไม่มี React — test ได้ตรง ๆ
 */

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const BANGKOK_OFFSET_MS = 7 * HOUR;

export const ADMIN_AUCTION_TABS: { key: AdminAuctionTab; label: string }[] = [
  { key: "ALL", get label() {
    return translate("auction", "admin.adminAuctionsFormat.label", "ทั้งหมด");
  } },
  { key: "LIVE", get label() {
    return translate("auction", "admin.adminAuctionsFormat.label2", "กำลังประมูล");
  } },
  { key: "FLAGGED", get label() {
    return translate("auction", "admin.adminAuctionsFormat.label3", "ถูกรายงาน");
  } },
  { key: "AWAITING_PAYMENT", get label() {
    return translate("auction", "admin.adminAuctionsFormat.label4", "รอชำระ");
  } },
  { key: "ENDED", get label() {
    return translate("auction", "admin.adminAuctionsFormat.label5", "จบแล้ว");
  } },
  { key: "SUSPENDED", get label() {
    return translate("auction", "admin.adminAuctionsFormat.label6", "ถูกระงับ");
  } },
];

export const BAN_TABS: { key: BanTab; label: string }[] = [
  { key: "BANNED", get label() {
    return translate("auction", "admin.adminAuctionsFormat.label7", "ห้ามบิดอยู่");
  } },
  { key: "AT_RISK", get label() {
    return translate("auction", "admin.adminAuctionsFormat.label8", "ใกล้ถูกห้าม");
  } },
  { key: "HISTORY", get label() {
    return translate("auction", "admin.adminAuctionsFormat.label9", "ประวัติ");
  } },
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
  get NEW_ACCOUNT_RAPID_BIDS() {
    return translate("auction", "admin.adminAuctionsFormat.nEWACCOUNTRAPIDBIDS", "บัญชีใหม่บิดถี่");
  },
  get SHARED_ADDRESS_WITH_SELLER() {
    return translate("auction", "admin.adminAuctionsFormat.sHAREDADDRESSWITHSELLER", "ที่อยู่ตรงผู้ขาย");
  },
  get REPORTED() {
    return translate("auction", "admin.adminAuctionsFormat.label3", "ถูกรายงาน");
  },
};

/** ชิปข้างชื่อการ์ด (A1, หัว A3) — สัญญาณเรื่องการบิดรวมเป็น "บิดผิดปกติ" */
export function auctionFlags(signals: AuctionSignal[], reportCount: number): string[] {
  const flags: string[] = [];
  if (signals.some((signal) => signal !== "REPORTED")) flags.push(translate("auction", "admin.adminAuctionsFormat.text", "บิดผิดปกติ"));
  if (signals.includes("REPORTED") || reportCount > 0) flags.push(translate("auction", "admin.adminAuctionsFormat.text2", "ถูกรายงาน {reportCount}", { reportCount }));
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
  if (days < 14) return translate("auction", "admin.adminAuctionsFormat.text3", "{days} วัน", { days: Math.max(days, 1) });
  if (days < 30) return translate("auction", "admin.adminAuctionsFormat.text4", "{n} สัปดาห์", { n: Math.floor(days / 7) });
  if (days < 365) return translate("auction", "admin.adminAuctionsFormat.text5", "{n} เดือน", { n: Math.floor(days / 30) });
  return translate("auction", "admin.adminAuctionsFormat.text6", "{n} ปี", { n: Math.floor(days / 365) });
}

/** สมาชิกไม่ถึง 30 วันนับเป็นบัญชีใหม่ → "สมัคร" */
export function bidderMeta(memberSince: string, orderCount: number, now: number = Date.now()): string {
  const isNew = now - Date.parse(memberSince) < 30 * DAY;
  return translate("auction", "admin.adminAuctionsFormat.text7", "{value} {memberSince} · {orderCount} คำสั่งซื้อ", { value: isNew ? translate("auction", "admin.adminAuctionsFormat.joined", "สมัคร") : translate("auction", "admin.adminAuctionsFormat.member", "สมาชิก"), memberSince: memberAge(memberSince, now), orderCount });
}

const thaiMonthsShort = () => [translate("auction", "admin.adminAuctionsFormat.text8", "ม.ค."), translate("auction", "admin.adminAuctionsFormat.text9", "ก.พ."), translate("auction", "admin.adminAuctionsFormat.text10", "มี.ค."), translate("auction", "admin.adminAuctionsFormat.text11", "เม.ย."), translate("auction", "admin.adminAuctionsFormat.text12", "พ.ค."), translate("auction", "admin.adminAuctionsFormat.text13", "มิ.ย."), translate("auction", "admin.adminAuctionsFormat.text14", "ก.ค."), translate("auction", "admin.adminAuctionsFormat.text15", "ส.ค."), translate("auction", "admin.adminAuctionsFormat.text16", "ก.ย."), translate("auction", "admin.adminAuctionsFormat.text17", "ต.ค."), translate("auction", "admin.adminAuctionsFormat.text18", "พ.ย."), translate("auction", "admin.adminAuctionsFormat.text19", "ธ.ค.")];
const pad = (value: number) => String(value).padStart(2, "0");

/**
 * "31 ต.ค. 20:59:41" เวลาไทย ถึงวินาที (Log การบิด)
 * เขียนเองไม่ใช้ Intl — ICU ต่างเวอร์ชัน Node ให้ผลไม่เหมือนกัน
 */
export function formatBidSecond(iso: string): string {
  const shifted = new Date(Date.parse(iso) + BANGKOK_OFFSET_MS);
  return `${shifted.getUTCDate()} ${thaiMonthsShort()[shifted.getUTCMonth()]} ${pad(shifted.getUTCHours())}:${pad(shifted.getUTCMinutes())}:${pad(shifted.getUTCSeconds())}`;
}

/** "29 ต.ค." เวลาไทย */
export function formatDayMonth(iso: string): string {
  const shifted = new Date(Date.parse(iso) + BANGKOK_OFFSET_MS);
  return `${shifted.getUTCDate()} ${thaiMonthsShort()[shifted.getUTCMonth()]}`;
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
      return row.deadline ? { kind: "payment" } : { kind: "text", text: translate("auction", "admin.adminAuctionsFormat.text20", "จบ {endsAt}", { endsAt: formatDayMonth(row.endsAt) }) };
    case "SUSPENDED":
      return { kind: "text", text: translate("auction", "admin.adminAuctionsFormat.text21", "ระงับ {value}", { value: formatDayMonth(row.suspendedAt ?? row.endsAt) }) };
    default:
      return { kind: "text", text: translate("auction", "admin.adminAuctionsFormat.text20", "จบ {endsAt}", { endsAt: formatDayMonth(row.endsAt) }) };
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

// @tolgee-key {"key": "admin.adminAuctionsFormat.label", "ns": "auction", "defaultValue": "ทั้งหมด"}
// @tolgee-key {"key": "admin.adminAuctionsFormat.label2", "ns": "auction", "defaultValue": "กำลังประมูล"}
// @tolgee-key {"key": "admin.adminAuctionsFormat.label3", "ns": "auction", "defaultValue": "ถูกรายงาน"}
// @tolgee-key {"key": "admin.adminAuctionsFormat.label4", "ns": "auction", "defaultValue": "รอชำระ"}
// @tolgee-key {"key": "admin.adminAuctionsFormat.label5", "ns": "auction", "defaultValue": "จบแล้ว"}
// @tolgee-key {"key": "admin.adminAuctionsFormat.label6", "ns": "auction", "defaultValue": "ถูกระงับ"}
// @tolgee-key {"key": "admin.adminAuctionsFormat.label7", "ns": "auction", "defaultValue": "ห้ามบิดอยู่"}
// @tolgee-key {"key": "admin.adminAuctionsFormat.label8", "ns": "auction", "defaultValue": "ใกล้ถูกห้าม"}
// @tolgee-key {"key": "admin.adminAuctionsFormat.label9", "ns": "auction", "defaultValue": "ประวัติ"}
// @tolgee-key {"key": "admin.adminAuctionsFormat.nEWACCOUNTRAPIDBIDS", "ns": "auction", "defaultValue": "บัญชีใหม่บิดถี่"}
// @tolgee-key {"key": "admin.adminAuctionsFormat.sHAREDADDRESSWITHSELLER", "ns": "auction", "defaultValue": "ที่อยู่ตรงผู้ขาย"}
// @tolgee-key {"key": "admin.adminAuctionsFormat.text", "ns": "auction", "defaultValue": "บิดผิดปกติ"}
// @tolgee-key {"key": "admin.adminAuctionsFormat.text2", "ns": "auction", "defaultValue": "ถูกรายงาน {reportCount}"}
// @tolgee-key {"key": "admin.adminAuctionsFormat.text3", "ns": "auction", "defaultValue": "{days} วัน"}
// @tolgee-key {"key": "admin.adminAuctionsFormat.text4", "ns": "auction", "defaultValue": "{n} สัปดาห์"}
// @tolgee-key {"key": "admin.adminAuctionsFormat.text5", "ns": "auction", "defaultValue": "{n} เดือน"}
// @tolgee-key {"key": "admin.adminAuctionsFormat.text6", "ns": "auction", "defaultValue": "{n} ปี"}
// @tolgee-key {"key": "admin.adminAuctionsFormat.text7", "ns": "auction", "defaultValue": "{value} {memberSince} · {orderCount} คำสั่งซื้อ"}
// @tolgee-key {"key": "admin.adminAuctionsFormat.text8", "ns": "auction", "defaultValue": "ม.ค."}
// @tolgee-key {"key": "admin.adminAuctionsFormat.text9", "ns": "auction", "defaultValue": "ก.พ."}
// @tolgee-key {"key": "admin.adminAuctionsFormat.text10", "ns": "auction", "defaultValue": "มี.ค."}
// @tolgee-key {"key": "admin.adminAuctionsFormat.text11", "ns": "auction", "defaultValue": "เม.ย."}
// @tolgee-key {"key": "admin.adminAuctionsFormat.text12", "ns": "auction", "defaultValue": "พ.ค."}
// @tolgee-key {"key": "admin.adminAuctionsFormat.text13", "ns": "auction", "defaultValue": "มิ.ย."}
// @tolgee-key {"key": "admin.adminAuctionsFormat.text14", "ns": "auction", "defaultValue": "ก.ค."}
// @tolgee-key {"key": "admin.adminAuctionsFormat.text15", "ns": "auction", "defaultValue": "ส.ค."}
// @tolgee-key {"key": "admin.adminAuctionsFormat.text16", "ns": "auction", "defaultValue": "ก.ย."}
// @tolgee-key {"key": "admin.adminAuctionsFormat.text17", "ns": "auction", "defaultValue": "ต.ค."}
// @tolgee-key {"key": "admin.adminAuctionsFormat.text18", "ns": "auction", "defaultValue": "พ.ย."}
// @tolgee-key {"key": "admin.adminAuctionsFormat.text19", "ns": "auction", "defaultValue": "ธ.ค."}
// @tolgee-key {"key": "admin.adminAuctionsFormat.text20", "ns": "auction", "defaultValue": "จบ {endsAt}"}
// @tolgee-key {"key": "admin.adminAuctionsFormat.text21", "ns": "auction", "defaultValue": "ระงับ {value}"}
// @tolgee-key {"key": "admin.adminAuctionsFormat.joined", "ns": "auction", "defaultValue": "สมัคร"}
// @tolgee-key {"key": "admin.adminAuctionsFormat.member", "ns": "auction", "defaultValue": "สมาชิก"}
