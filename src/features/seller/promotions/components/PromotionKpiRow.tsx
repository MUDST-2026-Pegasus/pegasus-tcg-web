import { Card } from "@/components/ui/card";
import { money } from "../promotions.format";
import type { Summary } from "../promotions.types";
import { useTranslate } from "@/lib/i18n";

export function PromotionKpiRow({ summary, total }: { summary?: Summary; total: number }) {
  const { t } = useTranslate("promotions");
  const items = [
    [t("seller.promotionKpiRow.text", "โค้ดที่ใช้งานอยู่"), summary?.activeCodes ?? 0, t("seller.promotionKpiRow.text2", "จากทั้งหมด {total} โค้ด", { total })],
    [t("seller.promotionKpiRow.text3", "ลูกค้าใช้โค้ด (30 วัน)"), summary?.redemptions30d ?? 0, t("seller.promotionKpiRow.text4", "ออเดอร์")],
    [t("seller.promotionKpiRow.text5", "ส่วนลดที่ร้านออก (30 วัน)"), money(summary?.shopDiscount30d ?? 0), t("seller.promotionKpiRow.text6", "หักจากรายได้ร้าน")],
    [t("seller.promotionKpiRow.text7", "ยอดขายจากออเดอร์ที่ใช้โค้ด"), money(summary?.salesWithCodes30d ?? 0), t("seller.promotionKpiRow.text8", "30 วันล่าสุด")],
  ];
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map(([label, value, caption]) => (
        <Card key={label} className="flex min-w-0 flex-col gap-1 rounded-xl border border-border bg-card p-4 shadow-none [&_span]:text-xs [&_span]:text-muted-foreground [&_strong]:text-2xl [&_strong]:font-extrabold [&_small]:text-xs [&_small]:text-muted-foreground">
          <span>{label}</span><strong>{value}</strong><small>{caption}</small>
        </Card>
      ))}
    </div>
  );
}
