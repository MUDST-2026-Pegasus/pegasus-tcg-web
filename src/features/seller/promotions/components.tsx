import type { ReactNode } from "react";
import { PromotionStatusPill } from "./PromotionStatusPill";
import { PromotionTicketFrame } from "./PromotionTicketFrame";
import { money, thaiDate } from "./format";
import type { SellerPromotion, SellerPromotionInput } from "./types";
export { PromotionStatusPill };

export function CouponTicket({ promotion, shopName, preview = false }: { promotion: SellerPromotion | SellerPromotionInput; shopName?: string; preview?: boolean }) {
  const value = promotion.discountType === "PERCENT" ? `${promotion.discountValue || 0}%` : money(promotion.discountValue || 0);
  const left = "usedCount" in promotion ? promotion.usageLimitTotal == null ? "ไม่จำกัด" : `${Math.max(0, promotion.usageLimitTotal - promotion.usedCount)} สิทธิ์` : promotion.usageLimitTotal == null ? "ไม่จำกัด" : `${promotion.usageLimitTotal} สิทธิ์`;
  return <PromotionTicketFrame className="seller-coupon-ticket" stubClassName="seller-coupon-stub" bodyClassName="seller-coupon-body" scallopOffsets={[-29, -11, 7, 25]} scallopClassName="seller-coupon-scallop" stub={<><span>ลด</span><strong>{value}</strong><small>SHOP</small></>} body={<><div className="seller-coupon-title"><strong>{promotion.code || "YOURCODE"}</strong>{preview && <span className="seller-coupon-radio" aria-hidden />}</div><p>ขั้นต่ำ {money(promotion.minSpend || 0)} · {shopName ? `เฉพาะสินค้าร้าน ${shopName}` : "เฉพาะสินค้าร้าน"}</p><small>ใช้ได้ถึง {promotion.endsAt ? thaiDate(promotion.endsAt) : "—"} · เหลือ {left}</small></>} />;
}

export function SellerField({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: ReactNode }) {
  return <div className="seller-promo-field"><span>{label}</span>{children}{error ? <small role="alert" className="seller-promo-error">{error}</small> : hint && <small>{hint}</small>}</div>;
}
