import { ConfirmDialog } from "@/components/common";
import { ShieldCheck } from "lucide-react";

import { formatBaht, formatBahtShort } from "../../after-sales.format";
import type { SellerReturnRequest } from "../../after-sales.types";
import { useTranslate } from "@/lib/i18n";

/**
 * Custom Approve Modal
 */
export function ApproveReturnModal({
  open,
  onOpenChange,
  item,
  amount,
  resolution,
  requireShipBack,
  onConfirm,
  loading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: SellerReturnRequest | null;
  amount: number;
  resolution: "FULL_REFUND" | "PARTIAL_REFUND";
  requireShipBack: boolean;
  onConfirm: () => void;
  loading: boolean;
}) {
  const { t } = useTranslate("seller");

  if (!item) return null;

  const sellerOrderGrandTotal = item.sellerOrderGrandTotal;
  const sellerRemainingPayout = Math.max(0, sellerOrderGrandTotal - amount);

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      icon={ShieldCheck}
      title={t("sellerReturns.modals.approve.title", "ยืนยันการอนุมัติคำขอคืนเงิน")}
      description={t("sellerReturns.modals.approve.desc", "คำขอ RT-{id} · คำสั่งซื้อย่อย {orderNumber} ({username})", {
        id: item.id,
        orderNumber: item.sellerOrderNumber,
        username: item.buyer.username,
      })}
      confirmLabel={t("sellerReturns.modals.approve.confirmButton", "ยืนยันอนุมัติคืนเงิน {amount}", {
        amount: formatBahtShort(amount),
      })}
      isPending={loading}
      onConfirm={onConfirm}
    >
      <div className="space-y-3.5 py-2 text-sm">
        <div className="rounded-lg bg-muted/50 p-3.5 space-y-2 border border-border">
          <div className="flex justify-between text-muted-foreground">
            <span>{t("sellerReturns.modals.approve.subOrderTotalLabel", "ยอดคำสั่งซื้อย่อย:")}</span>
            <span className="font-semibold text-foreground">{formatBaht(sellerOrderGrandTotal)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>{t("sellerReturns.modals.approve.refundToBuyerLabel", "ยอดคืนเงินให้ผู้ซื้อ:")}</span>
            <span className="font-bold text-primary">
              {formatBaht(amount)} ({resolution === "FULL_REFUND" ? t("sellerReturns.modals.approve.fullRefundType", "คืนเต็มจำนวน") : t("sellerReturns.modals.approve.partialRefundType", "คืนบางส่วน")})
            </span>
          </div>
          <div className="flex justify-between text-muted-foreground border-t border-border pt-2">
            <span>{t("sellerReturns.modals.approve.financialImpactLabel", "ผลต่อเงินของคุณ:")}</span>
            <span className="font-medium text-foreground">
              {resolution === "FULL_REFUND"
                ? t("sellerReturns.modals.approve.impactFull", "ไม่ได้รับเงินจากออเดอร์นี้")
                : t("sellerReturns.modals.approve.impactPartial", "ได้รับส่วนที่เหลือ ~{amount} (ก่อนหักคอมมิชชั่น)", {
                    amount: formatBaht(sellerRemainingPayout),
                  })}
            </span>
          </div>
        </div>

        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-foreground space-y-1">
          <p className="font-semibold">{t("sellerReturns.modals.approve.returnConditionTitle", "เงื่อนไขการส่งสินค้าคืน:")}</p>
          <p>
            {requireShipBack
              ? t("sellerReturns.modals.approve.conditionShipBack", "✓ ผู้ซื้อต้องจัดส่งสินค้าคืนให้คุณก่อน จึงจะได้รับเงินคืน โดยคุณจะต้องตรวจสอบสินค้าเมื่อพัสดุมาถึง")
              : t("sellerReturns.modals.approve.conditionNoShipBack", "⚡ ไม่ต้องส่งสินค้าคืน — ระบบจะเริ่มกระบวนการคืนเงินให้ผู้ซื้อทันทีหลังคุณอนุมัติ")}
          </p>
        </div>
      </div>
    </ConfirmDialog>
  );
}
