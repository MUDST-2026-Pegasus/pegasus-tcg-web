import { useWatch, type Control } from "react-hook-form";

import { CouponTicket } from "@/features/promotions/CouponTicket";

import { money } from "../promotions.format";
import type { SellerPromotionInput } from "../promotions.types";
import { useTranslate } from "@/lib/i18n";

/** ยอดตัวอย่างใน preview ตาม Figma PRM-S2 A (ลูกค้าซื้อ THB 1,200) */
const SAMPLE_SUBTOTAL = 1200;
/** อัตราคอมมิชชั่นสมมติ 5% ใช้อธิบายการคำนวณเท่านั้น (อัตราจริงอยู่ที่ backend ตอนปล่อยเงิน) */
const SAMPLE_COMMISSION_RATE = 0.05;

export function SellerPromotionPreview({ control }: { control: Control<SellerPromotionInput> }) {
  const { t } = useTranslate("promotions");
  const form = useWatch({ control }) as SellerPromotionInput;
  const subtotal = Math.max(SAMPLE_SUBTOTAL, form.minSpend || 0);
  const discount = Math.min(
    subtotal,
    form.discountType === "FIXED"
      ? form.discountValue || 0
      : Math.min((subtotal * (form.discountValue || 0)) / 100, form.maxDiscount ?? Infinity),
  );
  const afterShopCode = subtotal - discount;
  const commission = Math.round(afterShopCode * SAMPLE_COMMISSION_RATE);
  const payout = afterShopCode - commission;

  return (
    <aside className="grid min-w-0 content-start gap-3.5 rounded-xl bg-muted p-4">
      <strong className="text-xs font-semibold">{t("seller.sellerPromotionPreview.strong", "ตัวอย่าง")}</strong>
      <CouponTicket promotion={form} preview />
      <dl className="grid gap-2.5 text-xs">
        <strong className="text-xs font-semibold">{t("seller.sellerPromotionPreview.strong2", "ถ้าลูกค้าซื้อ")} {money(subtotal)} {t("seller.sellerPromotionPreview.strong3", "จากร้านคุณ")}</strong>
        <PreviewRow label={t("seller.sellerPromotionPreview.label", "ยอดสินค้า")} value={money(subtotal)} />
        <PreviewRow label={t("seller.sellerPromotionPreview.label2", "โค้ดร้าน (ร้านออก)")} value={`− ${money(discount)}`} className="text-amber-700" />
        <PreviewRow
          label={t("seller.sellerPromotionPreview.label3", "คอมมิชชั่น {value}% ของ {value2}", { value: SAMPLE_COMMISSION_RATE * 100, value2: money(afterShopCode) })}
          value={`− ${money(commission)}`}
        />
        <PreviewRow
          label={t("seller.sellerPromotionPreview.label4", "ร้านได้รับ (ไม่รวมค่าส่ง)")}
          value={money(payout)}
          className="text-emerald-700"
          total
        />
        <p className="text-[11px] text-muted-foreground">
          {t("seller.sellerPromotionPreview.p", "ถ้าลูกค้าใช้โค้ด Pegasus ร่วมด้วย ร้านยังได้")} {money(payout)} {t("seller.sellerPromotionPreview.p2", "เท่าเดิม")}
        </p>
      </dl>
    </aside>
  );
}

function PreviewRow({
  label,
  value,
  className,
  total,
}: {
  label: string;
  value: string;
  className?: string;
  total?: boolean;
}) {
  return (
    <div className={total ? "flex justify-between gap-2 border-t border-border pt-2.5" : "flex justify-between gap-2"}>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={className ? `font-semibold ${className}` : "font-semibold"}>{value}</dd>
    </div>
  );
}
