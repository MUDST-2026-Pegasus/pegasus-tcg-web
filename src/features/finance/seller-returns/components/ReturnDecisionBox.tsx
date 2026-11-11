import { Info } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

import { formatBahtShort } from "../../after-sales.format";
import { validatePartialRefundAmount } from "../../after-sales.helpers";
import type { SellerReturnRequest } from "../../after-sales.types";
import { getRefundAmount, type ReturnDraft } from "../return-draft";
import { RefundAmountField } from "./RefundAmountField";
import { useTranslate } from "@/lib/i18n";

/**
 * REQUESTED decision box: full/partial refund, amount, ship-back, approve/reject.
 */
export function ReturnDecisionBox({
  item,
  draft,
  isBusy,
  onDraftChange,
  onApprove,
  onReject,
}: {
  item: SellerReturnRequest;
  draft: ReturnDraft;
  isBusy: boolean;
  onDraftChange: (patch: Partial<ReturnDraft>) => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  const { t } = useTranslate("seller");
  const { resolution, partialAmount, shipBack } = draft;

  // Validation for partial refund
  const partialVal = validatePartialRefundAmount(partialAmount, item.sellerOrderGrandTotal, t);
  const isPartialValid = resolution === "FULL_REFUND" || partialVal.valid;
  const activeRefundAmount = getRefundAmount(item, draft);

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-4 sm:p-5 shadow-2xs">
      <div className="text-sm font-bold text-foreground">
        {t("sellerReturns.decision.title", "ตัดสินคำขอ")}
      </div>

      {/* Radio Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div
          role="button"
          tabIndex={0}
          onClick={() => onDraftChange({ resolution: "FULL_REFUND" })}
          className={cn(
            "flex items-start gap-3 rounded-xl border p-3.5 cursor-pointer transition-all",
            resolution === "FULL_REFUND"
              ? "border-primary bg-primary/5 ring-1 ring-primary/30"
              : "border-border hover:border-border/80 bg-card"
          )}
        >
          <div
            className={cn(
              "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
              resolution === "FULL_REFUND"
                ? "border-primary"
                : "border-muted-foreground"
            )}
          >
            {resolution === "FULL_REFUND" && (
              <div className="h-2 w-2 rounded-full bg-primary" />
            )}
          </div>
          <div className="space-y-0.5">
            <div className="text-xs sm:text-sm font-semibold text-foreground">
              {t("sellerReturns.decision.fullRefund", "คืนเต็มจำนวน")}
            </div>
            <div className="text-[11px] text-muted-foreground">
              {t("sellerReturns.decision.fullRefundDesc", "{amount} · เท่ากับยอดออเดอร์ย่อย", {
                amount: formatBahtShort(item.sellerOrderGrandTotal),
              })}
            </div>
          </div>
        </div>

        <div
          role="button"
          tabIndex={0}
          onClick={() => onDraftChange({ resolution: "PARTIAL_REFUND" })}
          className={cn(
            "flex items-start gap-3 rounded-xl border p-3.5 cursor-pointer transition-all",
            resolution === "PARTIAL_REFUND"
              ? "border-primary bg-primary/5 ring-1 ring-primary/30"
              : "border-border hover:border-border/80 bg-card"
          )}
        >
          <div
            className={cn(
              "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
              resolution === "PARTIAL_REFUND"
                ? "border-primary"
                : "border-muted-foreground"
            )}
          >
            {resolution === "PARTIAL_REFUND" && (
              <div className="h-2 w-2 rounded-full bg-primary" />
            )}
          </div>
          <div className="space-y-0.5">
            <div className="text-xs sm:text-sm font-semibold text-foreground">
              {t("sellerReturns.decision.partialRefund", "คืนบางส่วน")}
            </div>
            <div className="text-[11px] text-muted-foreground">
              {t("sellerReturns.decision.partialRefundDesc", "ระบุยอดที่น้อยกว่า {amount}", {
                amount: formatBahtShort(item.sellerOrderGrandTotal),
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Amount Input Row */}
      <RefundAmountField
        item={item}
        resolution={resolution}
        partialAmount={partialAmount}
        partialVal={partialVal}
        onPartialAmountChange={(value) => onDraftChange({ partialAmount: value })}
      />

      {/* Ship Back Toggle Switch */}
      <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-3">
        <Switch
          id={`shipBack-${item.id}`}
          checked={shipBack}
          onCheckedChange={(checked) => onDraftChange({ shipBack: checked })}
        />
        <div className="space-y-0.5">
          <label
            htmlFor={`shipBack-${item.id}`}
            className="text-xs sm:text-sm font-semibold text-foreground cursor-pointer"
          >
            {t("sellerReturns.decision.shipBackLabel", "ให้ผู้ซื้อส่งสินค้าคืนก่อนคืนเงิน")}
          </label>
          <p className="text-[11px] text-muted-foreground leading-normal">
            {t("sellerReturns.decision.shipBackDesc", "ปิดไว้ถ้าไม่ต้องการรับของคืน เช่น ผู้ซื้อไม่ได้รับสินค้า — ระบบจะสร้างรายการคืนเงินทันทีที่อนุมัติ")}
          </p>
        </div>
      </div>

      {/* Financial Outcome Notice Banner & Buttons */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-2 border-t border-border">
        <div className="flex items-start gap-1.5 text-xs text-muted-foreground max-w-sm">
          <Info className="size-4 shrink-0 text-muted-foreground mt-0.5" />
          <span>
            {t("sellerReturns.decision.yourOutcome", "ผลต่อคุณ: ")}
            <strong className="font-semibold text-foreground">
              {resolution === "FULL_REFUND"
                ? t(
                    "sellerReturns.decision.outcomeFullRefund",
                    "ไม่ได้รับเงินจากออเดอร์นี้ {shipBack, select, true {· การ์ดกลับเข้าสต็อกให้ตอนยืนยันรับของ} other {}}",
                    { shipBack: String(shipBack) }
                  )
                : t(
                    "sellerReturns.decision.outcomePartialRefund",
                    "ได้รับส่วนต่าง {amount} หลังหักค่าคอมมิชชั่น",
                    { amount: formatBahtShort(Math.max(0, item.sellerOrderGrandTotal - activeRefundAmount)) }
                  )}
            </strong>
          </span>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            disabled={isBusy}
            onClick={onReject}
            className="border-destructive/40 text-destructive hover:bg-destructive/10 text-xs font-medium"
          >
            {t("sellerReturns.decision.rejectButton", "ปฏิเสธคำขอ")}
          </Button>
          <Button
            size="sm"
            disabled={isBusy || !isPartialValid || activeRefundAmount <= 0}
            onClick={onApprove}
            className="text-xs font-semibold px-4 shadow-xs"
          >
            {t("sellerReturns.decision.approveButton", "อนุมัติคืนเงิน {amount}", {
              amount: formatBahtShort(activeRefundAmount),
            })}
          </Button>
        </div>
      </div>
    </div>
  );
}
