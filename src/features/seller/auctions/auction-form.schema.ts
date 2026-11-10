import { z } from "zod";

import { formatAuctionDate, formatBaht } from "@/features/auction/auction.format";
import type { CreateAuctionRequest, EligibleUnit, SellerAuctionDetail } from "@/features/auction/auction.types";
import { toNumber } from "@/features/seller/products/products.format";
import { ApiError } from "@/lib/api/errors";

import type { AuctionFormField, AuctionFormIssue, AuctionFormValues, CloseTimeShortcut } from "./auction-form.types";
import { translate } from "@/lib/i18n";

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
  { get label() {
    return translate("auction", "seller.auctionFormSchema.label", "+6 ชม.");
  }, hours: 6 },
  { get label() {
    return translate("auction", "seller.auctionFormSchema.label2", "+1 วัน");
  }, hours: 24 },
  { get label() {
    return translate("auction", "seller.auctionFormSchema.label3", "+3 วัน");
  }, hours: 72 },
  { get label() {
    return translate("auction", "seller.auctionFormSchema.label4", "+7 วัน");
  }, hours: 168 },
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

/** เวลาปิดที่ตั้งไว้ให้ตอนเปิดฟอร์ม: อย่างน้อย 1 ชม. 15 นาที ปัดขึ้นเป็นทุก 15 นาที
 *  (เผื่อเวลากรอกฟอร์มไว้ ไม่ให้ต่ำกว่าขั้นต่ำ 1 ชม. ตอนกดเปิด) เช่น 22:07 → 23:30 */
export const DEFAULT_CLOSE_LEAD_MS = HOUR + 15 * MINUTE;
const DEFAULT_CLOSE_STEP_MS = 15 * MINUTE;

export function defaultCloseTime(now: number): { closeDate: string; closeTime: string } {
  const target = Math.ceil((now + DEFAULT_CLOSE_LEAD_MS) / DEFAULT_CLOSE_STEP_MS) * DEFAULT_CLOSE_STEP_MS;
  const { date, time } = bangkokParts(target);
  return { closeDate: date, closeTime: time };
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
  if (days > 0) return hours > 0 ? translate("auction", "seller.auctionFormSchema.text", "{days} วัน {hours} ชม.", { days, hours }) : translate("auction", "seller.auctionFormSchema.text2", "{days} วัน", { days });
  if (hours > 0) return minutes > 0 ? translate("auction", "seller.auctionFormSchema.text3", "{hours} ชม. {minutes} นาที", { hours, minutes }) : translate("auction", "seller.auctionFormSchema.text4", "{hours} ชม.", { hours });
  return translate("auction", "seller.auctionFormSchema.text5", "{minutes} นาที", { minutes });
}

// เขียนตัวย่อเอง ไม่ใช้ Intl — ข้อมูล locale (ICU) แต่ละเวอร์ชัน Node ย่อไม่เหมือนกัน
// เช่น Node 22 ให้ "จันทร์" แทน "จ."
const thaiWeekdaysShort = () => [translate("auction", "seller.auctionFormSchema.text6", "อา."), translate("auction", "seller.auctionFormSchema.text7", "จ."), translate("auction", "seller.auctionFormSchema.text8", "อ."), translate("auction", "seller.auctionFormSchema.text9", "พ."), translate("auction", "seller.auctionFormSchema.text10", "พฤ."), translate("auction", "seller.auctionFormSchema.text11", "ศ."), translate("auction", "seller.auctionFormSchema.text12", "ส.")];
const thaiMonthsShort = () => [translate("auction", "seller.auctionFormSchema.text13", "ม.ค."), translate("auction", "seller.auctionFormSchema.text14", "ก.พ."), translate("auction", "seller.auctionFormSchema.text15", "มี.ค."), translate("auction", "seller.auctionFormSchema.text16", "เม.ย."), translate("auction", "seller.auctionFormSchema.text17", "พ.ค."), translate("auction", "seller.auctionFormSchema.text18", "มิ.ย."), translate("auction", "seller.auctionFormSchema.text19", "ก.ค."), translate("auction", "seller.auctionFormSchema.text20", "ส.ค."), translate("auction", "seller.auctionFormSchema.text21", "ก.ย."), translate("auction", "seller.auctionFormSchema.text22", "ต.ค."), translate("auction", "seller.auctionFormSchema.text23", "พ.ย."), translate("auction", "seller.auctionFormSchema.text24", "ธ.ค.")];

/** "จ. 2 พ.ย. 2026" — ปี ค.ศ. ตาม Figma */
export function formatCloseDate(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return `${thaiWeekdaysShort()[weekday]} ${day} ${thaiMonthsShort()[month - 1]} ${year}`;
}

// ---------- กติกา ----------

function moneyIssue(text: string, path: AuctionFormField, label: string, required: string): AuctionFormIssue | null {
  const value = toNumber(text);
  if (value === null) return { path, message: required };
  if (value <= 0) return { path, message: translate("auction", "seller.auctionFormSchema.message", "{label}ต้องมากกว่า ฿0", { label }) };
  if (value > MAX_MONEY) return { path, message: translate("auction", "seller.auctionFormSchema.message2", "{label}สูงเกินไป", { label }) };
  return null;
}

/**
 * ราคาซื้อทันที (ตอนเปิดซื้อทันที) — ใช้ทั้งฟอร์มเปิดประมูลและ dialog แก้ราคาใน S4 [TCG-634]
 * @param startingPrice `null` = ราคาเริ่มต้นยังไม่ถูกต้อง ข้ามการเทียบ
 */
export function buyNowPriceIssue(text: string, startingPrice: number | null): AuctionFormIssue | null {
  const issue = moneyIssue(text, "buyNowPrice", translate("auction", "seller.auctionFormSchema.text25", "ราคาซื้อทันที"), translate("auction", "seller.auctionFormSchema.text26", "กรอกราคาซื้อทันที"));
  if (issue) return issue;
  const buyNow = toNumber(text);
  if (buyNow !== null && startingPrice !== null && buyNow <= startingPrice) {
    return {
      path: "buyNowPrice",
      message: translate("auction", "seller.auctionFormSchema.message3", "ราคาซื้อทันทีต้องสูงกว่าราคาเริ่มต้น"),
      detail: translate("auction", "seller.auctionFormSchema.detail", "ตอนนี้ {buyNow} ≤ {startingPrice}", { buyNow: formatBaht(buyNow), startingPrice: formatBaht(startingPrice) }),
    };
  }
  return null;
}

/** ข้อผิดพลาดของเวลาปิด — ใช้ทั้งตอนกรอกและตอน backend ตอบกลับ */
function closeTooSoon(): AuctionFormIssue {
  return { path: "closeDate", message: translate("auction", "seller.auctionFormSchema.message4", "เวลาปิดเร็วเกินไป"), detail: translate("auction", "seller.auctionFormSchema.detail2", "ต้องห่างจากตอนนี้อย่างน้อย 1 ชม.") };
}

function closeTooFar(now: number): AuctionFormIssue {
  const last = new Date(now + MAX_AUCTION_DURATION_MS).toISOString();
  return {
    path: "closeDate",
    message: translate("auction", "seller.auctionFormSchema.message5", "เวลาปิดไกลเกินไป"),
    detail: translate("auction", "seller.auctionFormSchema.detail3", "ตั้งได้ไม่เกิน 30 วันจากตอนนี้ (ภายใน {last})", { last: formatAuctionDate(last) }),
  };
}

const UNIT_NOT_AVAILABLE: AuctionFormIssue = {
  path: "unitUid",
  get message() {
    return translate("auction", "seller.auctionFormSchema.message6", "การ์ดใบนี้ไม่ว่าง");
  },
  get detail() {
    return translate("auction", "seller.auctionFormSchema.detail4", "อยู่ในคำสั่งซื้อหรือประมูลอื่นแล้ว เลือกใบอื่น");
  },
};

/** ทุกกติกาของฟอร์ม — เรียงตามลำดับช่องบนหน้าจอ */
export function auctionFormIssues(values: AuctionFormValues, now: number): AuctionFormIssue[] {
  const issues: (AuctionFormIssue | null)[] = [];

  if (values.unitUid === null) {
    issues.push({ path: "unitUid", message: translate("auction", "seller.auctionFormSchema.message7", "เลือกการ์ดจากสต็อกก่อน") });
  }

  const startIssue = moneyIssue(values.startingPrice, "startingPrice", translate("auction", "seller.auctionFormSchema.text27", "ราคาเริ่มต้น"), translate("auction", "seller.auctionFormSchema.text28", "กรอกราคาเริ่มต้น"));
  issues.push(startIssue);

  const increment = toNumber(values.bidIncrement);
  if (increment === null || increment <= 0) {
    issues.push({ path: "bidIncrement", message: translate("auction", "seller.auctionFormSchema.message8", "ขั้นบิดต้องมากกว่า ฿0"), detail: translate("auction", "seller.auctionFormSchema.detail5", "กรอกขั้นบิดขั้นต่ำครั้งละ") });
  } else if (increment > MAX_MONEY) {
    issues.push({ path: "bidIncrement", message: translate("auction", "seller.auctionFormSchema.message9", "ขั้นบิดสูงเกินไป") });
  }

  if (values.closeDate === "") {
    issues.push({ path: "closeDate", message: translate("auction", "seller.auctionFormSchema.message10", "เลือกวันปิดประมูล") });
  } else if (parseTimeInput(values.closeTime) !== values.closeTime) {
    issues.push({ path: "closeTime", message: translate("auction", "seller.auctionFormSchema.message11", "เวลาไม่ถูกต้อง"), detail: translate("auction", "seller.auctionFormSchema.detail6", "พิมพ์แบบ 24 ชม. เช่น 21:15") });
  } else {
    const closeAt = closeAtMs(values.closeDate, values.closeTime);
    if (closeAt === null) {
      issues.push({ path: "closeDate", message: translate("auction", "seller.auctionFormSchema.message10", "เลือกวันปิดประมูล") });
    } else if (closeAt - now < MIN_AUCTION_DURATION_MS) {
      issues.push(closeTooSoon());
    } else if (closeAt - now > MAX_AUCTION_DURATION_MS) {
      issues.push(closeTooFar(now));
    }
  }

  if (values.buyNowEnabled) {
    issues.push(buyNowPriceIssue(values.buyNowPrice, startIssue ? null : toNumber(values.startingPrice)));
  }

  if (values.sellerNote.trim().length > MAX_SELLER_NOTE) {
    issues.push({ path: "sellerNote", message: translate("auction", "seller.auctionFormSchema.message12", "หมายเหตุต้องไม่เกิน {MAX_SELLER_NOTE} ตัวอักษร", { MAX_SELLER_NOTE }) });
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
        message: translate("auction", "seller.auctionFormSchema.message3", "ราคาซื้อทันทีต้องสูงกว่าราคาเริ่มต้น"),
        detail: translate("auction", "seller.auctionFormSchema.detail7", "ตอนนี้ {buyNow} ≤ {start}", { buyNow: formatBaht(buyNow), start: formatBaht(start) }),
      };
    }
    case "UNIT_NOT_AVAILABLE":
      return UNIT_NOT_AVAILABLE;
    case "SELLER_NOT_VERIFIED":
      return { path: null, message: translate("auction", "seller.auctionFormSchema.message13", "ร้านยังไม่ผ่านการยืนยัน"), detail: translate("auction", "seller.auctionFormSchema.detail8", "ต้องยืนยันร้านก่อนเปิดประมูล") };
    default:
      return null;
  }
}

// @tolgee-key {"key": "seller.auctionFormSchema.label", "ns": "auction", "defaultValue": "+6 ชม."}
// @tolgee-key {"key": "seller.auctionFormSchema.label2", "ns": "auction", "defaultValue": "+1 วัน"}
// @tolgee-key {"key": "seller.auctionFormSchema.label3", "ns": "auction", "defaultValue": "+3 วัน"}
// @tolgee-key {"key": "seller.auctionFormSchema.label4", "ns": "auction", "defaultValue": "+7 วัน"}
// @tolgee-key {"key": "seller.auctionFormSchema.text", "ns": "auction", "defaultValue": "{days} วัน {hours} ชม."}
// @tolgee-key {"key": "seller.auctionFormSchema.text2", "ns": "auction", "defaultValue": "{days} วัน"}
// @tolgee-key {"key": "seller.auctionFormSchema.text3", "ns": "auction", "defaultValue": "{hours} ชม. {minutes} นาที"}
// @tolgee-key {"key": "seller.auctionFormSchema.text4", "ns": "auction", "defaultValue": "{hours} ชม."}
// @tolgee-key {"key": "seller.auctionFormSchema.text5", "ns": "auction", "defaultValue": "{minutes} นาที"}
// @tolgee-key {"key": "seller.auctionFormSchema.text6", "ns": "auction", "defaultValue": "อา."}
// @tolgee-key {"key": "seller.auctionFormSchema.text7", "ns": "auction", "defaultValue": "จ."}
// @tolgee-key {"key": "seller.auctionFormSchema.text8", "ns": "auction", "defaultValue": "อ."}
// @tolgee-key {"key": "seller.auctionFormSchema.text9", "ns": "auction", "defaultValue": "พ."}
// @tolgee-key {"key": "seller.auctionFormSchema.text10", "ns": "auction", "defaultValue": "พฤ."}
// @tolgee-key {"key": "seller.auctionFormSchema.text11", "ns": "auction", "defaultValue": "ศ."}
// @tolgee-key {"key": "seller.auctionFormSchema.text12", "ns": "auction", "defaultValue": "ส."}
// @tolgee-key {"key": "seller.auctionFormSchema.text13", "ns": "auction", "defaultValue": "ม.ค."}
// @tolgee-key {"key": "seller.auctionFormSchema.text14", "ns": "auction", "defaultValue": "ก.พ."}
// @tolgee-key {"key": "seller.auctionFormSchema.text15", "ns": "auction", "defaultValue": "มี.ค."}
// @tolgee-key {"key": "seller.auctionFormSchema.text16", "ns": "auction", "defaultValue": "เม.ย."}
// @tolgee-key {"key": "seller.auctionFormSchema.text17", "ns": "auction", "defaultValue": "พ.ค."}
// @tolgee-key {"key": "seller.auctionFormSchema.text18", "ns": "auction", "defaultValue": "มิ.ย."}
// @tolgee-key {"key": "seller.auctionFormSchema.text19", "ns": "auction", "defaultValue": "ก.ค."}
// @tolgee-key {"key": "seller.auctionFormSchema.text20", "ns": "auction", "defaultValue": "ส.ค."}
// @tolgee-key {"key": "seller.auctionFormSchema.text21", "ns": "auction", "defaultValue": "ก.ย."}
// @tolgee-key {"key": "seller.auctionFormSchema.text22", "ns": "auction", "defaultValue": "ต.ค."}
// @tolgee-key {"key": "seller.auctionFormSchema.text23", "ns": "auction", "defaultValue": "พ.ย."}
// @tolgee-key {"key": "seller.auctionFormSchema.text24", "ns": "auction", "defaultValue": "ธ.ค."}
// @tolgee-key {"key": "seller.auctionFormSchema.message", "ns": "auction", "defaultValue": "{label}ต้องมากกว่า ฿0"}
// @tolgee-key {"key": "seller.auctionFormSchema.message2", "ns": "auction", "defaultValue": "{label}สูงเกินไป"}
// @tolgee-key {"key": "seller.auctionFormSchema.text25", "ns": "auction", "defaultValue": "ราคาซื้อทันที"}
// @tolgee-key {"key": "seller.auctionFormSchema.text26", "ns": "auction", "defaultValue": "กรอกราคาซื้อทันที"}
// @tolgee-key {"key": "seller.auctionFormSchema.message3", "ns": "auction", "defaultValue": "ราคาซื้อทันทีต้องสูงกว่าราคาเริ่มต้น"}
// @tolgee-key {"key": "seller.auctionFormSchema.detail", "ns": "auction", "defaultValue": "ตอนนี้ {buyNow} ≤ {startingPrice}"}
// @tolgee-key {"key": "seller.auctionFormSchema.message4", "ns": "auction", "defaultValue": "เวลาปิดเร็วเกินไป"}
// @tolgee-key {"key": "seller.auctionFormSchema.detail2", "ns": "auction", "defaultValue": "ต้องห่างจากตอนนี้อย่างน้อย 1 ชม."}
// @tolgee-key {"key": "seller.auctionFormSchema.message5", "ns": "auction", "defaultValue": "เวลาปิดไกลเกินไป"}
// @tolgee-key {"key": "seller.auctionFormSchema.detail3", "ns": "auction", "defaultValue": "ตั้งได้ไม่เกิน 30 วันจากตอนนี้ (ภายใน {last})"}
// @tolgee-key {"key": "seller.auctionFormSchema.message6", "ns": "auction", "defaultValue": "การ์ดใบนี้ไม่ว่าง"}
// @tolgee-key {"key": "seller.auctionFormSchema.detail4", "ns": "auction", "defaultValue": "อยู่ในคำสั่งซื้อหรือประมูลอื่นแล้ว เลือกใบอื่น"}
// @tolgee-key {"key": "seller.auctionFormSchema.message7", "ns": "auction", "defaultValue": "เลือกการ์ดจากสต็อกก่อน"}
// @tolgee-key {"key": "seller.auctionFormSchema.text27", "ns": "auction", "defaultValue": "ราคาเริ่มต้น"}
// @tolgee-key {"key": "seller.auctionFormSchema.text28", "ns": "auction", "defaultValue": "กรอกราคาเริ่มต้น"}
// @tolgee-key {"key": "seller.auctionFormSchema.message8", "ns": "auction", "defaultValue": "ขั้นบิดต้องมากกว่า ฿0"}
// @tolgee-key {"key": "seller.auctionFormSchema.detail5", "ns": "auction", "defaultValue": "กรอกขั้นบิดขั้นต่ำครั้งละ"}
// @tolgee-key {"key": "seller.auctionFormSchema.message9", "ns": "auction", "defaultValue": "ขั้นบิดสูงเกินไป"}
// @tolgee-key {"key": "seller.auctionFormSchema.message10", "ns": "auction", "defaultValue": "เลือกวันปิดประมูล"}
// @tolgee-key {"key": "seller.auctionFormSchema.message11", "ns": "auction", "defaultValue": "เวลาไม่ถูกต้อง"}
// @tolgee-key {"key": "seller.auctionFormSchema.detail6", "ns": "auction", "defaultValue": "พิมพ์แบบ 24 ชม. เช่น 21:15"}
// @tolgee-key {"key": "seller.auctionFormSchema.message12", "ns": "auction", "defaultValue": "หมายเหตุต้องไม่เกิน {MAX_SELLER_NOTE} ตัวอักษร"}
// @tolgee-key {"key": "seller.auctionFormSchema.detail7", "ns": "auction", "defaultValue": "ตอนนี้ {buyNow} ≤ {start}"}
// @tolgee-key {"key": "seller.auctionFormSchema.message13", "ns": "auction", "defaultValue": "ร้านยังไม่ผ่านการยืนยัน"}
// @tolgee-key {"key": "seller.auctionFormSchema.detail8", "ns": "auction", "defaultValue": "ต้องยืนยันร้านก่อนเปิดประมูล"}
