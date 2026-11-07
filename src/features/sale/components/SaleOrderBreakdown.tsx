import { translate, useLanguage } from "@/lib/language";
import { SaleBadge, formatSaleBaht } from "@/components/sale";

import { type SaleOrderItem, saleDiscountTotals, saleItems } from "../sale.orders";

/**
 * Figma SAL-B3 E (ผู้ขาย) / F (แอดมิน) — ราคาลดในรายละเอียดคำสั่งซื้อ เห็นว่าใครออกเงิน
 * - Pegasus ลดให้ → ร้านได้เต็มราคาตั้งต้น Pegasus อุดหนุนตอนปล่อย escrow (SALE_SUBSIDY)
 * - ร้านลดเอง → ร้านออกส่วนลด คอมมิชชั่นคิดจากราคาที่ลดแล้ว
 * ไม่มีแถวที่ลดราคา = ไม่แสดงอะไร
 */
export function SaleOrderBreakdown({ items, viewer }: { items: SaleOrderItem[]; viewer: "seller" | "admin" }) {
  useLanguage();
  const rows = saleItems(items);
  if (rows.length === 0) return null;
  const totals = saleDiscountTotals(rows);

  return (
    <section aria-label={translate("ราคาลดในคำสั่งซื้อ", "Order price discounts")} className="grid gap-3 rounded-xl border border-border bg-card p-4 text-xs">
      <p className="font-semibold">{translate("ราคาลดในคำสั่งซื้อนี้", "Price discounts in this order")}</p>
      {rows.map((item) => {
        const platform = item.saleDiscount?.platform ?? 0;
        const seller = item.saleDiscount?.seller ?? 0;
        const list = item.listPrice ?? item.unitPrice;
        return (
          <div key={item.id} className="grid gap-1 border-t pt-2.5 first:border-t-0 first:pt-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold">
                {item.productName} × {item.quantity}
              </span>
              {platform > 0 ? <SaleBadge type="pegasus" /> : null}
              {seller > 0 ? <SaleBadge type="shop" /> : null}
            </div>
            <div className="flex justify-between gap-3 text-muted-foreground">
              <span>{translate("ราคาตั้งต้น / ผู้ซื้อจ่าย", "Original price / buyer pays")}</span>
              <span className="font-medium text-foreground">
                {formatSaleBaht(list * item.quantity)} / {formatSaleBaht(item.unitPrice * item.quantity)}
              </span>
            </div>
            {platform > 0 ? (
              <div className="flex justify-between gap-3 text-muted-foreground">
                <span>{viewer === "seller" ? translate("Pegasus อุดหนุน (ได้ตอนปล่อย escrow)", "Pegasus subsidy (received when escrow is released)") : translate(`ลดราคาสินค้า · Pegasus${item.saleName ? ` (${item.saleName})` : ""}`, `Product discount · Pegasus${item.saleName ? ` (${item.saleName})` : ""}`)}</span>
                <span className="font-semibold text-[#0069a8]">+{formatSaleBaht(platform)}</span>
              </div>
            ) : null}
            {seller > 0 ? (
              <div className="flex justify-between gap-3 text-muted-foreground">
                <span>{viewer === "seller" ? translate("ส่วนลดที่ร้านออก", "Store-funded discount") : translate(`ลดราคาสินค้า · ร้าน${item.saleName ? ` (${item.saleName})` : ""}`, `Product discount · Store${item.saleName ? ` (${item.saleName})` : ""}`)}</span>
                <span className="font-semibold text-[#c2410c]">−{formatSaleBaht(seller)}</span>
              </div>
            ) : null}
          </div>
        );
      })}
      <p className="border-t pt-2.5 text-[11px] text-muted-foreground">
        {viewer === "seller"
          ? translate("คอมมิชชั่น: รายการที่ Pegasus ลด คิดจากราคาตั้งต้น · รายการที่ร้านลด คิดจากราคาที่ลดแล้ว", "Commission: Pegasus discounts use the original price; store discounts use the discounted price")
          : translate(`SALE_SUBSIDY ${formatSaleBaht(totals.platform)} · ร้านออกเอง ${formatSaleBaht(totals.seller)} · ลง ledger ตอนปล่อย escrow`, `SALE_SUBSIDY ${formatSaleBaht(totals.platform)} · Store-funded ${formatSaleBaht(totals.seller)} · Posted to the ledger on escrow release`)}
      </p>
    </section>
  );
}
