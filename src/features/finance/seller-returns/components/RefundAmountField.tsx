import { Lock } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { formatBaht, formatBahtShort } from "../../after-sales.format";
import {
  calculatePresetPercentage,
  calculateReturnedCardsTotal,
} from "../../after-sales.helpers";
import type { SellerReturnRequest } from "../../after-sales.types";
import type { ReturnResolution } from "../return-draft";

/**
 * Refund amount row: locked for a full refund, editable with presets for a partial one.
 */
export function RefundAmountField({
  item,
  resolution,
  partialAmount,
  partialVal,
  onPartialAmountChange,
}: {
  item: SellerReturnRequest;
  resolution: ReturnResolution;
  partialAmount: string;
  partialVal: { valid: boolean; error?: string };
  onPartialAmountChange: (value: string) => void;
}) {
  const returnedCardsTotal = calculateReturnedCardsTotal(item.items);

  return (
    <div className="space-y-2">
      <label
        htmlFor={`amount-${item.id}`}
        className="text-xs font-semibold text-foreground"
      >
        ยอดคืนเงิน
      </label>

      {resolution === "FULL_REFUND" ? (
        <div className="flex items-center gap-2">
          <div className="relative max-w-xs flex-1">
            <Input
              id={`amount-${item.id}`}
              readOnly
              disabled
              value={formatBaht(item.sellerOrderGrandTotal)}
              className="bg-muted text-muted-foreground font-medium text-xs sm:text-sm"
            />
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Lock className="size-3.5" />
            <span>ล็อคไว้เมื่อคืนเต็มจำนวน</span>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="relative max-w-xs">
            <Input
              id={`amount-${item.id}`}
              type="number"
              step="0.01"
              min="0.01"
              max={item.sellerOrderGrandTotal - 0.01}
              placeholder="0.00"
              value={partialAmount}
              onChange={(e) => onPartialAmountChange(e.target.value)}
              className={cn(
                "text-xs sm:text-sm font-medium",
                !partialVal.valid && partialAmount
                  ? "border-destructive focus-visible:ring-destructive/30"
                  : ""
              )}
            />
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            <span className="text-[11px] text-muted-foreground">ลัดยอด:</span>
            <button
              type="button"
              onClick={() =>
                onPartialAmountChange(
                  String(calculatePresetPercentage(25, item.sellerOrderGrandTotal))
                )
              }
              className="rounded-md border border-border bg-muted/60 px-2 py-0.5 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              25% ({formatBahtShort(calculatePresetPercentage(25, item.sellerOrderGrandTotal))})
            </button>
            <button
              type="button"
              onClick={() =>
                onPartialAmountChange(
                  String(calculatePresetPercentage(50, item.sellerOrderGrandTotal))
                )
              }
              className="rounded-md border border-border bg-muted/60 px-2 py-0.5 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              50% ({formatBahtShort(calculatePresetPercentage(50, item.sellerOrderGrandTotal))})
            </button>
            {returnedCardsTotal < item.sellerOrderGrandTotal && returnedCardsTotal > 0 && (
              <button
                type="button"
                onClick={() => onPartialAmountChange(String(returnedCardsTotal))}
                className="rounded-md border border-border bg-muted/60 px-2 py-0.5 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                ตามราคาสินค้าที่ขอคืน ({formatBahtShort(returnedCardsTotal)})
              </button>
            )}
          </div>

          {!partialVal.valid && partialAmount && (
            <p className="text-xs font-medium text-destructive">
              {partialVal.error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
