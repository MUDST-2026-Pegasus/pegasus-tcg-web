import { isBiddingBanned } from "./auction.format";
import type { AuctionDetail } from "./auction.types";

/**
 * กล่องบิดอยู่ในสถานะไหน ตาม Figma B3 (A–F) + B4 (A–H) [TCG-630 · FE-4]
 * ไม่มี React — ทดสอบได้ตรง ๆ
 */
export type BidPanelState =
  /** B4-G ถูกแอดมินระงับ */
  | "SUSPENDED"
  /** B4-E ขายแล้ว */
  | "SOLD"
  /** B4-F ไม่มีผู้บิด / ผู้ชนะไม่ชำระ / ผู้ขายยกเลิก */
  | "UNSOLD"
  /** B3-F ผู้ใช้คนนี้ชนะ รอชำระ */
  | "WON_AWAITING_PAYMENT"
  /** B4-D จบแล้ว รอผู้ชนะ (คนอื่น) ชำระ */
  | "AWAITING_PAYMENT"
  /** B4-A ยังไม่ล็อกอิน */
  | "GUEST"
  /** B4-C ผู้ขายเปิดดูประมูลของร้านตัวเอง */
  | "OWN_AUCTION"
  /** B4-H ติดโทษห้ามบิด */
  | "BANNED"
  /** B4-B ยังไม่มีที่อยู่จัดส่ง */
  | "NEEDS_ADDRESS"
  /** B4-B ยังไม่ยืนยันอีเมล (ใช้ข้อความ B3-E) */
  | "NEEDS_EMAIL"
  /** B3-B ยังไม่มีบิด มีปุ่มซื้อทันที */
  | "OPEN_BUY_NOW"
  /** กล่องบิดปกติ (B2) */
  | "OPEN";

export function resolveBidPanelState(auction: AuctionDetail, now: number = Date.now()): BidPanelState {
  const { viewer } = auction;
  switch (auction.status) {
    case "SUSPENDED":
      return "SUSPENDED";
    case "SOLD":
      return "SOLD";
    case "UNSOLD":
    case "CANCELLED":
      return "UNSOLD";
    case "AWAITING_PAYMENT":
      return viewer?.state === "WON_AWAITING_PAYMENT" ? "WON_AWAITING_PAYMENT" : "AWAITING_PAYMENT";
    case "LIVE":
      break;
  }

  if (!viewer) return "GUEST";
  if (viewer.ownAuction || viewer.blockers.includes("OWN_AUCTION")) return "OWN_AUCTION";
  if (viewer.blockers.includes("BIDDING_BANNED") || isBiddingBanned(viewer.bannedUntil, now)) return "BANNED";
  if (viewer.blockers.includes("NO_SHIPPING_ADDRESS")) return "NEEDS_ADDRESS";
  if (viewer.blockers.includes("EMAIL_NOT_VERIFIED")) return "NEEDS_EMAIL";
  return auction.buyNowAvailable && auction.bidCount === 0 ? "OPEN_BUY_NOW" : "OPEN";
}

/** สถานะที่ยังกดบิดได้ */
export function canBidInState(state: BidPanelState): boolean {
  return state === "OPEN" || state === "OPEN_BUY_NOW";
}
