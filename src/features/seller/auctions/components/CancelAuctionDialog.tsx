import { translate, useLanguage } from "@/lib/language";
import { Ban } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { useCancelAuction } from "@/features/auction/auction.queries";
import type { SellerAuctionRow } from "@/features/auction/auction.types";
import { ApiError } from "@/lib/api/errors";

type CancelAuctionDialogProps = {
  /** ประมูลที่จะยกเลิก — เก็บไว้แม้ปิดแล้ว เนื้อหาจะได้ไม่หายระหว่าง animation ปิด */
  row: SellerAuctionRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** S3-B ยืนยันยกเลิกประมูล (ได้เฉพาะตอนยังไม่มีบิด) [TCG-632 · FE-6] */
export function CancelAuctionDialog({ row, open, onOpenChange }: CancelAuctionDialogProps) {
  useLanguage();
  const cancel = useCancelAuction(row?.id ?? 0);

  const confirm = () => {
    if (!row || cancel.isPending) return;
    cancel.mutate(undefined, {
      onSuccess: () => onOpenChange(false),
      onError: (error) =>
        toast.add({
          type: "error",
          // ข้อความ AUCTION_HAS_BIDS ตาม Figma S3-E
          title: error instanceof ApiError && error.code === "AUCTION_HAS_BIDS" ? translate("ยกเลิกไม่ได้ — มีผู้บิดแล้ว", "Cannot cancel — bids have already been placed") : "ยกเลิกประมูลไม่สำเร็จ",
          description: error instanceof ApiError ? error.message : undefined,
        }),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="gap-0 overflow-hidden rounded-2xl bg-card p-0 sm:max-w-[460px]">
        <div className="flex flex-col gap-3 px-6 pt-6 pb-5">
          <div className="flex size-11 items-center justify-center rounded-xl bg-red-50">
            <Ban aria-hidden className="size-5 text-destructive" />
          </div>
          <div className="flex flex-col gap-1.5">
            <DialogTitle className="text-base font-bold text-foreground">ยกเลิกการประมูลนี้?</DialogTitle>
            <DialogDescription className="text-xs leading-5 text-muted-foreground">
              {row ? `${row.item.card.productName} · ` : ""}ยังไม่มีผู้บิด — การ์ดจะกลับเข้าสต็อกและขายในหน้าร้านได้ตามปกติ
            </DialogDescription>
          </div>
        </div>
        <DialogFooter className="flex-row items-center justify-end gap-2.5 border-t border-muted bg-muted/30 px-6 py-4">
          <DialogClose render={<Button variant="outline" size="sm" className="rounded-md px-2.5" />}>{translate("ไม่ยกเลิก", "Keep auction")}</DialogClose>
          <Button
            variant="destructive"
            size="sm"
            className="rounded-md bg-destructive px-2.5 text-white hover:bg-destructive/90"
            disabled={cancel.isPending}
            onClick={confirm}
          >
            {cancel.isPending && <Spinner />}
            {translate("ยกเลิกประมูล", "Cancel auction")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
