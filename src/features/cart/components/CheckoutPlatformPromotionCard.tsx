import { Loader2, Ticket } from "lucide-react";
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
    <Card className="checkout-panel gap-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-[13px] font-semibold">โค้ดส่วนลด Pegasus</h2>
        <button
          type="button"
          className="checkout-link text-xs font-medium"
          onClick={onOpenPicker}
        >
          ดูทั้งหมด ({availableCount})
        </button>
      </div>

      {selectedCode && (
        <div className="flex items-center justify-between rounded-lg border border-dashed border-primary/40 bg-[#f0f7fc] px-3 py-2 text-xs text-primary">
          <div className="flex min-w-0 items-center gap-2">
            <Ticket className="size-4 shrink-0 text-primary" />
            <div className="min-w-0">
              <strong className="block truncate font-semibold">{selectedCode}</strong>
              {selectedPromotion && (
                <span className="block truncate text-[11px] text-muted-foreground">
                  {formatPromotionRuleSummary(selectedPromotion)}
                </span>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {discount > 0 && (
              <span className="font-semibold">− {checkoutMoney(discount)}</span>
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
          className="h-9 uppercase text-xs"
          disabled={loading}
          aria-invalid={!!error}
          aria-describedby={error ? "pegasus-code-error" : undefined}
        />
        <Button
          type="submit"
          variant="secondary"
          size="sm"
          className="h-9 shrink-0 px-3"
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
