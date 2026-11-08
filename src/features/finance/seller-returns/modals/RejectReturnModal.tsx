import { ConfirmDialog } from "@/components/common";
import { AlertTriangle } from "lucide-react";


import type { SellerReturnRequest } from "../../after-sales.types";

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
  if (!item) return null;

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      icon={AlertTriangle}
      variant="destructive"
      title="ยืนยันการปฏิเสธคำขอคืนสินค้า"
      description={`คำขอ RT-${item.id} · คำสั่งซื้อย่อย ${item.sellerOrderNumber} (${item.buyer.username})`}
      confirmLabel="ยืนยันปฏิเสธคำขอ"
      isPending={loading}
      onConfirm={onConfirm}
    >
        <div className="space-y-3 py-2 text-sm">
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3.5 text-xs text-foreground space-y-2">
            <p className="font-semibold text-destructive">คำเตือนสำคัญ:</p>
            <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
              <li>การปฏิเสธคำขอไม่สามารถยกเลิกหรือแก้ไขได้ในภายหลัง</li>
              <li>ผู้ซื้อจะไม่สามารถเปิดคำขอคืนสินค้าสำหรับคำสั่งซื้อย่อยนี้ซ้ำได้อีก</li>
              <li>ระบบ Escrow จะนับเวลาถอยหลังเพื่อโอนเงินให้คุณตามกำหนดเดิม</li>
            </ul>
          </div>
          <p className="text-xs text-muted-foreground">
            กรุณาตรวจสอบหลักฐานและข้อความจากผู้ซื้ออย่างรอบคอบก่อนตัดสินใจปฏิเสธ
          </p>
        </div>
    </ConfirmDialog>
  );
}
