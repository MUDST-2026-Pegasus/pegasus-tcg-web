import { translate, useLanguage } from "@/lib/language";
import { useState } from "react";
import { Ban } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";

import { auctionErrorMessage, type AuctionErrorMessage } from "../auction.errors";
import { formatBaht } from "../auction.format";
import { useBuyNow } from "../auction.queries";
import type { AuctionDetail } from "../auction.types";
import { AuctionNotice } from "./AuctionNotice";
import { PriceSummary } from "./PriceSummary";

type ConfirmBuyNowDialogProps = {
  auction: AuctionDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** B3-C dialog ยืนยันซื้อทันที — สำเร็จแล้วไป checkout โหมดประมูล [TCG-630 · FE-4] */
export function ConfirmBuyNowDialog({ auction, open, onOpenChange }: ConfirmBuyNowDialogProps) {
  useLanguage();
  const navigate = useNavigate();
  const buyNow = useBuyNow(auction.id);
  const [error, setError] = useState<AuctionErrorMessage | null>(null);
  const price = auction.buyNowPrice ?? 0;

  const close = (next: boolean) => {
    if (!next) setError(null);
    onOpenChange(next);
  };

  const confirm = () => {
    if (buyNow.isPending) return;
    setError(null);
    buyNow.mutate(undefined, {
      onSuccess: (win) => {
        close(false);
        navigate(`/checkout?auction=${win.auctionId}`);
      },
      onError: (err) => setError(auctionErrorMessage(err, auction)),
    });
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="rounded-xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{translate("ซื้อทันทีในราคา", "Buy now for")}{formatBaht(price)}?</DialogTitle>
          <DialogDescription>{translate("ประมูลจะจบทันที และระบบสร้างคำสั่งซื้อให้คุณ — ชำระเงินภายใน 24 ชม.", "The auction ends immediately and an order is created for you — pay within 24 hours")}</DialogDescription>
        </DialogHeader>

        <PriceSummary
          rows={[
            [translate("ราคาซื้อทันที", "Buy now price"), price],
            [translate("ค่าจัดส่ง", "Shipping"), auction.shippingFee],
          ]}
          totalLabel={translate("ยอดชำระ", "Total payment")}
          total={price + auction.shippingFee}
        />

        {error ? <AuctionNotice tone="red" role="alert" icon={<Ban />} title={error.title} detail={error.detail} /> : null}

        <DialogFooter>
          <DialogClose render={<Button variant="outline" className="rounded-full px-5" />}>{translate("ยกเลิก", "Cancel")}</DialogClose>
          <Button className="rounded-full px-5" disabled={buyNow.isPending} onClick={confirm}>
            {buyNow.isPending && <Spinner />}{translate("ซื้อทันที", "Buy now")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
