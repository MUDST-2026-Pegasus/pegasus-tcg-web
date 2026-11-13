import type { ReactNode } from "react";

import { SaleProductCard } from "@/components/sale";
import { Card } from "@/components/ui/card";

import { formatBaht } from "../promotions.format";
import { SAMPLE_COMMISSION_RATE, SAMPLE_LIST_PRICE, sampleSaleCalculation } from "../sales.format";
import type { AdminSaleInput } from "../sales.types";
import { useTranslate } from "@/lib/i18n";

const ROW = "flex justify-between gap-3 [&>dt]:text-muted-foreground [&>dd]:font-semibold";

/**
 * คอลัมน์ขวาของ Figma SAL-A2 — การ์ดตัวอย่างที่ผู้ซื้อเห็น, ตัวอย่างการคำนวณ (listing THB 4,200 · คอมมิชชั่น 5%), สรุป
 * ตัวเลขในนี้คิดที่หน้าเว็บเพื่อแสดงเท่านั้น ราคาจริงคิดที่ server
 */
export function SaleFormAside({
  form,
  summary,
  actions,
  note,
}: {
  form: AdminSaleInput;
  summary: string[];
  actions: ReactNode;
  note: string;
}) {
  const { t } = useTranslate("sale");
  const sample = sampleSaleCalculation(form);
  const flash = form.saleType === "FLASH_SALE";
  const percent = Math.round((100 * sample.discount) / sample.listPrice);
  const discountRow =
    form.discountType === "PERCENT"
      ? t("admin.aside.discountPercent", "ส่วนลด {percent}%{cap}", { percent: form.discountValue ?? 0, cap: form.maxDiscountPerUnit != null ? t("admin.aside.cap", " (เพดาน {amount})", { amount: formatBaht(form.maxDiscountPerUnit) }) : "" })
      : t("admin.aside.discountFixed", "ส่วนลด {amount}/ชิ้น", { amount: formatBaht(form.discountValue) });
  const quota = form.perListingQuota ?? 25;

  return (
    <aside className="grid min-w-0 gap-4 lg:sticky lg:top-4">
      <Card className="items-center gap-3 rounded-[12px] border border-border p-5 shadow-none ring-0">
        <h2 className="text-[13px] font-semibold">{t("admin.aside.preview", "ตัวอย่างที่ผู้ซื้อเห็น")}</h2>
        <SaleProductCard
          className="pointer-events-none w-full max-w-[230px]"
          title="Charizard ex SAR"
          type="Single Card"
          href="#"
          quota={flash ? quota : null}
          pricing={
            sample.discount > 0
              ? {
                  listPrice: sample.listPrice,
                  salePrice: sample.buyerPays,
                  discountPercent: percent,
                  sale: {
                    id: 0,
                    slug: form.slug || null,
                    name: form.name || t("admin.aside.campaignFallback", "แคมเปญ"),
                    type: form.saleType,
                    endsAt: form.endsAt,
                    quotaLeft: flash ? Math.ceil(quota / 3) : null,
                    perBuyerLimit: form.perBuyerLimit,
                  },
                }
              : null
          }
          price={sample.listPrice}
        />
      </Card>
      <Card className="gap-0 rounded-[12px] border border-border p-5 shadow-none ring-0">
        <h2 className="text-[13px] font-semibold">
          {t("admin.aside.sample", "ตัวอย่างการคำนวณ (listing {price} · คอมมิชชั่น {percent}%)", { price: formatBaht(SAMPLE_LIST_PRICE), percent: SAMPLE_COMMISSION_RATE * 100 })}
        </h2>
        <dl className="mt-3 grid gap-2 text-xs">
          <div className={ROW}>
            <dt>{t("admin.aside.listPrice", "ราคาตั้งต้น")}</dt>
            <dd>{formatBaht(sample.listPrice)}</dd>
          </div>
          <div className={ROW}>
            <dt>{discountRow}</dt>
            <dd className="text-[#dc2626]">−{formatBaht(sample.discount)}</dd>
          </div>
          <div className={ROW}>
            <dt>{t("admin.aside.buyerPays", "ผู้ซื้อจ่าย")}</dt>
            <dd>{formatBaht(sample.buyerPays)}</dd>
          </div>
          <div className={ROW}>
            <dt>{t("admin.aside.commission", "คอมมิชชั่น (จากราคาตั้งต้น)")}</dt>
            <dd className="font-normal! text-muted-foreground">{formatBaht(sample.commission)}</dd>
          </div>
          <div className={ROW}>
            <dt>{t("admin.aside.sellerReceives", "ร้านได้")}</dt>
            <dd className="text-[#007a4a]">{formatBaht(sample.sellerReceives)}</dd>
          </div>
          <div className={ROW}>
            <dt>{t("admin.aside.subsidy", "Pegasus อุดหนุน (SALE_SUBSIDY)")}</dt>
            <dd className="text-[#0069a8]">{formatBaht(sample.subsidy)}</dd>
          </div>
        </dl>
      </Card>
      <Card className="gap-2 rounded-[12px] border border-border p-5 shadow-none ring-0">
        <h2 className="text-[13px] font-semibold">{t("admin.aside.summary", "สรุป")}</h2>
        <ul className="grid gap-0.5 text-xs">
          {summary.map((line) => (
            <li key={line}>• {line}</li>
          ))}
        </ul>
      </Card>
      <div className="grid grid-cols-2 gap-3">{actions}</div>
      <p className="text-[11px] text-muted-foreground">{note}</p>
    </aside>
  );
}
