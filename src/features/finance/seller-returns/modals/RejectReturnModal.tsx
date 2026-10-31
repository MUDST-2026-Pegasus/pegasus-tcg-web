import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg text-destructive">
            <AlertTriangle className="size-5 text-destructive" />
            ยืนยันการปฏิเสธคำขอคืนสินค้า
          </DialogTitle>
          <DialogDescription>
            คำขอ RT-{item.id} · คำสั่งซื้อย่อย {item.sellerOrderNumber} ({item.buyer.username})
          </DialogDescription>
        </DialogHeader>

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

        <DialogFooter className="gap-2 sm:gap-0">
          <DialogClose render={<Button variant="outline" disabled={loading} />}>
            ยกเลิก
          </DialogClose>
          <Button
            variant="destructive"
            disabled={loading}
            onClick={onConfirm}
          >
            {loading ? "กำลังดำเนินการ..." : "ยืนยันปฏิเสธคำขอ"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
