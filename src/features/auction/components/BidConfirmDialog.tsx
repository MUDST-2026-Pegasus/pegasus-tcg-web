import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { formatBaht } from "../auction.format";

type BidConfirmDialogProps = {
  /** `null` = ปิด dialog */
  amount: number | null;
  onOpenChange: (open: boolean) => void;
};

/**
 * dialog ยืนยันก่อนบิด — ตอนนี้เป็นโครงไว้ก่อน [TCG-629]
 * FE-4 (TCG-630) มาทำหน้าตาตาม Figma และส่งบิดจริงด้วย `usePlaceBid`
 */
export function BidConfirmDialog({ amount, onOpenChange }: BidConfirmDialogProps) {
  return (
    <Dialog open={amount !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>ยืนยันการบิด {amount !== null ? formatBaht(amount) : ""}</DialogTitle>
          <DialogDescription>บิดแล้วถอนไม่ได้ · ถ้าชนะต้องชำระภายใน 24 ชม.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>ยกเลิก</DialogClose>
          {/* FE-4: เรียก usePlaceBid แล้วจัดการ error BID_TOO_LOW / BIDDING_BANNED ฯลฯ */}
          <Button disabled>ยืนยันการบิด</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
