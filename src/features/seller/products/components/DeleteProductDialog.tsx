import { Trash2, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";

import { listingMeta } from "../products.format";
import { deleteBlockedReason } from "../products.rules";
import type { SellerListingSummary } from "../products.types";

import { ListingThumb } from "./ProductTable";

type DeleteProductDialogProps = {
  /** ประกาศที่กำลังจะลบ — เก็บไว้แม้ปิด dialog แล้ว เนื้อหาจะได้ไม่หายระหว่าง animation ปิด */
  listing: SellerListingSummary | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** ไม่ส่ง = ประกาศนี้พักการขายไม่ได้ (เช่น ยังเป็นร่าง หรือปิดไปแล้ว) ซ่อนปุ่มไป */
  onUnpublish?: () => void;
  onConfirm: () => void;
  /** กำลังยิงคำขอ — ปิดทั้งสองปุ่มกันกดซ้ำ */
  isPending: boolean;
};

/**
 * ยืนยันก่อนลบประกาศ — ดีไซน์ไม่มีปุ่มยกเลิก ปิดได้ด้วย Esc หรือคลิกนอก dialog
 * โฟกัสแรกตกที่ "พักการขายแทน" กันกด Enter แล้วลบถาวรโดยไม่ตั้งใจ
 *
 * ลบไม่ได้เมื่อยังมีการ์ดติดจองหรือแอดมินระงับไว้ — บอกเหตุผลและปิดปุ่มลบไว้ก่อน
 * ไม่ต้องรอให้ backend ปฏิเสธ
 */
export function DeleteProductDialog({
  listing,
  open,
  onOpenChange,
  onUnpublish,
  onConfirm,
  isPending,
}: DeleteProductDialogProps) {
  const blockedReason = listing ? deleteBlockedReason(listing) : null;

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
              ลบสินค้านี้ออกจากร้าน?
            </DialogTitle>
            <DialogDescription className="text-xs leading-4 text-gray-500">
              การลบไม่สามารถย้อนกลับได้ ผู้ซื้อจะไม่เห็นประกาศนี้อีก
            </DialogDescription>
          </div>
        </div>

        <div className="flex flex-col gap-3.5 px-6 pb-5">
          {listing ? (
            <div className="flex items-center gap-3 rounded-[10px] border border-gray-100 bg-neutral-50 p-3.5">
              <ListingThumb listing={listing} />
              <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
                <p className="text-xs font-medium text-zinc-950">
                  {listing.card.productName}
                </p>
                <p className="truncate text-[10px] text-gray-400">
                  {listingMeta(listing)}
                </p>
                <p className="text-xs text-gray-500">
                  พร้อมขาย {listing.quantityAvailable} ใบ · ติดจอง{" "}
                  {listing.quantityReserved} ใบ
                </p>
              </div>
            </div>
          ) : null}

          <div className="flex items-start gap-2.5 rounded-lg bg-orange-100 p-3">
            <TriangleAlert
              aria-hidden="true"
              className="mt-px size-3.5 shrink-0 text-amber-700"
            />
            <p className="flex-1 text-xs leading-4 text-amber-700">
              {blockedReason ??
                'การ์ดที่วางขายอยู่จะกลับเข้าคลังของคุณ ประวัติการขายยังอยู่ในรายงาน แนะนำให้ "พักการขาย" แทนถ้าจะกลับมาขายอีก'}
            </p>
          </div>
        </div>

        <DialogFooter className="flex-row items-center justify-end gap-2.5 border-t border-gray-100 bg-neutral-50 px-6 py-4">
          {onUnpublish ? (
            <Button
              variant="outline"
              size="sm"
              className="rounded-md px-2.5"
              disabled={isPending}
              onClick={onUnpublish}
            >
              พักการขายแทน
            </Button>
          ) : null}
          <Button
            variant="destructive"
            size="sm"
            className="rounded-md bg-destructive px-2.5 text-white hover:bg-destructive/90 focus-visible:ring-destructive/30"
            disabled={isPending || blockedReason !== null}
            onClick={onConfirm}
          >
            ลบถาวร
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
