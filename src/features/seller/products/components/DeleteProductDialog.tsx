import { ImageIcon, Trash2, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";

import type { ProductRow, ProductsData } from "../products.types";

type DeleteProductDialogProps = ProductsData["deleteDialog"] & {
  /** สินค้าที่กำลังจะลบ — เก็บไว้แม้ปิด dialog แล้ว เนื้อหาจะได้ไม่หายระหว่าง animation ปิด */
  product: ProductRow | null;
  unit: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUnpublish: () => void;
  onConfirm: () => void;
};

/**
 * ยืนยันก่อนลบสินค้า — ดีไซน์ไม่มีปุ่มยกเลิก ปิดได้ด้วย Esc หรือคลิกนอก dialog
 * โฟกัสแรกตกที่ "ปิดการขายแทน" กันกด Enter แล้วลบถาวรโดยไม่ตั้งใจ
 */
export function DeleteProductDialog({
  title,
  description,
  remainingLabel,
  soldLabel,
  warning,
  unpublishLabel,
  confirmLabel,
  product,
  unit,
  open,
  onOpenChange,
  onUnpublish,
  onConfirm,
}: DeleteProductDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="gap-0 overflow-hidden rounded-2xl bg-white p-0 shadow-[0px_12px_32px_0px_rgba(0,0,0,0.18)] ring-0 sm:max-w-[460px]"
      >
        <div className="flex flex-col gap-3 px-6 pt-6 pb-4">
          <div className="flex size-11 items-center justify-center rounded-xl bg-rose-100">
            <Trash2 aria-hidden="true" className="size-5 text-red-600" />
          </div>
          <div className="flex flex-col gap-1.5">
            <DialogTitle className="text-base leading-normal font-bold text-zinc-950">
              {title}
            </DialogTitle>
            <DialogDescription className="text-xs leading-4 text-gray-500">
              {description}
            </DialogDescription>
          </div>
        </div>

        <div className="flex flex-col gap-3.5 px-6 pb-5">
          {product ? (
            <div className="flex items-center gap-3 rounded-[10px] border border-gray-100 bg-neutral-50 p-3.5">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-gray-100">
                <ImageIcon aria-hidden="true" className="size-4 text-gray-400" />
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
                <p className="text-xs font-medium text-zinc-950">
                  {product.name}
                </p>
                <p className="text-xs text-gray-500">
                  {remainingLabel} {product.stock} {unit} · {soldLabel}{" "}
                  {product.sold} {unit}
                </p>
              </div>
            </div>
          ) : null}

          <div className="flex items-start gap-2.5 rounded-lg bg-orange-100 p-3">
            <TriangleAlert
              aria-hidden="true"
              className="mt-px size-3.5 shrink-0 text-amber-700"
            />
            <p className="flex-1 text-xs leading-4 text-amber-700">{warning}</p>
          </div>
        </div>

        <DialogFooter className="flex-row items-center justify-end gap-2.5 border-t border-gray-100 bg-neutral-50 px-6 py-4">
          <Button
            variant="outline"
            size="sm"
            className="rounded-md px-2.5"
            onClick={onUnpublish}
          >
            {unpublishLabel}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            className="rounded-md bg-destructive px-2.5 text-white hover:bg-destructive/90 focus-visible:ring-destructive/30"
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
