import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

type ConfirmShipDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderNumber: string;
  /** ชื่อขนส่งที่ผู้ซื้อจะเห็น เช่น "Flash Express" */
  carrierName: string;
  trackingNumber: string;
  onConfirm: () => void;
};

/**
 * ถามซ้ำก่อนยืนยันจัดส่ง — ใช้ทั้งการ์ดในหน้ารายการและหน้ารายละเอียด
 *
 * ส่งแล้วย้อนไม่ได้: ยกเลิกคำสั่งซื้อไม่ได้อีก และ backend ไม่มีทางแก้ขนส่งหรือเลขพัสดุ
 * (`POST .../ship` รับจาก PAID/PREPARING เท่านั้น) ผู้ซื้อได้เลขนี้ทันทีที่ยืนยัน
 * ปุ่มแรกคือ "กลับไปแก้" โฟกัสจึงตกที่ปุ่มนี้ กด Enter ค้างไว้ก็ไม่ส่งของโดยไม่ตั้งใจ
 */
export function ConfirmShipDialog({
  open,
  onOpenChange,
  orderNumber,
  carrierName,
  trackingNumber,
  onConfirm,
}: ConfirmShipDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>ยืนยันจัดส่ง {orderNumber}?</AlertDialogTitle>
          <AlertDialogDescription>
            ระบบจะส่งเลขพัสดุนี้ให้ผู้ซื้อทันที หลังยืนยันแล้วยกเลิกคำสั่งซื้อไม่ได้
            และแก้ขนส่งหรือเลขพัสดุไม่ได้
          </AlertDialogDescription>
        </AlertDialogHeader>

        <dl className="flex flex-col gap-2 rounded-lg bg-neutral-50 p-3.5 text-xs">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-gray-500">บริษัทขนส่ง</dt>
            <dd className="font-medium text-foreground">{carrierName}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-gray-500">เลขพัสดุ</dt>
            <dd className="font-medium break-all text-foreground">{trackingNumber}</dd>
          </div>
        </dl>

        <AlertDialogFooter>
          <AlertDialogCancel>กลับไปแก้</AlertDialogCancel>
          <Button
            onClick={() => {
              onOpenChange(false);
              onConfirm();
            }}
          >
            ยืนยันจัดส่ง
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
