import { Trash2 } from "lucide-react";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
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
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="text-destructive">
            <Trash2 />
          </AlertDialogMedia>
          <AlertDialogTitle>ลบ {productTitle(product)}?</AlertDialogTitle>
          <AlertDialogDescription>
            variant รูป และ Abilities &amp; Attacks ของสินค้านี้จะถูกลบไปด้วย
            กู้คืนไม่ได้ · ลบได้เฉพาะสินค้าที่ยังไม่มีประกาศขาย คำสั่งซื้อ
            หรือคอลเลกชันอ้างถึง
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error ? (
          <Alert variant="destructive">
            <AlertDescription>
              {catalogErrorMessage(error, "ลบสินค้าไม่สำเร็จ ลองใหม่อีกครั้ง")}
            </AlertDescription>
          </Alert>
        ) : null}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            {inUse ? "ปิด" : "ยกเลิก"}
          </AlertDialogCancel>
          <Button
            variant="destructive"
            disabled={isPending || inUse}
            onClick={onConfirm}
          >
            {isPending && <Spinner data-icon="inline-start" />}
            ลบสินค้า
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
