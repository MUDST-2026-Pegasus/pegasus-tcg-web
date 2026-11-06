import { z } from "zod";

import { formatAuctionDate, formatBaht } from "@/features/auction/auction.format";
import type { CreateAuctionRequest, EligibleUnit, SellerAuctionDetail } from "@/features/auction/auction.types";
import { toNumber } from "@/features/seller/products/products.format";
import { ApiError } from "@/lib/api/errors";

import type { AuctionFormField, AuctionFormIssue, AuctionFormValues, CloseTimeShortcut } from "./auction-form.types";

/**
 * กติกาฟอร์มเปิดประมูล (Figma S3-E) [TCG-633 · FE-7]
 * แยกเป็นฟังก์ชันธรรมดาที่รับ `now` เข้ามา ให้ test ได้โดยไม่ต้องผ่าน zod หรือหน้าจอ
 */

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** ประมูลต้องยาวอย่างน้อยเท่านี้ */
export const MIN_AUCTION_DURATION_MS = HOUR;
/** และไม่เกินเท่านี้ */
export const MAX_AUCTION_DURATION_MS = 30 * DAY;
/** `@Digits(integer = 12, fraction = 2)` เหมือนราคาขายปกติ */
const MAX_MONEY = 999_999_999_999.99;
export const MAX_SELLER_NOTE = 500;

/** เวลาประเทศไทยไม่มี daylight saving — บวก 7 ชม. ตายตัว */
const BANGKOK_OFFSET = "+07:00";
const BANGKOK_OFFSET_MS = 7 * HOUR;

export const CLOSE_TIME_SHORTCUTS: CloseTimeShortcut[] = [
  { label: "+6 ชม.", hours: 6 },
  { label: "+1 วัน", hours: 24 },
  { label: "+3 วัน", hours: 72 },
  { label: "+7 วัน", hours: 168 },
];

/** ใบนี้นำมาประมูลได้ไหม — ใบที่วางขายอยู่ก็ได้ แค่ถูกถอดจากประกาศ */
export function isSelectableUnit(unit: EligibleUnit): boolean {
  return unit.availability === "AVAILABLE" || unit.availability === "LISTED";
}

// ---------- เวลาปิด ----------

const pad = (value: number) => String(value).padStart(2, "0");

/** เวลา ms → วันและเวลาบนนาฬิกาไทย */
export function bangkokParts(ms: number): { date: string; time: string } {
  const shifted = new Date(ms + BANGKOK_OFFSET_MS);
  return {
    date: `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-${pad(shifted.getUTCDate())}`,
    time: `${pad(shifted.getUTCHours())}:${pad(shifted.getUTCMinutes())}`,
  };
}

/** `endsAt` ที่ส่งให้ backend — ISO พร้อม `+07:00` */
export function toEndsAtIso(date: string, time: string): string {
  return `${date}T${time}:00${BANGKOK_OFFSET}`;
}

/** เวลาปิดที่ตั้งไว้ เป็น ms — `null` = ยังกรอกไม่ครบหรือรูปแบบผิด */
export function closeAtMs(date: string, time: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || parseTimeInput(time) !== time) return null;
  const ms = Date.parse(toEndsAtIso(date, time));
  return Number.isNaN(ms) ? null : ms;
}

/**
 * เวลาที่พิมพ์เอง → `HH:mm` — รับ "21:15", "21.15", "2115", "9:05" · ผิดรูปแบบได้ `null`
 */
export function parseTimeInput(text: string): string | null {
  const match = /^(\d{1,2})[:.]?(\d{2})$/.exec(text.trim());
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;
  return `${pad(hour)}:${pad(minute)}`;
}

/** ปุ่ม "ตั้งเร็ว:" — ปัดขึ้นเป็นนาทีถัดไป ไม่ให้สั้นกว่าที่กดแม้แต่วินาทีเดียว */
export function shortcutCloseTime(now: number, hours: number): { date: string; time: string } {
  const target = Math.ceil((now + hours * HOUR) / MINUTE) * MINUTE;
  return bangkokParts(target);
}

/** วันแรกและวันสุดท้ายที่ปฏิทินให้เลือก (`YYYY-MM-DD` ตามปฏิทินไทย) */
export function closeDateRange(now: number): { first: string; last: string } {
  return {
    first: bangkokParts(now).date,
    last: bangkokParts(now + MAX_AUCTION_DURATION_MS).date,
  };
}

/** "3 วัน 4 ชม." · "6 ชม. 30 นาที" · "45 นาที" */
export function formatCloseDuration(ms: number): string {
  const safe = Math.max(0, ms);
  const days = Math.floor(safe / DAY);
  const hours = Math.floor((safe % DAY) / HOUR);
  const minutes = Math.floor((safe % HOUR) / MINUTE);
  if (days > 0) return hours > 0 ? `${days} วัน ${hours} ชม.` : `${days} วัน`;
  if (hours > 0) return minutes > 0 ? `${hours} ชม. ${minutes} นาที` : `${hours} ชม.`;
  return `${minutes} นาที`;
}

// เขียนตัวย่อเอง ไม่ใช้ Intl — ข้อมูล locale (ICU) แต่ละเวอร์ชัน Node ย่อไม่เหมือนกัน
// เช่น Node 22 ให้ "จันทร์" แทน "จ."
const THAI_WEEKDAYS_SHORT = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];
const THAI_MONTHS_SHORT = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

/** "จ. 2 พ.ย. 2026" — ปี ค.ศ. ตาม Figma */
export function formatCloseDate(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return `${THAI_WEEKDAYS_SHORT[weekday]} ${day} ${THAI_MONTHS_SHORT[month - 1]} ${year}`;
}

// ---------- กติกา ----------

function moneyIssue(text: string, path: AuctionFormField, label: string, required: string): AuctionFormIssue | null {
  const value = toNumber(text);
  if (value === null) return { path, message: required };
  if (value <= 0) return { path, message: `${label}ต้องมากกว่า ฿0` };
  if (value > MAX_MONEY) return { path, message: `${label}สูงเกินไป` };
  return null;
}

/** ข้อผิดพลาดของเวลาปิด — ใช้ทั้งตอนกรอกและตอน backend ตอบกลับ */
function closeTooSoon(): AuctionFormIssue {
  return { path: "closeDate", message: "เวลาปิดเร็วเกินไป", detail: "ต้องห่างจากตอนนี้อย่างน้อย 1 ชม." };
}

function closeTooFar(now: number): AuctionFormIssue {
  const last = new Date(now + MAX_AUCTION_DURATION_MS).toISOString();
  return {
    path: "closeDate",
    message: "เวลาปิดไกลเกินไป",
    detail: `ตั้งได้ไม่เกิน 30 วันจากตอนนี้ (ภายใน ${formatAuctionDate(last)})`,
  };
}

const UNIT_NOT_AVAILABLE: AuctionFormIssue = {
  path: "unitUid",
  message: "การ์ดใบนี้ไม่ว่าง",
  detail: "อยู่ในคำสั่งซื้อหรือประมูลอื่นแล้ว เลือกใบอื่น",
};

/** ทุกกติกาของฟอร์ม — เรียงตามลำดับช่องบนหน้าจอ */
export function auctionFormIssues(values: AuctionFormValues, now: number): AuctionFormIssue[] {
  const issues: (AuctionFormIssue | null)[] = [];

  if (values.unitUid === null) {
    issues.push({ path: "unitUid", message: "เลือกการ์ดจากสต็อกก่อน" });
  }

  const startIssue = moneyIssue(values.startingPrice, "startingPrice", "ราคาเริ่มต้น", "กรอกราคาเริ่มต้น");
  issues.push(startIssue);

  const increment = toNumber(values.bidIncrement);
  if (increment === null || increment <= 0) {
    issues.push({ path: "bidIncrement", message: "ขั้นบิดต้องมากกว่า ฿0", detail: "กรอกขั้นบิดขั้นต่ำครั้งละ" });
  } else if (increment > MAX_MONEY) {
    issues.push({ path: "bidIncrement", message: "ขั้นบิดสูงเกินไป" });
  }

  if (values.closeDate === "") {
    issues.push({ path: "closeDate", message: "เลือกวันปิดประมูล" });
  } else if (parseTimeInput(values.closeTime) !== values.closeTime) {
    issues.push({ path: "closeTime", message: "เวลาไม่ถูกต้อง", detail: "พิมพ์แบบ 24 ชม. เช่น 21:15" });
  } else {
    const closeAt = closeAtMs(values.closeDate, values.closeTime);
    if (closeAt === null) {
      issues.push({ path: "closeDate", message: "เลือกวันปิดประมูล" });
    } else if (closeAt - now < MIN_AUCTION_DURATION_MS) {
      issues.push(closeTooSoon());
    } else if (closeAt - now > MAX_AUCTION_DURATION_MS) {
      issues.push(closeTooFar(now));
    }
  }

  if (values.buyNowEnabled) {
    const buyNowIssue = moneyIssue(values.buyNowPrice, "buyNowPrice", "ราคาซื้อทันที", "กรอกราคาซื้อทันที");
    issues.push(buyNowIssue);
    const buyNow = toNumber(values.buyNowPrice);
    const start = toNumber(values.startingPrice);
    if (!buyNowIssue && !startIssue && buyNow !== null && start !== null && buyNow <= start) {
      issues.push({
        path: "buyNowPrice",
        message: "ราคาซื้อทันทีต้องสูงกว่าราคาเริ่มต้น",
        detail: `ตอนนี้ ${formatBaht(buyNow)} ≤ ${formatBaht(start)}`,
      });
    }
  }

  if (values.sellerNote.trim().length > MAX_SELLER_NOTE) {
    issues.push({ path: "sellerNote", message: `หมายเหตุต้องไม่เกิน ${MAX_SELLER_NOTE} ตัวอักษร` });
  }

  return issues.filter((issue): issue is AuctionFormIssue => issue !== null);
}

/** ข้อความใน react-hook-form มีบรรทัดเดียว — ต่อหัวข้อกับคำอธิบายด้วยขึ้นบรรทัดใหม่ แล้ว `AuctionFieldError` แยกกลับ */
export function issueMessage(issue: AuctionFormIssue): string {
  return issue.detail ? `${issue.message}\n${issue.detail}` : issue.message;
}

const formShape = z.object({
  unitUid: z.string().nullable(),
  startingPrice: z.string(),
  bidIncrement: z.string(),
  closeDate: z.string(),
  closeTime: z.string(),
  buyNowEnabled: z.boolean(),
  buyNowPrice: z.string(),
  sellerNote: z.string(),
});

/** @param now นาฬิกาตอนตรวจ — ใส่นาฬิกา server ได้ ถ้าเครื่องผู้ขายเวลาเพี้ยน */
export function auctionFormSchema(now: () => number = Date.now) {
  return formShape.superRefine((values, context) => {
    for (const issue of auctionFormIssues(values, now())) {
      context.addIssue({ code: "custom", path: [issue.path], message: issueMessage(issue) });
    }
  });
}

/** ช่องของแต่ละขั้น — ตรวจก่อนไปขั้นถัดไป และพาไปขั้นที่มีช่องผิด (ขั้น 3 เป็น dialog ไม่มีช่องเพิ่ม) */
export const AUCTION_STEP_FIELDS: AuctionFormField[][] = [
  ["unitUid"],
  ["startingPrice", "bidIncrement", "closeDate", "closeTime", "buyNowEnabled", "buyNowPrice", "sellerNote"],
];

export function emptyAuctionForm(): AuctionFormValues {
  return {
    unitUid: null,
    startingPrice: "",
    bidIncrement: "",
    closeDate: "",
    closeTime: "",
    buyNowEnabled: false,
    buyNowPrice: "",
    sellerNote: "",
  };
}

const text = (value: number | null) => (value === null ? "" : String(value));

/**
 * "ประมูลใหม่" (`?from={id}`) — เติมทุกช่องจากประมูลเดิม ยกเว้นเวลาปิด
 * การ์ดใบเดิมเลือกให้ทีหลังถ้ายังว่างอยู่ (ดูจากรายการสต็อก)
 */
export function relistAuctionForm(source: SellerAuctionDetail): AuctionFormValues {
  return {
    ...emptyAuctionForm(),
    startingPrice: text(source.startingPrice),
    bidIncrement: text(source.bidIncrement),
    buyNowEnabled: source.buyNowPrice !== null,
    buyNowPrice: text(source.buyNowPrice),
    sellerNote: source.sellerNote ?? "",
  };
}

/** ค่าในฟอร์ม (ผ่าน schema แล้ว) → body ของ `POST /sellers/me/auctions` */
export function toCreateAuctionPayload(values: AuctionFormValues): CreateAuctionRequest {
  const note = values.sellerNote.trim();
  return {
    unitUid: values.unitUid ?? "",
    startingPrice: toNumber(values.startingPrice) ?? 0,
    bidIncrement: toNumber(values.bidIncrement) ?? 0,
    endsAt: toEndsAtIso(values.closeDate, values.closeTime),
    buyNowPrice: values.buyNowEnabled ? toNumber(values.buyNowPrice) : null,
    sellerNote: note === "" ? null : note,
  };
}

/**
 * error จาก `POST /sellers/me/auctions` → ช่องที่ต้องแสดง
 * `null` path = ไม่ผูกกับช่องไหน (แสดงเป็นแบนเนอร์บนหัวฟอร์ม)
 */
export function createAuctionErrorIssue(
  error: unknown,
  values: AuctionFormValues,
  now: number,
): AuctionFormIssue | { path: null; message: string; detail?: string } | null {
  if (!(error instanceof ApiError)) return null;
  switch (error.code) {
    case "AUCTION_END_TOO_SOON":
      return closeTooSoon();
    case "AUCTION_END_TOO_FAR":
      return closeTooFar(now);
    case "BUY_NOW_BELOW_START": {
      const buyNow = toNumber(values.buyNowPrice) ?? 0;
      const start = toNumber(values.startingPrice) ?? 0;
      return {
        path: "buyNowPrice",
        message: "ราคาซื้อทันทีต้องสูงกว่าราคาเริ่มต้น",
        detail: `ตอนนี้ ${formatBaht(buyNow)} ≤ ${formatBaht(start)}`,
      };
    }
    case "UNIT_NOT_AVAILABLE":
      return UNIT_NOT_AVAILABLE;
    case "SELLER_NOT_VERIFIED":
      return { path: null, message: "ร้านยังไม่ผ่านการยืนยัน", detail: "ต้องยืนยันร้านก่อนเปิดประมูล" };
    default:
      return null;
  }
}
