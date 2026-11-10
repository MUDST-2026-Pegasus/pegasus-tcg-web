import { ConfirmDialog } from "@/components/common";
import { useState } from "react";
import { Ban } from "lucide-react";
import { useNavigate } from "react-router-dom";


import { auctionErrorMessage, type AuctionErrorMessage } from "../auction.errors";
import { formatBaht } from "../auction.format";
import { useBuyNow } from "../auction.queries";
import type { AuctionDetail } from "../auction.types";
import { AuctionNotice } from "./AuctionNotice";
import { PriceSummary } from "./PriceSummary";
import { useTranslate } from "@/lib/i18n";

type ConfirmBuyNowDialogProps = {
  auction: AuctionDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** B3-C dialog ยืนยันซื้อทันที — สำเร็จแล้วไป checkout โหมดประมูล [TCG-630 · FE-4] */
export function ConfirmBuyNowDialog({ auction, open, onOpenChange }: ConfirmBuyNowDialogProps) {
  const { t } = useTranslate("auction");
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
    <ConfirmDialog
      open={open}
      onOpenChange={close}
      title={t("buyer.confirmBuyNowDialog.title", "ซื้อทันทีในราคา {price}?", { price: formatBaht(price) })}
      description={t("buyer.confirmBuyNowDialog.description", "ประมูลจะจบทันที และระบบสร้างคำสั่งซื้อให้คุณ — ชำระเงินภายใน 24 ชม.")}
      confirmLabel={t("buyer.confirmBuyNowDialog.confirmLabel", "ซื้อทันที")}
      isPending={buyNow.isPending}
      onConfirm={confirm}
    >
      <PriceSummary
        rows={[
          [t("buyer.confirmBuyNowDialog.text", "ราคาซื้อทันที"), price],
          [t("buyer.confirmBuyNowDialog.text2", "ค่าจัดส่ง"), auction.shippingFee],
        ]}
        totalLabel={t("buyer.confirmBuyNowDialog.totalLabel", "ยอดชำระ")}
        total={price + auction.shippingFee}
      />

      {error ? <AuctionNotice tone="red" role="alert" icon={<Ban />} title={error.title} detail={error.detail} /> : null}
    </ConfirmDialog>
  );
}
