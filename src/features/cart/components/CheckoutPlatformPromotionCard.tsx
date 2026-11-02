import { CHECKOUT_CARD_CLASS } from "@/features/cart/checkout.styles";
import appliedTicket from "@/assets/promotions/applied-ticket.svg";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PromotionCodeForm } from "@/features/promotions/PromotionCodeForm";
import { checkoutMoney, formatPromotionRuleSummary } from "../checkout.format";
import type { AvailablePromotion } from "../promotions.types";

interface CheckoutPlatformPromotionCardProps {
  selectedCode: string | null;
  selectedPromotion: AvailablePromotion | null;
  discount: number;
  availableCount: number;
  typedCode: string;
  error: string | null;
  loading: boolean;
  onTypedCodeChange: (code: string) => void;
  onApplyTypedCode: () => void;
  onRemoveCode: () => void;
  onOpenPicker: () => void;
}

export function CheckoutPlatformPromotionCard({
  selectedCode,
  selectedPromotion,
  discount,
  availableCount,
  typedCode,
  error,
  loading,
  onTypedCodeChange,
  onApplyTypedCode,
  onRemoveCode,
  onOpenPicker,
}: CheckoutPlatformPromotionCardProps) {
  return (
    <Card className={CHECKOUT_CARD_CLASS}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">โค้ดส่วนลด Pegasus</h2>
        <Button type="button" variant="link" className="h-auto p-0 text-[13px]"
          onClick={onOpenPicker}>
          ดูโค้ดทั้งหมด ({availableCount})
        </Button>
      </div>

      {selectedCode && (
        <div className="flex items-center justify-between gap-2 rounded-md border border-dashed border-primary bg-primary/5 px-3 py-2.5 text-primary">
          <div className="flex min-w-0 items-center gap-2.5">
            <img src={appliedTicket} alt="" className="size-[18px] shrink-0" />
            <div className="min-w-0">
              <strong className="block truncate text-[13px] font-bold tracking-[0.03em]">
                {selectedCode}
              </strong>
              {selectedPromotion && (
                <span className="block truncate text-[11px] text-muted-foreground">
                  {formatPromotionRuleSummary(selectedPromotion)}
                </span>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {discount > 0 && (
              <span className="text-sm font-bold">− {checkoutMoney(discount)}</span>
            )}
            <Button
              type="button"
              variant="ghost"
              aria-label="นำโค้ด Pegasus ออก"
              className="size-5 rounded-full p-0 text-muted-foreground"
              onClick={onRemoveCode}
            >
              ✕
            </Button>
          </div>
        </div>
      )}

      <PromotionCodeForm id="pegasus-code" label="กรอกโค้ด Pegasus"
        showLabel={false} value={typedCode} onChange={onTypedCodeChange}
        onSubmit={onApplyTypedCode} error={error} loading={loading}
        placeholder="กรอกโค้ดอื่น" />
    </Card>
  );
}
