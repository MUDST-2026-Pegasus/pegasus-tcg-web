import { translate, useLanguage } from "@/lib/language";
import { useState } from "react";
import { Ban, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";

import { auctionErrorMessage, type AuctionErrorMessage } from "../auction.errors";
import { formatBaht } from "../auction.format";
import { usePlaceBid } from "../auction.queries";
import type { AuctionDetail, BidPlaced } from "../auction.types";
import { AuctionNotice } from "./AuctionNotice";
import { PriceSummary } from "./PriceSummary";

type ConfirmBidDialogProps = {
  auction: AuctionDetail;
  /** `null` = ปิด */
  amount: number | null;
  onOpenChange: (open: boolean) => void;
  /** บิดสำเร็จ — dialog ปิดเอง หน้าแสดงแบนเนอร์ "คุณนำอยู่" */
  onPlaced: (result: BidPlaced) => void;
};

/** B3-A dialog ยืนยันการบิด (บิดแล้วถอนไม่ได้) [TCG-630 · FE-4] */
export function ConfirmBidDialog({ auction, amount, onOpenChange, onPlaced }: ConfirmBidDialogProps) {
  useLanguage();
  const placeBid = usePlaceBid(auction.id);
  const [error, setError] = useState<AuctionErrorMessage | null>(null);
  const open = amount !== null;
  const value = amount ?? 0;

  const close = (next: boolean) => {
    if (!next) setError(null);
    onOpenChange(next);
  };

  const confirm = () => {
    if (amount === null || placeBid.isPending) return;
    setError(null);
    // ไม่ส่ง key = api สร้างใหม่ทุกครั้งที่กดยืนยัน
    placeBid.mutate(
      { amount },
      {
        onSuccess: (result) => {
          onPlaced(result);
          close(false);
        },
        onError: (err) => setError(auctionErrorMessage(err, auction)),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="rounded-xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{translate("ยืนยันการบิด", "Confirm bid")}{formatBaht(value)}?</DialogTitle>
          <DialogDescription>
            {auction.item.card.productName} · {auction.item.condition} · {auction.seller.shopName}
          </DialogDescription>
        </DialogHeader>

        <PriceSummary
          rows={[
            [translate("ราคาบิดของคุณ", "Your bid"), value],
            [translate("ค่าจัดส่ง (ถ้าชนะ)", "Shipping (if you win)"), auction.shippingFee],
          ]}
          totalLabel={translate("ยอดที่ต้องชำระถ้าชนะ", "Total due if you win")}
          total={value + auction.shippingFee}
        />

        {error ? (
          <AuctionNotice tone="red" role="alert" icon={<Ban />} title={error.title} detail={error.detail} />
        ) : (
          <AuctionNotice
            tone="amber"
            icon={<TriangleAlert />}
            title={translate("บิดแล้วถอนไม่ได้", "Bids cannot be withdrawn")}
            detail={translate("ถ้าชนะต้องชำระภายใน 24 ชม. ไม่ชำระจะถูกบันทึก 1 ครั้ง (ครบ 3 ครั้งห้ามบิด 30 วัน)", "Winners must pay within 24 hours. Non-payment adds one strike (three strikes suspend bidding for 30 days).")}
          />
        )}

        <DialogFooter>
          <DialogClose render={<Button variant="outline" className="rounded-full px-5" />}>{translate("ยกเลิก", "Cancel")}</DialogClose>
          <Button className="rounded-full px-5" disabled={placeBid.isPending} onClick={confirm}>
            {placeBid.isPending && <Spinner />}{translate("ยืนยันบิด", "Place bid")}{formatBaht(value)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
