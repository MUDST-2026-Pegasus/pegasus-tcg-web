import { sellerReturnStatusConfig } from "../../after-sales.format";
import type { SellerReturnRequest } from "../../after-sales.types";

/**
 * Card body for statuses with nothing to act on (Informative Status Callout).
 */
export function ReturnStatusCallout({ item }: { item: SellerReturnRequest }) {
  const statusConf = sellerReturnStatusConfig(item.status);

  return (
    <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-xs sm:text-sm text-foreground">
          สถานะคำขอ: {statusConf.label}
        </span>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        {item.status === "AWAITING_RETURN_SHIPMENT" &&
          "คำขอได้รับการอนุมัติแล้ว และกำลังรอผู้ซื้อจัดส่งสินค้าคืนพร้อมกรอกเลขพัสดุในระบบ"}
        {item.status === "APPROVED" &&
          "คำขอได้รับการอนุมัติโดยไม่ต้องส่งสินค้าคืน ระบบกำลังดำเนินการคืนเงินให้แก่ผู้ซื้อ"}
        {item.status === "RECEIVED" &&
          "คุณได้ยืนยันการรับสินค้าคืนแล้ว ระบบกำลังดำเนินการโอนเงินคืนให้แก่ผู้ซื้อ"}
        {item.status === "REFUNDED" &&
          "ระบบได้คืนเงินให้แก่ผู้ซื้อเรียบร้อยแล้ว กระบวนการคืนสินค้าเสร็จสมบูรณ์"}
        {item.status === "REJECTED" &&
          "คำขอนี้ถูกปฏิเสธ ระบบ Escrow ได้กลับสู่ขั้นตอนการนับเวลาเพื่อจ่ายเงินให้ร้านค้าตามปกติ"}
        {item.status === "CLOSED" &&
          "คำขอคืนสินค้านี้ถูกปิดการดำเนินการแล้ว"}
      </p>
      {item.returnTrackingNumber && (
        <div className="text-xs text-muted-foreground pt-1">
          เลขพัสดุส่งคืน:{" "}
          <span className="font-medium text-foreground">
            {item.returnTrackingNumber}
          </span>
        </div>
      )}
    </div>
  );
}
