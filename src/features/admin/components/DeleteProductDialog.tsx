import { ConfirmDialog } from "@/components/common";
import { Trash2 } from "lucide-react";

import { hasErrorCode } from "@/lib/api";

import { catalogErrorMessage, productTitle } from "../catalog.format";
import type { CatalogProduct } from "../catalog.types";
import { useTranslate } from "@/lib/i18n";

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
  const { t } = useTranslate("admin");
  const inUse = hasErrorCode(error, "PRODUCT_IN_USE");

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      icon={Trash2}
      variant="destructive"
      title={t("catalog.products.deleteTitle", "ลบ {name}?", { name: productTitle(product) })}
      description={t("catalog.products.deleteDescription", "variant รูป และ Abilities & Attacks ของสินค้านี้จะถูกลบไปด้วย กู้คืนไม่ได้ · ลบได้เฉพาะสินค้าที่ยังไม่มีประกาศขาย คำสั่งซื้อ หรือคอลเลกชันอ้างถึง")}
      confirmLabel={t("catalog.products.delete", "ลบสินค้า")}
      cancelLabel={inUse ? t("catalog.form.close", "ปิด") : t("actions.cancel", "ยกเลิก", { ns: "common" })}
      isPending={isPending}
      confirmDisabled={inUse}
      error={error ? catalogErrorMessage(error, t("catalog.products.deleteFailed", "ลบสินค้าไม่สำเร็จ ลองใหม่อีกครั้ง")) : null}
      onConfirm={onConfirm}
    />
  );
}
