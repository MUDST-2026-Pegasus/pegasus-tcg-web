import { ConfirmDialog } from "@/components/common";
import { useTranslate } from "@/lib/i18n";

type ConfirmShipDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderNumber: string;
  /** ชื่อขนส่งที่ผู้ซื้อจะเห็น เช่น "Flash Express" */
  carrierName: string;
  trackingNumber: string;
  /** "ผู้ซื้อเลือก: …" เมื่อส่งด้วยขนส่งที่ไม่ตรงกับที่ผู้ซื้อเลือก */
  buyerChoiceNote?: string | null;
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
  buyerChoiceNote,
  onConfirm,
}: ConfirmShipDialogProps) {
  const { t } = useTranslate("seller");
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("orders.confirmShip.title", "ยืนยันจัดส่ง {orderNumber}?", { orderNumber })}
      description={t("orders.confirmShip.description", "ระบบจะส่งเลขพัสดุนี้ให้ผู้ซื้อทันที หลังยืนยันแล้วยกเลิกคำสั่งซื้อไม่ได้ และแก้ขนส่งหรือเลขพัสดุไม่ได้")}
      confirmLabel={t("orders.confirmShip.confirm", "ยืนยันจัดส่ง")}
      cancelLabel={t("orders.confirmShip.back", "กลับไปแก้")}
      onConfirm={() => {
        onOpenChange(false);
        onConfirm();
      }}
    >
      <div className="flex flex-col gap-2 rounded-lg bg-neutral-50 p-3.5 text-xs">
        <dl className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-gray-500">{t("orders.shipping.carrier", "บริษัทขนส่ง")}</dt>
          <dd className="font-medium text-foreground">{carrierName}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-gray-500">{t("orders.shipping.tracking", "เลขพัสดุ")}</dt>
          <dd className="font-medium break-all text-foreground">{trackingNumber}</dd>
        </div>
      </dl>
      {buyerChoiceNote ? <p className="text-[#b45309]">{buyerChoiceNote}</p> : null}
      </div>
    </ConfirmDialog>
  );
}
