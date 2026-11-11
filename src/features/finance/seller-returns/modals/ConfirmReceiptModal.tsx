import { ConfirmDialog } from "@/components/common";
import { Package } from "lucide-react";

import { formatBaht } from "../../after-sales.format";
import type { SellerReturnRequest } from "../../after-sales.types";
import { useTranslate } from "@/lib/i18n";

/**
 * Custom Confirm Receipt Modal
 */
export function ConfirmReceiptModal({
  open,
  onOpenChange,
  item,
  restock,
  onConfirm,
  loading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: SellerReturnRequest | null;
  restock: boolean;
  onConfirm: () => void;
  loading: boolean;
}) {
  const { t } = useTranslate("seller");

  if (!item) return null;

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      icon={Package}
      title={t("sellerReturns.modals.confirmReceipt.title", "ยืนยันการได้รับสินค้าคืน")}
      description={t("sellerReturns.modals.confirmReceipt.desc", "คำขอ RT-{id} · คำสั่งซื้อย่อย {orderNumber}", {
        id: item.id,
        orderNumber: item.sellerOrderNumber,
      })}
      confirmLabel={t("sellerReturns.modals.confirmReceipt.confirmButton", "ยืนยันรับสินค้าและปล่อยเงินคืน")}
      isPending={loading}
      onConfirm={onConfirm}
    >
      <div className="space-y-3.5 py-2 text-sm">
        <div className="rounded-lg bg-muted/50 p-3.5 space-y-2 border border-border">
          <p className="text-foreground">
            {t("sellerReturns.modals.confirmReceipt.body", "คุณได้ตรวจสอบพัสดุและได้รับสินค้าคืนครบถ้วนเรียบร้อยแล้ว")}
          </p>
          <div className="flex justify-between text-xs text-muted-foreground border-t border-border pt-2">
            <span>{t("sellerReturns.modals.confirmReceipt.restockLabel", "การนำกลับเข้าสต็อก:")}</span>
            <span className="font-semibold text-foreground">
              {restock
                ? t("sellerReturns.modals.confirmReceipt.restockYes", "นำการ์ดกลับเข้าสต็อกเพื่อขายต่อ")
                : t("sellerReturns.modals.confirmReceipt.restockNo", "ไม่นำกลับเข้าสต็อก")}
            </span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{t("sellerReturns.modals.confirmReceipt.refundAmountLabel", "ยอดเงินที่จะคืนผู้ซื้อ:")}</span>
            <span className="font-semibold text-primary">
              {formatBaht(item.refundAmount ?? item.sellerOrderGrandTotal)}
            </span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          {t("sellerReturns.modals.confirmReceipt.footerNote", "เมื่อยืนยันแล้ว ระบบจะปล่อยเงินคืนจากระบบ Escrow ให้แก่ผู้ซื้อโดยอัตโนมัติ")}
        </p>
      </div>
    </ConfirmDialog>
  );
}
