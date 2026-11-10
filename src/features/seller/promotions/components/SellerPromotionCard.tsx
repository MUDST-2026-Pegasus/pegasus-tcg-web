import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PromotionStatusPill } from "@/features/admin/components/PromotionBadges";
import { money, limitLabel } from "../promotions.format";
import type { SellerPromotion } from "../promotions.types";
import { CouponTicket } from "@/features/promotions/CouponTicket";
import { useTranslate } from "@/lib/i18n";

export type PromotionActionKind = "pause" | "resume" | "delete" | "admin";
export type PromotionAction = { kind: PromotionActionKind; code: SellerPromotion };

export function SellerPromotionCard({
  code, verified, onEdit, onAction, onRedemptions,
}: {
  code: SellerPromotion;
  verified: boolean;
  onEdit: () => void;
  onAction: (action: PromotionAction) => void;
  onRedemptions: () => void;
}) {
  const { t } = useTranslate("promotions");
  const staffPaused = code.status === "PAUSED" && code.pausedBy === "ADMIN";
  const neverUsed = code.usedCount === 0 && code.claimedCount === 0;
  return (
    <Card className="grid min-w-0 gap-0 rounded-xl border border-border bg-card p-3.5 shadow-none">
      <CouponTicket promotion={code} />
      <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1.5 pt-3 text-xs text-foreground/80">
        <PromotionStatusPill status={code.status} />
        <Button variant="link" size="sm" className="h-auto px-1 text-xs font-normal text-foreground/80"
          title={t("seller.sellerPromotionCard.title", "ดูการใช้โค้ด")} onClick={onRedemptions}>
          {t("seller.sellerPromotionCard.button", "ใช้แล้ว")} {code.usedCount} / {limitLabel(code.usageLimitTotal)}
        </Button>
        <span>{t("seller.sellerPromotionCard.span", "ส่วนลดรวม")} {money(code.discountTotal)}</span>
        <div className="ml-auto flex flex-wrap gap-1 max-sm:ml-0 max-sm:w-full">
          {staffPaused ? (
            <Button variant="link" size="sm" onClick={() => onAction({ kind: "admin", code })}>
              {t("seller.sellerPromotionCard.button2", "ติดต่อทีมงาน")}
            </Button>
          ) : (
            <>
              <Button variant="link" size="sm" disabled={!verified} onClick={onEdit}>{t("seller.sellerPromotionCard.button3", "แก้ไข")}</Button>
              {code.status === "ACTIVE" && !neverUsed && (
                <Button variant="link" size="sm" className="text-amber-700"
                  disabled={!verified} onClick={() => onAction({ kind: "pause", code })}>
                  {t("seller.sellerPromotionCard.button4", "หยุดชั่วคราว")}
                </Button>
              )}
              {code.status === "PAUSED" && (
                <Button variant="link" size="sm" disabled={!verified}
                  onClick={() => onAction({ kind: "resume", code })}>
                  {t("seller.sellerPromotionCard.button5", "เปิดใช้อีกครั้ง")}
                </Button>
              )}
              {(code.status === "SCHEDULED" || neverUsed) && (
                <Button variant="link" size="sm" className="text-destructive"
                  onClick={() => onAction({ kind: "delete", code })}>{t("seller.sellerPromotionCard.button6", "ลบ")}</Button>
              )}
            </>
          )}
        </div>
      </div>
      {staffPaused && (
        <div className="mt-3 rounded-lg bg-orange-50 px-3 py-2.5 text-xs text-amber-700">
          {t("seller.sellerPromotionCard.div", "ทีมงานหยุดโค้ดนี้:")} {code.pauseReason || t("seller.sellerPromotionCard.div2", "ไม่ได้ระบุเหตุผล")} {t("seller.sellerPromotionCard.div3", "กรุณาติดต่อ support@pegasus.gg ก่อนเปิดใช้อีกครั้ง")}
        </div>
      )}
    </Card>
  );
}
