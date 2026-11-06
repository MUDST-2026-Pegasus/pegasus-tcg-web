import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { useSuspendAuction } from "@/features/auction/auction.queries";
import { ApiError } from "@/lib/api/errors";

export type SuspendTarget = { id: number; cardName: string; auctionNumber: string; bidCount: number };

type SuspendAuctionDialogProps = {
  /** เก็บไว้แม้ปิดแล้ว เนื้อหาจะได้ไม่หายระหว่าง animation ปิด */
  target: SuspendTarget | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * A2 ระงับประมูล — เหตุผลบังคับ (ผู้ขายและผู้บิดจะเห็น) [TCG-635 · FE-9]
 * หน้าที่เรียกใส่ key ตามใบ เปิดใบใหม่แล้วช่องเหตุผลเริ่มว่าง
 */
export function SuspendAuctionDialog({ target, open, onOpenChange }: SuspendAuctionDialogProps) {
  const suspend = useSuspendAuction(target?.id ?? 0);
  const [reason, setReason] = useState("");
  const trimmed = reason.trim();

  const confirm = () => {
    if (!target || trimmed === "" || suspend.isPending) return;
    suspend.mutate(
      { reason: trimmed },
      {
        onSuccess: () => onOpenChange(false),
        onError: (error) =>
          toast.add({ type: "error", title: "ระงับประมูลไม่สำเร็จ", description: error instanceof ApiError ? error.message : undefined }),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="gap-0 overflow-hidden rounded-2xl bg-card p-0 sm:max-w-[460px]">
        <div className="flex flex-col gap-4 px-6 pt-6 pb-5">
          <div className="flex flex-col gap-1.5">
            <DialogTitle className="text-base font-bold text-foreground">ระงับการประมูลนี้?</DialogTitle>
            <DialogDescription className="text-xs leading-5 text-muted-foreground">
              {target ? `${target.cardName} · #${target.auctionNumber} · ${target.bidCount} บิด — ` : ""}
              บิดทั้งหมดถูกยกเลิก การ์ดกลับเข้าสต็อกผู้ขาย และผู้บิดทุกคนได้รับแจ้ง
            </DialogDescription>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="suspend-reason" className="text-xs font-semibold text-foreground">
              เหตุผล (ผู้ขายและผู้บิดจะเห็น) *
            </label>
            <Textarea
              id="suspend-reason"
              required
              rows={3}
              maxLength={500}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              className="min-h-20 rounded-lg text-sm"
            />
          </div>
        </div>
        <DialogFooter className="flex-row items-center justify-end gap-2.5 border-t border-muted bg-muted/30 px-6 py-4">
          <DialogClose render={<Button variant="outline" size="sm" className="rounded-md px-2.5" />}>ยกเลิก</DialogClose>
          <Button
            variant="destructive"
            size="sm"
            className="rounded-md bg-destructive px-2.5 text-white hover:bg-destructive/90"
            disabled={trimmed === "" || suspend.isPending}
            onClick={confirm}
          >
            {suspend.isPending && <Spinner />}
            ระงับประมูล
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
