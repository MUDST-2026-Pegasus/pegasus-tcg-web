import { ConfirmDialog } from "@/components/common";
import { useState } from "react";
import { Ban, TriangleAlert } from "lucide-react";


import { newIdempotencyKey } from "../auction.api";
import { auctionErrorMessage, type AuctionErrorMessage } from "../auction.errors";
import { auctionRules, formatBaht, formatPaymentWindow } from "../auction.format";
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
  // key เดียวต่อราคาที่ยืนยัน: กดซ้ำหลังเน็ตกระตุกได้ผลบิดเดิมกลับมา ไม่ใช่ "คุณนำอยู่แล้ว"
  const [attempt, setAttempt] = useState<{ amount: number; key: string } | null>(null);
  const rules = auctionRules(auction);
  const open = amount !== null;
  const value = amount ?? 0;

  const close = (next: boolean) => {
    if (!next) {
      setError(null);
      setAttempt(null);
    }
    onOpenChange(next);
  };

  const confirm = () => {
    if (amount === null || placeBid.isPending) return;
    setError(null);
    const key = attempt?.amount === amount ? attempt.key : newIdempotencyKey();
    if (attempt?.key !== key) setAttempt({ amount, key });
    placeBid.mutate(
      { payload: { amount }, idempotencyKey: key },
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
          detail={`ถ้าชนะต้องชำระภายใน ${formatPaymentWindow(rules.paymentHours)} ไม่ชำระจะถูกบันทึก 1 ครั้ง (ครบ ${rules.strikeLimit} ครั้งห้ามบิด ${rules.banDays} วัน)`}
        />
      )}
    </ConfirmDialog>
  );
}
