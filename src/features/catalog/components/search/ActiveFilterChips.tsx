import { XIcon } from "lucide-react";

import { categoryLabel } from "@/features/catalog/catalog.mappers";
import type { CategoryDto, GameDto } from "@/features/catalog/catalog.types";
import type { SearchFilters } from "@/features/catalog/search.params";
import { useFormat, useTranslate } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Chip = { key: string; label: string; remove: Partial<SearchFilters> };

/** chip ตัวกรองที่ใช้อยู่ — × ลบทีละตัว, hover เป็นสี destructive [TCG-777] */
export function ActiveFilterChips({
  filters,
  games,
  categories,
  onChange,
  onClear,
  className,
}: {
  filters: SearchFilters;
  games: GameDto[] | undefined;
  categories: CategoryDto[] | undefined;
  onChange: (patch: Partial<SearchFilters>) => void;
  onClear: () => void;
  className?: string;
}) {
  const { t } = useTranslate("buyer");
  const format = useFormat();

  const chips: Chip[] = [
    ...filters.games.map((slug) => ({
      key: `game-${slug}`,
      label: games?.find((game) => game.slug === slug)?.name ?? slug,
      remove: { games: filters.games.filter((item) => item !== slug) },
    })),
    ...(filters.category
      ? [
          {
            key: "category",
            label: (() => {
              const category = categories?.find((item) => item.slug === filters.category);
              return category ? categoryLabel(category) : filters.category;
            })(),
            remove: { category: null },
          },
        ]
      : []),
    ...filters.conditions.map((condition) => ({
      key: `condition-${condition}`,
      label: condition === "SEALED" ? t("condition.sealed", "ซีล") : condition,
      remove: { conditions: filters.conditions.filter((item) => item !== condition) },
    })),
    ...(filters.minPrice || filters.maxPrice
      ? [
          {
            key: "price",
            label: !filters.minPrice
              ? `< ${format.money(Number(filters.maxPrice))}`
              : !filters.maxPrice
                ? `${format.money(Number(filters.minPrice))}+`
                : `${format.money(Number(filters.minPrice))}–${format.money(Number(filters.maxPrice))}`,
            remove: { minPrice: "", maxPrice: "" },
          },
        ]
      : []),
    ...(filters.onSale
      ? [{ key: "onSale", label: t("search.filter.onSale", "กำลังลดราคา"), remove: { onSale: false } }]
      : []),
    ...(filters.inStock
      ? [{ key: "inStock", label: t("search.filter.inStock", "มีของพร้อมขาย"), remove: { inStock: false } }]
      : []),
  ];

  if (chips.length === 0) return null;

  return (
    <div className={cn("flex items-center gap-2", className)} aria-label={t("search.filter.active", "ตัวกรองที่ใช้อยู่")}>
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={() => onChange(chip.remove)}
          aria-label={t("search.filter.remove", "เอา “{label}” ออก", { label: chip.label })}
          className="group inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-border bg-background px-3 text-[13px] transition-colors hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
        >
          {chip.label}
          <XIcon className="size-3.5" />
        </button>
      ))}
      <button type="button" onClick={onClear} className="shrink-0 px-1 text-[13px] font-semibold text-primary hover:underline">
        {t("search.filter.clearAll", "ล้างทั้งหมด")}
      </button>
    </div>
  );
}
