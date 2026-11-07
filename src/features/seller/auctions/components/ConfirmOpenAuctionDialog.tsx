import { ConfirmDialog } from "@/components/common";
import { useState } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { formatBaht } from "@/features/auction/auction.format";
import type { EligibleUnit } from "@/features/auction/auction.types";
import { ESTIMATED_COMMISSION_PERCENT } from "@/features/seller/products/listing-form.format";
import { toNumber } from "@/features/seller/products/products.format";

import { closeAtMs, formatCloseDate, formatCloseDuration } from "../auction-form.schema";
import type { AuctionFormValues } from "../auction-form.types";

type ConfirmOpenAuctionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unit: EligibleUnit | null;
  values: AuctionFormValues;
  now: number;
  pending: boolean;
  onConfirm: () => void;
};

/** ขั้น 3 · ยืนยันเปิดประมูล (Figma S3-A) — ต้องติ๊กรับทราบก่อนกด [TCG-633 · FE-7] */
export function ConfirmOpenAuctionDialog({ open, onOpenChange, unit, values, now, pending, onConfirm }: ConfirmOpenAuctionDialogProps) {
  const [acknowledged, setAcknowledged] = useState(false);
  const [wasOpen, setWasOpen] = useState(open);
  // เปิดใหม่ทุกครั้งต้องติ๊กใหม่
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setAcknowledged(false);
  }

  const start = toNumber(values.startingPrice);
  const increment = toNumber(values.bidIncrement);
  const buyNow = values.buyNowEnabled ? toNumber(values.buyNowPrice) : null;
  const closeAt = closeAtMs(values.closeDate, values.closeTime);

  const rows: [string, string][] = [
    ["ราคาเริ่มต้น", start === null ? "—" : formatBaht(start)],
    ["บิดขั้นต่ำครั้งละ", increment === null ? "—" : `+${formatBaht(increment)}`],
    [
      "ปิดประมูล",
      closeAt === null ? "—" : `${formatCloseDate(values.closeDate)} ${values.closeTime} (อีก ${formatCloseDuration(closeAt - now)})`,
    ],
    ["ซื้อทันที", buyNow === null ? "ไม่เปิด" : `${formatBaht(buyNow)} (จนกว่าจะมีบิดแรก)`],
    ["ค่าคอมมิชชั่น", `${ESTIMATED_COMMISSION_PERCENT}% เท่าการขายปกติ`],
  ];

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="เปิดประมูลการ์ดใบนี้?"
      description={unit ? `${unit.item.card.productName} · ${unit.item.condition}` : undefined}
      confirmLabel="เปิดประมูล"
      cancelLabel="ย้อนกลับ"
      isPending={pending}
      confirmDisabled={!acknowledged}
      onConfirm={onConfirm}
    >
      <dl className="flex flex-col gap-2 rounded-xl bg-muted/40 px-4 py-3.5 text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-start justify-between gap-4">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="text-right font-semibold text-foreground tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>

      <label className="flex cursor-pointer items-start gap-2.5 text-sm text-foreground">
        <Checkbox checked={acknowledged} onCheckedChange={(checked) => setAcknowledged(checked === true)} className="mt-0.5" />
        ฉันเข้าใจว่าเมื่อมีผู้บิดแล้ว จะยกเลิกการประมูลไม่ได้
      </label>
    </ConfirmDialog>
  );
}
