import { translate, useLanguage } from "@/lib/language";
import { Lock } from "lucide-react";

import { formatSaleBaht } from "@/components/sale";
import { Button } from "@/components/ui/button";
import { PromotionDialog } from "@/features/admin/components/PromotionDialog";

import type { SalePriceLockedDetails } from "../sales.types";

const endDate = new Intl.DateTimeFormat("th-TH-u-ca-gregory", { day: "numeric", month: "short" });

/**
 * Figma SAL-M1 (Seller ERROR) "ขึ้นราคาไม่ได้ระหว่างการลดราคา" — แสดงแทน toast error ทั่วไป
 * เมื่อแก้ราคา listing แล้วได้ 409 `SALE_PRICE_LOCKED`
 */
export function SalePriceLockedDialog({
  open,
  onClose,
  productName,
  currentPrice,
  attemptedPrice,
  details,
}: {
  open: boolean;
  onClose: () => void;
  productName: string;
  currentPrice: number;
  attemptedPrice: number | null;
  details: SalePriceLockedDetails;
}) {
  useLanguage();
  const owner = details.ownerType === "PLATFORM" ? " (Pegasus)" : details.ownerType === "SELLER" ? " (ร้าน)" : "";
  const sale = details.saleName ? `“${details.saleName}”${owner}` : "การลดราคา";
  const until = details.endsAt ? ` ถึง ${endDate.format(new Date(details.endsAt))}` : "";
  return (
    <PromotionDialog
      open={open}
      onOpenChange={(next) => !next && onClose()}
      tone="danger"
      icon={<Lock />}
      title="ขึ้นราคาไม่ได้ระหว่างการลดราคา"
      description={`${productName} อยู่ใน ${sale}${until} · ลดราคาได้ แต่ขึ้นราคาได้หลังแคมเปญจบ เพื่อไม่ให้ราคาขีดฆ่าสูงเกินจริง`}
      actions={<Button onClick={onClose}>ตกลง</Button>}
    >
      <dl className="grid gap-1.5 rounded-md bg-muted px-3.5 py-2.5 text-xs [&>div]:flex [&>div]:justify-between [&_dt]:text-muted-foreground [&_dd]:font-semibold">
        <div>
          <dt>{translate("ราคาปัจจุบัน", "Current price")}</dt>
          <dd>{formatSaleBaht(details.currentPrice ?? currentPrice)}</dd>
        </div>
        {attemptedPrice != null ? (
          <div>
            <dt>ราคาที่จะตั้ง</dt>
            <dd className="text-[#dc2626]">{formatSaleBaht(attemptedPrice)}</dd>
          </div>
        ) : null}
      </dl>
    </PromotionDialog>
  );
}
