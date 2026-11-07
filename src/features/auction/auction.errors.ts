import { translate } from "@/lib/language";
import { ApiError } from "@/lib/api/errors";

import { formatAuctionDate, formatBaht } from "./auction.format";

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
    return { title: translate("บิดไม่สำเร็จ", "Unable to bid"), detail: translate("กรุณาตรวจสอบการเชื่อมต่อและลองอีกครั้ง", "Please check your connection and try again") };
  }
  const details = error.details;
  switch (error.code) {
    case "BID_TOO_LOW": {
      const currentPrice = num(details.currentPrice);
      const minNextBid = num(details.minNextBid) ?? context.minNextBid;
      if (currentPrice !== null && currentPrice > context.currentPrice) {
        return { title: translate("มีคนบิดก่อนคุณ", "Another bidder got there first"), detail: translate(`ราคาเปลี่ยนเป็น ${formatBaht(currentPrice)} — ตรวจราคาแล้วบิดใหม่`, `The price changed to ${formatBaht(currentPrice)} — check the price and bid again`) };
      }
      return {
        title: translate("ราคาต่ำกว่าขั้นต่ำ", "Bid is below the minimum"),
        detail: translate(`ต้องบิดอย่างน้อย ${formatBaht(minNextBid)} (ราคาปัจจุบัน + ${formatBaht(context.bidIncrement)})`, `Bid at least ${formatBaht(minNextBid)} (current price + ${formatBaht(context.bidIncrement)})`),
      };
    }
    case "NO_SHIPPING_ADDRESS":
      return { title: translate("ยังไม่มีที่อยู่จัดส่ง", "No shipping address"), detail: translate("เพิ่มที่อยู่อย่างน้อย 1 ที่ก่อนบิด", "Add at least one shipping address before bidding") };
    case "EMAIL_NOT_VERIFIED":
      return { title: translate("ยังไม่ได้ยืนยันอีเมล", "Email not verified"), detail: translate("ยืนยันอีเมลก่อนจึงจะบิดได้", "Verify your email before bidding") };
    case "BIDDING_BANNED": {
      const until = str(details.bannedUntil);
      return { title: until ? translate(`ถูกห้ามบิดถึง ${formatAuctionDate(until)}`, `Bidding suspended until ${formatAuctionDate(until)}`) : translate("ถูกห้ามบิด", "Bidding suspended"), detail: translate("ไม่ชำระเงินหลังชนะครบ 3 ครั้ง", "Three unpaid auction wins") };
    }
    case "OWN_AUCTION":
      return { title: translate("บิดประมูลของตัวเองไม่ได้", "You cannot bid on your own auction"), detail: translate("ประมูลนี้เปิดโดยร้านของคุณ", "This auction belongs to your store") };
    default:
      return { title: translate("บิดไม่สำเร็จ", "Unable to bid"), detail: error.message };
  }
}

/** ข้อความตอน "ยังไม่ได้ยืนยันอีเมล" ในกล่องบิด (B4-B) — ใช้ข้อความเดียวกับ B3-E */
export const EMAIL_NOT_VERIFIED_MESSAGE: AuctionErrorMessage = {
  get title() { return translate("ยังไม่ได้ยืนยันอีเมล", "Email not verified"); },
  get detail() { return translate("ยืนยันอีเมลก่อนจึงจะบิดได้", "Verify your email before bidding"); },
};
