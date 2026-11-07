import { translate, useLanguage } from "@/lib/language";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
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
  useLanguage();
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
    [translate("ราคาเริ่มต้น", "Starting price"), start === null ? "—" : formatBaht(start)],
    [translate("บิดขั้นต่ำครั้งละ", "Minimum bid increment"), increment === null ? "—" : `+${formatBaht(increment)}`],
    [
      "ปิดประมูล",
      closeAt === null ? "—" : `${formatCloseDate(values.closeDate)} ${values.closeTime} (อีก ${formatCloseDuration(closeAt - now)})`,
    ],
    [translate("ซื้อทันที", "Buy now"), buyNow === null ? "ไม่เปิด" : `${formatBaht(buyNow)} (จนกว่าจะมีบิดแรก)`],
    [translate("ค่าคอมมิชชั่น", "Commission"), `${ESTIMATED_COMMISSION_PERCENT}% เท่าการขายปกติ`],
  ];

  return (
    <Dialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <DialogContent showCloseButton={false} className="gap-0 rounded-2xl bg-card p-6 sm:max-w-[460px]">
        <div className="flex flex-col gap-1.5">
          <DialogTitle className="text-lg font-bold text-foreground">เปิดประมูลการ์ดใบนี้?</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {unit ? `${unit.item.card.productName} · ${unit.item.condition}` : ""}
          </DialogDescription>
        </div>

        <dl className="mt-5 flex flex-col gap-2 rounded-xl bg-muted/40 px-4 py-3.5 text-sm">
          {rows.map(([label, value]) => (
            <div key={label} className="flex items-start justify-between gap-4">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="text-right font-semibold text-foreground tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>

        <label className="mt-4 flex cursor-pointer items-start gap-2.5 text-sm text-foreground">
          <Checkbox checked={acknowledged} onCheckedChange={(checked) => setAcknowledged(checked === true)} className="mt-0.5" />
          ฉันเข้าใจว่าเมื่อมีผู้บิดแล้ว จะยกเลิกการประมูลไม่ได้
        </label>

        <DialogFooter className="mt-5 flex-row justify-end gap-2.5 border-0 bg-transparent p-0">
          <DialogClose disabled={pending} render={<Button variant="outline" className="rounded-full px-5" />}>
            {translate("ย้อนกลับ", "Back")}</DialogClose>
          <Button className="rounded-full px-5" disabled={!acknowledged || pending} onClick={onConfirm}>
            {pending ? <Spinner /> : null}
            {translate("เปิดประมูล", "Start auction")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
