import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PromotionStatusPill } from "@/features/admin/components/PromotionBadges";
import { money, limitLabel } from "../promotions.format";
import type { SellerPromotion } from "../promotions.types";
import { CouponTicket } from "./CouponTicket";

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
  const staffPaused = code.status === "PAUSED" && code.pausedBy === "ADMIN";
  const neverUsed = code.usedCount === 0 && code.claimedCount === 0;
  return (
    <Card className="grid min-w-0 gap-0 rounded-xl border border-border bg-card p-3.5 shadow-none">
      <CouponTicket promotion={code} />
      <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1.5 pt-3 text-xs text-foreground/80">
        <PromotionStatusPill status={code.status} />
        <Button variant="link" size="sm" onClick={onRedemptions}>
          ใช้แล้ว {code.usedCount} / {limitLabel(code.usageLimitTotal)}
        </Button>
        {code.claimable && <span>เก็บแล้ว {code.claimedCount} / {limitLabel(code.claimLimit)}</span>}
        <span>ส่วนลดรวม {money(code.discountTotal)}</span>
        <div className="ml-auto flex flex-wrap gap-1 max-sm:ml-0 max-sm:w-full">
          {staffPaused ? (
            <Button variant="link" size="sm" onClick={() => onAction({ kind: "admin", code })}>
              ติดต่อทีมงาน
            </Button>
          ) : (
            <>
              <Button variant="link" size="sm" disabled={!verified} onClick={onEdit}>แก้ไข</Button>
              {code.status === "ACTIVE" && !neverUsed && (
                <Button variant="link" size="sm" className="text-amber-700"
                  disabled={!verified} onClick={() => onAction({ kind: "pause", code })}>
                  หยุดชั่วคราว
                </Button>
              )}
              {code.status === "PAUSED" && (
                <Button variant="link" size="sm" disabled={!verified}
                  onClick={() => onAction({ kind: "resume", code })}>
                  เปิดใช้อีกครั้ง
                </Button>
              )}
              {(code.status === "SCHEDULED" || neverUsed) && (
                <Button variant="link" size="sm" className="text-destructive"
                  onClick={() => onAction({ kind: "delete", code })}>ลบ</Button>
              )}
            </>
          )}
        </div>
      </div>
      {staffPaused && (
        <div className="mt-3 rounded-lg bg-orange-50 p-2.5 text-xs text-amber-700">
          ทีมงานหยุดโค้ดนี้: {code.pauseReason || "โปรดติดต่อทีมงาน"}
        </div>
      )}
    </Card>
  );
}
