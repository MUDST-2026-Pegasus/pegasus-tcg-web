import { sellerReturnStatusConfig } from "../../after-sales.format";
import type { SellerReturnRequest } from "../../after-sales.types";
import { useTranslate } from "@/lib/i18n";

/**
 * Card body for statuses with nothing to act on (Informative Status Callout).
 */
export function ReturnStatusCallout({ item }: { item: SellerReturnRequest }) {
  const { t } = useTranslate("seller");
  const statusConf = sellerReturnStatusConfig(item.status, t);

  return (
    <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-xs sm:text-sm text-foreground">
          {t("sellerReturns.statusCallout.title", "สถานะคำขอ: {status}", { status: statusConf.label })}
        </span>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        {item.status === "AWAITING_RETURN_SHIPMENT" &&
          t("sellerReturns.statusCallout.awaitingReturnShipment", "คำขอได้รับการอนุมัติแล้ว และกำลังรอผู้ซื้อจัดส่งสินค้าคืนพร้อมกรอกเลขพัสดุในระบบ")}
        {item.status === "APPROVED" &&
          t("sellerReturns.statusCallout.approved", "คำขอได้รับการอนุมัติโดยไม่ต้องส่งสินค้าคืน ระบบกำลังดำเนินการคืนเงินให้แก่ผู้ซื้อ")}
        {item.status === "RECEIVED" &&
          t("sellerReturns.statusCallout.received", "คุณได้ยืนยันการรับสินค้าคืนแล้ว ระบบกำลังดำเนินการโอนเงินคืนให้แก่ผู้ซื้อ")}
        {item.status === "REFUNDED" &&
          t("sellerReturns.statusCallout.refunded", "ระบบได้คืนเงินให้แก่ผู้ซื้อเรียบร้อยแล้ว กระบวนการคืนสินค้าเสร็จสมบูรณ์")}
        {item.status === "REJECTED" &&
          t("sellerReturns.statusCallout.rejected", "คำขอนี้ถูกปฏิเสธ ระบบ Escrow ได้กลับสู่ขั้นตอนการนับเวลาเพื่อจ่ายเงินให้ร้านค้าตามปกติ")}
        {item.status === "CLOSED" &&
          t("sellerReturns.statusCallout.closed", "คำขอคืนสินค้านี้ถูกปิดการดำเนินการแล้ว")}
      </p>
      {item.returnTrackingNumber && (
        <div className="text-xs text-muted-foreground pt-1">
          {t("sellerReturns.statusCallout.trackingLabel", "เลขพัสดุส่งคืน: ")}
          <span className="font-medium text-foreground">
            {item.returnTrackingNumber}
          </span>
        </div>
      )}
    </div>
  );
}
