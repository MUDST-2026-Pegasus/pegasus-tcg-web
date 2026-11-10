import { Send } from "lucide-react";

import { formatBaht } from "@/features/seller/shared/seller.format";
import { cn } from "@/lib/utils";

import { buyerCarrierChipLabel, estDaysLabel } from "../../orders.format";
import type { ShippingChoice } from "../../orders.types";
import { useTranslate } from "@/lib/i18n";

/** สิ่งที่ผู้ซื้อเลือกตอน checkout อ่านจาก snapshot ของออเดอร์ ผู้ขายแก้ตัวเลือกทีหลังก็ไม่เปลี่ยน */
export function BuyerShippingChoice({ choice }: { choice: ShippingChoice }) {
  const { t } = useTranslate("seller");
  const days = estDaysLabel(choice.estDaysMin, choice.estDaysMax);

  return (
    <section
      aria-label={t("orderDetail.buyerShipping.title", "การจัดส่งที่ผู้ซื้อเลือก")}
      className="flex flex-col gap-2 rounded-[10px] border-[1.5px] border-primary bg-[#f0f7fc] px-3.5 py-3"
    >
      <div className="flex items-center gap-2 text-xs text-gray-700">
        <Send aria-hidden="true" className="size-4 shrink-0" />
        <p className="min-w-0 flex-1 font-semibold">{t("orderDetail.buyerShipping.title", "การจัดส่งที่ผู้ซื้อเลือก")}</p>
        <p className="shrink-0 font-medium">{t("orderDetail.buyerShipping.paid", "ผู้ซื้อชำระค่าส่ง {fee}", { fee: formatBaht(choice.fee) })}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-[13px] font-semibold text-foreground">{choice.name}</p>
        <span
          className={cn(
            "rounded-md border border-border bg-white px-2 py-0.5 text-[11px] font-medium",
            choice.carrierCode ? "text-primary" : "text-gray-500",
          )}
        >
          {buyerCarrierChipLabel(choice)}
        </span>
        {days ? <p className="text-xs text-gray-400">{t("orderDetail.buyerShipping.eta", "· ผู้ซื้อคาดว่าจะได้รับใน {days} วัน", { days })}</p> : null}
      </div>
    </section>
  );
}
