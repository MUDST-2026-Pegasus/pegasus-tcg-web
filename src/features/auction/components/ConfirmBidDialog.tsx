import { ConfirmDialog } from "@/components/common";
import { useState } from "react";
import { Ban, TriangleAlert } from "lucide-react";


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
    <ConfirmDialog
      open={open}
      onOpenChange={close}
      title={`ยืนยันการบิด ${formatBaht(value)}?`}
      description={`${auction.item.card.productName} · ${auction.item.condition} · ${auction.seller.shopName}`}
      confirmLabel={`ยืนยันบิด ${formatBaht(value)}`}
      isPending={placeBid.isPending}
      onConfirm={confirm}
    >
      <PriceSummary
        rows={[
          ["ราคาบิดของคุณ", value],
          ["ค่าจัดส่ง (ถ้าชนะ)", auction.shippingFee],
        ]}
        totalLabel="ยอดที่ต้องชำระถ้าชนะ"
        total={value + auction.shippingFee}
      />

      {error ? (
        <AuctionNotice tone="red" role="alert" icon={<Ban />} title={error.title} detail={error.detail} />
      ) : (
        <AuctionNotice
          tone="amber"
          icon={<TriangleAlert />}
          title="บิดแล้วถอนไม่ได้"
          detail="ถ้าชนะต้องชำระภายใน 24 ชม. ไม่ชำระจะถูกบันทึก 1 ครั้ง (ครบ 3 ครั้งห้ามบิด 30 วัน)"
        />
      )}
    </ConfirmDialog>
  );
}
