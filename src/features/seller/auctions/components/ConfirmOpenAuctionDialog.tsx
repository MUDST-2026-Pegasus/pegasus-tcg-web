import { ConfirmDialog } from "@/components/common";
import { useState } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { formatBaht } from "@/features/auction/auction.format";
import type { EligibleUnit } from "@/features/auction/auction.types";
import { ESTIMATED_COMMISSION_PERCENT } from "@/features/seller/products/listing-form.format";
import { toNumber } from "@/features/seller/products/products.format";

import { closeAtMs, formatCloseDate, formatCloseDuration } from "../auction-form.schema";
import type { AuctionFormValues } from "../auction-form.types";
import { useTranslate } from "@/lib/i18n";

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
  const { t } = useTranslate("auction");
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
    [t("seller.confirmOpenAuctionDialog.text", "ราคาเริ่มต้น"), start === null ? "—" : formatBaht(start)],
    [t("seller.confirmOpenAuctionDialog.text2", "บิดขั้นต่ำครั้งละ"), increment === null ? "—" : `+${formatBaht(increment)}`],
    [
      t("seller.confirmOpenAuctionDialog.text3", "ปิดประมูล"),
      closeAt === null ? "—" : t("seller.confirmOpenAuctionDialog.text4", "{closeDate} {closeTime} (อีก {value})", { closeDate: formatCloseDate(values.closeDate), closeTime: values.closeTime, value: formatCloseDuration(closeAt - now) }),
    ],
    [t("seller.confirmOpenAuctionDialog.text5", "ซื้อทันที"), buyNow === null ? t("seller.confirmOpenAuctionDialog.text6", "ไม่เปิด") : t("seller.confirmOpenAuctionDialog.text7", "{buyNow} (จนกว่าจะมีบิดแรก)", { buyNow: formatBaht(buyNow) })],
    [t("seller.confirmOpenAuctionDialog.text8", "ค่าคอมมิชชั่น"), t("seller.confirmOpenAuctionDialog.text9", "{ESTIMATED_COMMISSION_PERCENT}% เท่าการขายปกติ", { ESTIMATED_COMMISSION_PERCENT })],
  ];

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("seller.confirmOpenAuctionDialog.title", "เปิดประมูลการ์ดใบนี้?")}
      description={unit ? `${unit.item.card.productName} · ${unit.item.condition}` : undefined}
      confirmLabel={t("seller.confirmOpenAuctionDialog.confirmLabel", "เปิดประมูล")}
      cancelLabel={t("seller.confirmOpenAuctionDialog.cancelLabel", "ย้อนกลับ")}
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
        {t("seller.confirmOpenAuctionDialog.text10", "ฉันเข้าใจว่าเมื่อมีผู้บิดแล้ว จะยกเลิกการประมูลไม่ได้")}
      </label>
    </ConfirmDialog>
  );
}
