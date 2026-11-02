import { Loader2 } from "lucide-react";
import appliedTicket from "@/assets/promotions/applied-ticket.svg";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
    <Card className="gap-3 rounded-[var(--radius-card)] border border-border bg-card px-5 py-[18px] shadow-none ring-0">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">โค้ดส่วนลด Pegasus</h2>
        <button
          type="button"
          className="text-[13px] font-medium text-promotion-pegasus"
          onClick={onOpenPicker}
        >
          ดูทั้งหมด ({availableCount})
        </button>
      </div>

      {selectedCode && (
        <div className="flex items-center justify-between gap-2 rounded-md border border-dashed border-promotion-selected-border bg-promotion-selected px-3 py-2.5 text-promotion-pegasus">
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
            <button
              type="button"
              aria-label="นำโค้ด Pegasus ออก"
              className="flex size-5 cursor-pointer items-center justify-center rounded-full text-muted-foreground hover:bg-primary/10 hover:text-foreground"
              onClick={onRemoveCode}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          onApplyTypedCode();
        }}
      >
        <Input
          aria-label="กรอกโค้ด Pegasus"
          value={typedCode}
          maxLength={20}
          onChange={(event) => onTypedCodeChange(event.target.value)}
          placeholder="กรอกโค้ดอื่น"
          className="h-10 rounded-sm border-border bg-white px-3 py-[9px] text-[13px] leading-5 uppercase placeholder:text-promotion-muted focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
          disabled={loading}
          aria-invalid={!!error}
          aria-describedby={error ? "pegasus-code-error" : undefined}
        />
        <Button
          type="submit"
          className="h-10 shrink-0 rounded-sm px-[14px] text-[13px] font-semibold disabled:bg-promotion-control-disabled disabled:text-promotion-muted disabled:opacity-100"
          disabled={!typedCode.trim() || loading}
        >
          {loading && typedCode ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            "ใช้โค้ด"
          )}
        </Button>
      </form>
      {error && (
        <p id="pegasus-code-error" role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </Card>
  );
}
