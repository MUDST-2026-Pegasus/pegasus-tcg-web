import { translate, useLanguage } from "@/lib/language";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { useLiftBiddingBan } from "@/features/auction/auction.queries";
import type { BannedBidder } from "@/features/auction/auction.types";
import { ApiError } from "@/lib/api/errors";

import { formatDayMonth, formatDayMonthYear } from "../admin-auctions.format";

type LiftBanDialogProps = {
  bidder: BannedBidder | null;
  /** `lift` = ยกเลิกโทษ · `history` = ดูประวัติอย่างเดียว (ปุ่ม "ปิด") */
  mode: "lift" | "history";
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** A2 ยกเลิกโทษห้ามบิด + รายการประมูลที่ไม่ชำระ [TCG-635 · FE-9] */
export function LiftBanDialog({ bidder, mode, open, onOpenChange }: LiftBanDialogProps) {
  useLanguage();
  const lift = useLiftBiddingBan();
  const lifting = mode === "lift";

  const confirm = () => {
    if (!bidder || lift.isPending) return;
    lift.mutate(
      { userId: bidder.userId, payload: { reason: null } },
      {
        onSuccess: () => onOpenChange(false),
        onError: (error) =>
          toast.add({ type: "error", title: "ยกเลิกโทษไม่สำเร็จ", description: error instanceof ApiError ? error.message : undefined }),
      },
    );
  };

  const summary = bidder
    ? `ไม่ชำระหลังชนะ ${bidder.strikes.length} ครั้ง${bidder.bannedUntil ? ` · ห้ามบิดถึง ${formatDayMonthYear(bidder.bannedUntil)}` : ""}`
    : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="gap-0 overflow-hidden rounded-2xl bg-card p-0 sm:max-w-[460px]">
        <div className="flex flex-col gap-4 px-6 pt-6 pb-5">
          <div className="flex flex-col gap-1.5">
            <DialogTitle className="text-base font-bold text-foreground">
              {lifting ? `ยกเลิกโทษห้ามบิดของ ${bidder?.username ?? ""}?` : (bidder?.username ?? "")}
            </DialogTitle>
            <DialogDescription className="text-xs leading-5 text-muted-foreground">
              {lifting ? `${summary} — ใช้เมื่อการไม่ชำระไม่ใช่ความผิดของผู้ใช้ เช่น ระบบชำระเงินขัดข้อง` : summary}
            </DialogDescription>
          </div>
          {bidder && bidder.strikes.length > 0 ? (
            <ul aria-label="ประมูลที่ไม่ชำระ" className="flex flex-col gap-2 rounded-xl bg-muted px-4 py-3">
              {/* เก่าสุดก่อน ตาม Figma */}
              {[...bidder.strikes].reverse().map((strike) => (
                <li key={strike.auctionId} className="flex items-center justify-between gap-3 text-xs">
                  <span className="font-semibold text-foreground">#{strike.auctionNumber}</span>
                  <span className="text-muted-foreground">ไม่ชำระ · {formatDayMonth(strike.at)}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <DialogFooter className="flex-row items-center justify-end gap-2.5 border-t border-muted bg-muted/30 px-6 py-4">
          <DialogClose render={<Button variant="outline" size="sm" className="rounded-md px-2.5" />}>{translate("ปิด", "Close")}</DialogClose>
          {lifting ? (
            <Button size="sm" className="rounded-md px-2.5" disabled={lift.isPending} onClick={confirm}>
              {lift.isPending && <Spinner />}
              {translate("ยกเลิกโทษ", "Lift ban")}</Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
