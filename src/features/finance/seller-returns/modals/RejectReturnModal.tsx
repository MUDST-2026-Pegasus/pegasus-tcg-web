import { ConfirmDialog } from "@/components/common";
import { AlertTriangle } from "lucide-react";

import type { SellerReturnRequest } from "../../after-sales.types";
import { useTranslate } from "@/lib/i18n";

/**
 * Custom Reject Modal (Destructive)
 */
export function RejectReturnModal({
  open,
  onOpenChange,
  item,
  onConfirm,
  loading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: SellerReturnRequest | null;
  onConfirm: () => void;
  loading: boolean;
}) {
  const { t } = useTranslate("seller");

  if (!item) return null;

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      icon={AlertTriangle}
      variant="destructive"
      title={t("sellerReturns.modals.reject.title", "ยืนยันการปฏิเสธคำขอคืนสินค้า")}
      description={t("sellerReturns.modals.reject.desc", "คำขอ RT-{id} · คำสั่งซื้อย่อย {orderNumber} ({username})", {
        id: item.id,
        orderNumber: item.sellerOrderNumber,
        username: item.buyer.username,
      })}
      confirmLabel={t("sellerReturns.modals.reject.confirmButton", "ยืนยันปฏิเสธคำขอ")}
      isPending={loading}
      onConfirm={onConfirm}
    >
      <div className="space-y-3 py-2 text-sm">
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3.5 text-xs text-foreground space-y-2">
          <p className="font-semibold text-destructive">{t("sellerReturns.modals.reject.warningTitle", "คำเตือนสำคัญ:")}</p>
          <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
            <li>{t("sellerReturns.modals.reject.warning1", "การปฏิเสธคำขอไม่สามารถยกเลิกหรือแก้ไขได้ในภายหลัง")}</li>
            <li>{t("sellerReturns.modals.reject.warning2", "ผู้ซื้อจะไม่สามารถเปิดคำขอคืนสินค้าสำหรับคำสั่งซื้อย่อยนี้ซ้ำได้อีก")}</li>
            <li>{t("sellerReturns.modals.reject.warning3", "ระบบ Escrow จะนับเวลาถอยหลังเพื่อโอนเงินให้คุณตามกำหนดเดิม")}</li>
          </ul>
        </div>
        <p className="text-xs text-muted-foreground">
          {t("sellerReturns.modals.reject.checkCarefully", "กรุณาตรวจสอบหลักฐานและข้อความจากผู้ซื้ออย่างรอบคอบก่อนตัดสินใจปฏิเสธ")}
        </p>
      </div>
    </ConfirmDialog>
  );
}
