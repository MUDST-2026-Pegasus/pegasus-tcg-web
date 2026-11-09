import { ApiError } from "@/lib/api/errors";

import { formatAuctionDate, formatBaht } from "./auction.format";
import { errorText, translateError } from "@/lib/i18n";

/** ข้อความในแบนเนอร์ error (Figma B3-E) */
export type AuctionErrorMessage = { title: string; detail: string };

type ErrorContext = {
  /** ราคาที่ผู้ใช้เห็นตอนกดบิด — ใช้แยก "มีคนบิดก่อนคุณ" ออกจาก "ราคาต่ำกว่าขั้นต่ำ" */
  currentPrice: number;
  bidIncrement: number;
  minNextBid: number;
};

const num = (value: unknown): number | null => (typeof value === "number" && Number.isFinite(value) ? value : null);
const str = (value: unknown): string | null => (typeof value === "string" && value !== "" ? value : null);

/**
 * แปลง error จากการบิด / ซื้อทันที → ข้อความตาม B3-E [TCG-630 · FE-4]
 * code ที่ไม่รู้จัก ใช้ข้อความจาก API แทน
 */
export function auctionErrorMessage(error: unknown, context: ErrorContext): AuctionErrorMessage {
  if (!(error instanceof ApiError)) {
    return { title: "บิดไม่สำเร็จ", detail: "กรุณาตรวจสอบการเชื่อมต่อและลองอีกครั้ง" };
  }
  const details = error.details;
  switch (error.code) {
    case "BID_TOO_LOW": {
      const currentPrice = num(details.currentPrice);
      const minNextBid = num(details.minNextBid) ?? context.minNextBid;
      if (currentPrice !== null && currentPrice > context.currentPrice) {
        return { title: "มีคนบิดก่อนคุณ", detail: `ราคาเปลี่ยนเป็น ${formatBaht(currentPrice)} — ตรวจราคาแล้วบิดใหม่` };
      }
      return {
        title: "ราคาต่ำกว่าขั้นต่ำ",
        // ยอดขั้นต่ำมาจาก details.minNextBid ของ API ผ่าน ICU param [TCG-547]
        detail: errorText("BID_TOO_LOW", { minNextBid: formatBaht(minNextBid) }) ?? `ต้องบิดอย่างน้อย ${formatBaht(minNextBid)}`,
      };
    }
    case "NO_SHIPPING_ADDRESS":
      return { title: "ยังไม่มีที่อยู่จัดส่ง", detail: "เพิ่มที่อยู่อย่างน้อย 1 ที่ก่อนบิด" };
    case "EMAIL_NOT_VERIFIED":
      return { title: "ยังไม่ได้ยืนยันอีเมล", detail: "ยืนยันอีเมลก่อนจึงจะบิดได้" };
    case "BIDDING_BANNED": {
      const until = str(details.bannedUntil);
      return { title: until ? `ถูกห้ามบิดถึง ${formatAuctionDate(until)}` : "ถูกห้ามบิด", detail: "ไม่ชำระเงินหลังชนะครบ 3 ครั้ง" };
    }
    case "OWN_AUCTION":
      return { title: "บิดประมูลของตัวเองไม่ได้", detail: "ประมูลนี้เปิดโดยร้านของคุณ" };
    // ข้อความจาก API เป็นภาษาอังกฤษ — แปลง code ที่ผู้ซื้อเจอได้เป็นข้อความไทย [TCG-638]
    case "AUCTION_CLOSED":
      return { title: "ประมูลจบแล้ว", detail: "ประมูลนี้ปิดรับบิดแล้ว รีเฟรชหน้าเพื่อดูผล" };
    case "BUY_NOW_UNAVAILABLE":
      return { title: "ซื้อทันทีไม่ได้แล้ว", detail: "มีผู้บิดคนแรกแล้ว ประมูลนี้เป็นการบิดปกติ" };
    case "AUCTION_NOT_FOUND":
      return { title: "ไม่พบประมูลนี้", detail: "ประมูลอาจถูกลบหรือลิงก์ไม่ถูกต้อง" };
    case "IDEMPOTENCY_KEY_CONFLICT":
      return { title: "บิดไม่สำเร็จ", detail: "คำขอซ้ำกับครั้งก่อน ลองกดบิดใหม่อีกครั้ง" };
    default:
      return { title: "บิดไม่สำเร็จ", detail: translateError(error, error.message) };
  }
}

/** ข้อความตอน "ยังไม่ได้ยืนยันอีเมล" ในกล่องบิด (B4-B) — ใช้ข้อความเดียวกับ B3-E */
export const EMAIL_NOT_VERIFIED_MESSAGE: AuctionErrorMessage = {
  title: "ยังไม่ได้ยืนยันอีเมล",
  detail: "ยืนยันอีเมลก่อนจึงจะบิดได้",
};
