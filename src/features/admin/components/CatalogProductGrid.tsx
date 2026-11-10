import { ProductCard } from "@/components/common";
import { cn } from "@/lib/utils";

import { formatCount, productTitle, toProductCard } from "../catalog.format";
import type { ProductSummary } from "../catalog.types";
import { useTranslate } from "@/lib/i18n";

type CatalogProductGridProps = {
  products: ProductSummary[];
  /** กำลังโหลดหน้าใหม่/ตัวกรองใหม่ แต่ยังโชว์ผลเดิมอยู่ */
  isFetching: boolean;
  onSelect: (product: ProductSummary) => void;
};

/**
 * ตารางการ์ดในแคตตาล็อก — ราคาบนการ์ดคือราคาถูกสุดที่มีคนขายตอนนี้
 * กดการ์ดเพื่อเปิดหน้าต่างแก้ไข ชิปบนรูปบอกว่าขายอยู่กี่ร้าน เหลือกี่ใบ
 *
 * ดีไซน์เป็น 4 คอลัมน์ ใช้ grid แทนความกว้างตายตัว 224px
 * เพราะพอมี scrollbar พื้นที่จะหายไป ~15px แล้วตกเหลือ 3 ใบต่อแถว
 */
export function CatalogProductGrid({
  products,
  isFetching,
  onSelect,
}: CatalogProductGridProps) {
  const { t } = useTranslate("admin");
  return (
    <ul
      aria-busy={isFetching || undefined}
      className={cn(
        "grid grid-cols-2 items-start gap-3 transition-opacity md:grid-cols-3 xl:grid-cols-4",
        isFetching && "opacity-60",
      )}
    >
      {products.map((product) => (
        <li key={product.id} className="relative">
          <button
            type="button"
            aria-label={t("catalog.products.edit", "แก้ไข {name}", { name: productTitle(product) })}
            onClick={() => onSelect(product)}
            className="block w-full cursor-pointer rounded-lg text-left transition-shadow outline-none hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <ProductCard product={toProductCard(product)} />
          </button>
          <div className="pointer-events-none absolute top-2 right-2 left-2 flex flex-wrap gap-1">
            {/* ไม่มี variant = ผู้ขายยังลงขายการ์ดใบนี้ไม่ได้ เตือนให้เห็นจากตาราง */}
            {product.variantCount === 0 ? (
              <span className="rounded-full bg-[#fdf0dd] px-2 py-0.5 text-[10px] font-medium text-[#b45309]">
                {t("catalog.products.noVariant", "ยังไม่มี variant")}
              </span>
            ) : null}
            {/* นับเฉพาะที่ผู้ซื้อซื้อได้ตอนนี้ */}
            <span
              className={cn(
                "rounded-full border border-border bg-card px-2 py-0.5 text-[11px] font-medium",
                product.sellerCount === 0
                  ? "text-muted-foreground"
                  : "text-foreground",
              )}
            >
              {product.sellerCount === 0
                ? t("catalog.filters.noSeller", "ไม่มีร้านขาย")
                : t("catalog.products.stock", "{shops} ร้าน · เหลือ {qty} ใบ", { shops: formatCount(product.sellerCount), qty: formatCount(product.availableQuantity) })}
            </span>
            {product.blockedListingCount > 0 ? (
              <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-medium text-rose-700">
                {t("catalog.products.blocked", "ระงับ {count}", { count: formatCount(product.blockedListingCount) })}
              </span>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
