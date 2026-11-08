import { ConfirmDialog } from "@/components/common";
import { Trash2 } from "lucide-react";

import { hasErrorCode } from "@/lib/api";

import { catalogErrorMessage, productTitle } from "../catalog.format";
import type { CatalogProduct } from "../catalog.types";

type DeleteProductDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: CatalogProduct;
  isPending: boolean;
  error: unknown;
  onConfirm: () => void;
};

/**
 * ลบสินค้าที่สร้างผิดหรือซ้ำ — variant รูป และ Abilities & Attacks หายไปด้วย กู้คืนไม่ได้
 * ตัวที่มีคนใช้แล้ว backend ตอบ `PRODUCT_IN_USE` → ปิดปุ่มยืนยัน ให้ไปปิดใช้งานแทน
 */
export function DeleteProductDialog({
  open,
  onOpenChange,
  product,
  isPending,
  error,
  onConfirm,
}: DeleteProductDialogProps) {
  const inUse = hasErrorCode(error, "PRODUCT_IN_USE");

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      icon={Trash2}
      variant="destructive"
      title={`ลบ ${productTitle(product)}?`}
      description="variant รูป และ Abilities & Attacks ของสินค้านี้จะถูกลบไปด้วย กู้คืนไม่ได้ · ลบได้เฉพาะสินค้าที่ยังไม่มีประกาศขาย คำสั่งซื้อ หรือคอลเลกชันอ้างถึง"
      confirmLabel="ลบสินค้า"
      cancelLabel={inUse ? "ปิด" : "ยกเลิก"}
      isPending={isPending}
      confirmDisabled={inUse}
      error={error ? catalogErrorMessage(error, "ลบสินค้าไม่สำเร็จ ลองใหม่อีกครั้ง") : null}
      onConfirm={onConfirm}
    />
  );
}
