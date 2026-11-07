import { useLanguage } from "@/lib/language";
import { CouponTicket } from "@/features/promotions/CouponTicket";
import type { AdminPromotionInput } from "../promotions.types";

/** Figma PRM / Claim Ticket — buyer preview of the current admin form values. */
export function ClaimTicketPreview({ promotion }: { promotion: AdminPromotionInput }) {
  useLanguage();
  return <CouponTicket promotion={promotion} preview />;
}
