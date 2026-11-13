import { ConfirmDialog } from "@/components/common";
import { Trash2 } from "lucide-react";

import { useDeleteAddress } from "../address.queries";
import type { Address } from "../address.types";
import { translateError, useTranslate } from "@/lib/i18n";

type DeleteAddressDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  address?: Address;
};

/** ลบแล้วกู้จากหน้านี้ไม่ได้ (ฝั่ง backend เป็น soft delete แต่ไม่มี UI คืนค่า) จึงต้องถามก่อน */
export function DeleteAddressDialog({
  open,
  onOpenChange,
  address,
}: DeleteAddressDialogProps) {
  const { t } = useTranslate("buyer");
  const deleteAddress = useDeleteAddress();

  // hook อยู่ในตัวนอกที่ไม่ถูก unmount ตอนปิด ต้องล้าง error เอง
  // ไม่งั้นเปิดกล่องรอบหน้าจะเห็นข้อความของรอบที่แล้วค้างอยู่
  const handleOpenChange = (next: boolean) => {
    if (!next) {
      deleteAddress.reset();
    }
    onOpenChange(next);
  };

  const onConfirm = async () => {
    if (!address) {
      return;
    }
    try {
      await deleteAddress.mutateAsync(address.id);
      handleOpenChange(false);
    } catch {
      // ข้อความอยู่ใน `deleteAddress.error` แล้ว ปล่อยกล่องเปิดไว้ให้ลองใหม่
    }
  };

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={handleOpenChange}
      icon={Trash2}
      variant="destructive"
      title={t("account.address.deleteTitle", "ลบที่อยู่นี้?")}
      description={
        <>
          {address?.recipientName} · {address?.line1}
          <br />
          {t("account.address.deleteHint", "คำสั่งซื้อเดิมเก็บสำเนาที่อยู่ไว้แล้ว จึงไม่เปลี่ยนตาม")}
        </>
      }
      confirmLabel={t("account.address.delete", "ลบ")}
      cancelLabel={t("account.orders.cancel", "ยกเลิก")}
      isPending={deleteAddress.isPending}
      error={deleteAddress.isError ? translateError(deleteAddress.error, t("account.address.deleteFailed", "ลบที่อยู่นี้ไม่สำเร็จ")) : null}
      onConfirm={() => void onConfirm()}
    />
  );
}
