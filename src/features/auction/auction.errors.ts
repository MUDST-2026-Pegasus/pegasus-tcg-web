import { ApiError } from "@/lib/api/errors";

import { formatAuctionDate, formatBaht } from "./auction.format";
import { errorText, translateError, translate } from "@/lib/i18n";

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
    return { title: translate("auction", "buyer.auctionErrors.title", "บิดไม่สำเร็จ"), detail: translate("auction", "buyer.auctionErrors.detail", "กรุณาตรวจสอบการเชื่อมต่อและลองอีกครั้ง") };
  }
  const details = error.details;
  switch (error.code) {
    case "BID_TOO_LOW": {
      const currentPrice = num(details.currentPrice);
      const minNextBid = num(details.minNextBid) ?? context.minNextBid;
      if (currentPrice !== null && currentPrice > context.currentPrice) {
        return { title: translate("auction", "buyer.auctionErrors.title2", "มีคนบิดก่อนคุณ"), detail: translate("auction", "buyer.auctionErrors.detail2", "ราคาเปลี่ยนเป็น {currentPrice} — ตรวจราคาแล้วบิดใหม่", { currentPrice: formatBaht(currentPrice) }) };
      }
      return {
        title: translate("auction", "buyer.auctionErrors.title3", "ราคาต่ำกว่าขั้นต่ำ"),
        // ยอดขั้นต่ำมาจาก details.minNextBid ของ API ผ่าน ICU param [TCG-547]
        detail: errorText("BID_TOO_LOW", { minNextBid: formatBaht(minNextBid) }) ?? translate("auction", "buyer.auctionErrors.text", "ต้องบิดอย่างน้อย {minNextBid}", { minNextBid: formatBaht(minNextBid) }),
      };
    }
    case "NO_SHIPPING_ADDRESS":
      return { title: translate("auction", "buyer.auctionErrors.title4", "ยังไม่มีที่อยู่จัดส่ง"), detail: translate("auction", "buyer.auctionErrors.detail3", "เพิ่มที่อยู่อย่างน้อย 1 ที่ก่อนบิด") };
    case "EMAIL_NOT_VERIFIED":
      return { title: translate("auction", "buyer.auctionErrors.title5", "ยังไม่ได้ยืนยันอีเมล"), detail: translate("auction", "buyer.auctionErrors.detail4", "ยืนยันอีเมลก่อนจึงจะบิดได้") };
    case "BIDDING_BANNED": {
      const until = str(details.bannedUntil);
      return { title: until ? translate("auction", "buyer.auctionErrors.text2", "ถูกห้ามบิดถึง {until}", { until: formatAuctionDate(until) }) : translate("auction", "buyer.auctionErrors.text3", "ถูกห้ามบิด"), detail: translate("auction", "buyer.auctionErrors.detail5", "ไม่ชำระเงินหลังชนะครบ 3 ครั้ง") };
    }
    case "OWN_AUCTION":
      return { title: translate("auction", "buyer.auctionErrors.title6", "บิดประมูลของตัวเองไม่ได้"), detail: translate("auction", "buyer.auctionErrors.detail6", "ประมูลนี้เปิดโดยร้านของคุณ") };
    // ข้อความจาก API เป็นภาษาอังกฤษ — แปลง code ที่ผู้ซื้อเจอได้เป็นข้อความไทย [TCG-638]
    case "AUCTION_CLOSED":
      return { title: translate("auction", "buyer.auctionErrors.title7", "ประมูลจบแล้ว"), detail: translate("auction", "buyer.auctionErrors.detail7", "ประมูลนี้ปิดรับบิดแล้ว รีเฟรชหน้าเพื่อดูผล") };
    case "BUY_NOW_UNAVAILABLE":
      return { title: translate("auction", "buyer.auctionErrors.title8", "ซื้อทันทีไม่ได้แล้ว"), detail: translate("auction", "buyer.auctionErrors.detail8", "มีผู้บิดคนแรกแล้ว ประมูลนี้เป็นการบิดปกติ") };
    case "AUCTION_NOT_FOUND":
      return { title: translate("auction", "buyer.auctionErrors.title9", "ไม่พบประมูลนี้"), detail: translate("auction", "buyer.auctionErrors.detail9", "ประมูลอาจถูกลบหรือลิงก์ไม่ถูกต้อง") };
    case "IDEMPOTENCY_KEY_CONFLICT":
      return { title: translate("auction", "buyer.auctionErrors.title", "บิดไม่สำเร็จ"), detail: translate("auction", "buyer.auctionErrors.detail10", "คำขอซ้ำกับครั้งก่อน ลองกดบิดใหม่อีกครั้ง") };
    default:
      return { title: translate("auction", "buyer.auctionErrors.title", "บิดไม่สำเร็จ"), detail: translateError(error, error.message) };
  }
}

/** ข้อความตอน "ยังไม่ได้ยืนยันอีเมล" ในกล่องบิด (B4-B) — ใช้ข้อความเดียวกับ B3-E */
export const EMAIL_NOT_VERIFIED_MESSAGE: AuctionErrorMessage = {
  get title() {
    return translate("auction", "buyer.auctionErrors.title5", "ยังไม่ได้ยืนยันอีเมล");
  },
  get detail() {
    return translate("auction", "buyer.auctionErrors.detail4", "ยืนยันอีเมลก่อนจึงจะบิดได้");
  },
};

// @tolgee-key {"key": "buyer.auctionErrors.title", "ns": "auction", "defaultValue": "บิดไม่สำเร็จ"}
// @tolgee-key {"key": "buyer.auctionErrors.detail", "ns": "auction", "defaultValue": "กรุณาตรวจสอบการเชื่อมต่อและลองอีกครั้ง"}
// @tolgee-key {"key": "buyer.auctionErrors.title2", "ns": "auction", "defaultValue": "มีคนบิดก่อนคุณ"}
// @tolgee-key {"key": "buyer.auctionErrors.detail2", "ns": "auction", "defaultValue": "ราคาเปลี่ยนเป็น {currentPrice} — ตรวจราคาแล้วบิดใหม่"}
// @tolgee-key {"key": "buyer.auctionErrors.title3", "ns": "auction", "defaultValue": "ราคาต่ำกว่าขั้นต่ำ"}
// @tolgee-key {"key": "buyer.auctionErrors.text", "ns": "auction", "defaultValue": "ต้องบิดอย่างน้อย {minNextBid}"}
// @tolgee-key {"key": "buyer.auctionErrors.title4", "ns": "auction", "defaultValue": "ยังไม่มีที่อยู่จัดส่ง"}
// @tolgee-key {"key": "buyer.auctionErrors.detail3", "ns": "auction", "defaultValue": "เพิ่มที่อยู่อย่างน้อย 1 ที่ก่อนบิด"}
// @tolgee-key {"key": "buyer.auctionErrors.title5", "ns": "auction", "defaultValue": "ยังไม่ได้ยืนยันอีเมล"}
// @tolgee-key {"key": "buyer.auctionErrors.detail4", "ns": "auction", "defaultValue": "ยืนยันอีเมลก่อนจึงจะบิดได้"}
// @tolgee-key {"key": "buyer.auctionErrors.text2", "ns": "auction", "defaultValue": "ถูกห้ามบิดถึง {until}"}
// @tolgee-key {"key": "buyer.auctionErrors.text3", "ns": "auction", "defaultValue": "ถูกห้ามบิด"}
// @tolgee-key {"key": "buyer.auctionErrors.detail5", "ns": "auction", "defaultValue": "ไม่ชำระเงินหลังชนะครบ 3 ครั้ง"}
// @tolgee-key {"key": "buyer.auctionErrors.title6", "ns": "auction", "defaultValue": "บิดประมูลของตัวเองไม่ได้"}
// @tolgee-key {"key": "buyer.auctionErrors.detail6", "ns": "auction", "defaultValue": "ประมูลนี้เปิดโดยร้านของคุณ"}
// @tolgee-key {"key": "buyer.auctionErrors.title7", "ns": "auction", "defaultValue": "ประมูลจบแล้ว"}
// @tolgee-key {"key": "buyer.auctionErrors.detail7", "ns": "auction", "defaultValue": "ประมูลนี้ปิดรับบิดแล้ว รีเฟรชหน้าเพื่อดูผล"}
// @tolgee-key {"key": "buyer.auctionErrors.title8", "ns": "auction", "defaultValue": "ซื้อทันทีไม่ได้แล้ว"}
// @tolgee-key {"key": "buyer.auctionErrors.detail8", "ns": "auction", "defaultValue": "มีผู้บิดคนแรกแล้ว ประมูลนี้เป็นการบิดปกติ"}
// @tolgee-key {"key": "buyer.auctionErrors.title9", "ns": "auction", "defaultValue": "ไม่พบประมูลนี้"}
// @tolgee-key {"key": "buyer.auctionErrors.detail9", "ns": "auction", "defaultValue": "ประมูลอาจถูกลบหรือลิงก์ไม่ถูกต้อง"}
// @tolgee-key {"key": "buyer.auctionErrors.detail10", "ns": "auction", "defaultValue": "คำขอซ้ำกับครั้งก่อน ลองกดบิดใหม่อีกครั้ง"}
