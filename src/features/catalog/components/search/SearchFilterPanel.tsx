import { useState, type FormEvent, type ReactNode } from "react";
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { categoryLabel } from "@/features/catalog/catalog.mappers";
import type { CardCondition, CategoryDto, GameDto, SearchFacetsDto } from "@/features/catalog/catalog.types";
import { PRICE_PRESETS, SEARCH_CONDITIONS, type SearchFilters } from "@/features/catalog/search.params";
import { useFormat, useTranslate } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const VISIBLE_GAMES = 4;

type Props = {
  filters: SearchFilters;
  facets: SearchFacetsDto | undefined;
  games: GameDto[] | undefined;
  categories: CategoryDto[] | undefined;
  onChange: (patch: Partial<SearchFilters>) => void;
};

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

function Group({ title, children, defaultOpen = true }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="border-t border-border py-4 first:border-t-0 first:pt-0">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between text-sm font-semibold"
      >
        {title}
        {open ? <ChevronUpIcon className="size-4 text-muted-foreground" /> : <ChevronDownIcon className="size-4 text-muted-foreground" />}
      </button>
      {open ? <div className="mt-3">{children}</div> : null}
    </section>
  );
}

function CheckRow({
  id,
  label,
  count,
  checked,
  onToggle,
  indent,
}: {
  id: string;
  label: string;
  count: number | undefined;
  checked: boolean;
  onToggle: () => void;
  indent?: boolean;
}) {
  const format = useFormat();
  const disabled = !checked && count === 0;
  return (
    <label
      htmlFor={id}
      data-disabled={disabled || undefined}
      className={cn(
        "flex min-h-8 cursor-pointer items-center gap-2.5 text-sm data-disabled:cursor-not-allowed data-disabled:opacity-45",
        indent && "pl-6",
      )}
    >
      <Checkbox id={id} checked={checked} disabled={disabled} onCheckedChange={onToggle} />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {count !== undefined ? <span className="text-xs text-muted-foreground">{format.number(count)}</span> : null}
    </label>
  );
}

function Chip({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      disabled={disabled && !active}
      onClick={onClick}
      className={cn(
        "inline-flex h-8 items-center gap-1 rounded-full border px-3 text-[13px] transition-colors disabled:cursor-not-allowed disabled:opacity-45",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background hover:bg-muted",
      )}
    >
      {active ? <CheckIcon className="size-3.5" /> : null}
      {children}
    </button>
  );
}

/**
 * กลุ่มตัวกรองของหน้าค้นหา [TCG-777] — ใช้ทั้ง sidebar (desktop) และ Sheet ล่าง (mobile)
 *
 * ตัวเลขมาจาก `/catalog/products/facets` (นับโดยไม่ใช้ตัวกรองของกลุ่มตัวเอง) ตัวเลือกที่ count = 0
 * และยังไม่ได้เลือก → disabled · ระหว่าง facets โหลดครั้งแรกไม่โชว์ตัวเลข
 *
 * group เกรด / พร้อมส่ง 24 ชม. / ร้านยืนยันตัวตน / ภาษา ซ่อนไว้จนกว่า BE จะมีข้อมูล (SRCH-04 นอกขอบเขต)
 */
export function SearchFilterPanel({ filters, facets, games, categories, onChange }: Props) {
  const { t } = useTranslate("buyer");
  const format = useFormat();
  const [showAllGames, setShowAllGames] = useState(false);

  const gameCount = (id: number) => (facets ? (facets.games.find((item) => item.id === id)?.count ?? 0) : undefined);
  const categoryCount = (id: number) =>
    facets ? (facets.categories.find((item) => item.id === id)?.count ?? 0) : undefined;
  const conditionCount = (code: CardCondition) =>
    facets ? (facets.conditions.find((item) => item.code === code)?.count ?? 0) : undefined;

  // เกมที่มีผลขึ้นก่อน แล้วตามลำดับปกติ — เกมที่เลือกไว้แสดงเสมอแม้อยู่ท้ายรายการ
  const sortedGames = [...(games ?? [])].sort(
    (a, b) => (gameCount(b.id) ?? 0) - (gameCount(a.id) ?? 0) || a.displayOrder - b.displayOrder,
  );
  const visibleGames = showAllGames
    ? sortedGames
    : sortedGames.filter((game, index) => index < VISIBLE_GAMES || filters.games.includes(game.slug));
  const hiddenGames = sortedGames.length - visibleGames.length;

  const parents = (categories ?? []).filter((category) => category.parentId === null);
  const orderedCategories = parents.flatMap((parent) => [
    { category: parent, child: false },
    ...(categories ?? [])
      .filter((category) => category.parentId === parent.id)
      .map((category) => ({ category, child: true })),
  ]);

  return (
    <div className="flex flex-col">
      <Group title={t("search.game", "เกม")}>
        {games === undefined ? (
          <div className="space-y-2">{Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-5 w-40" />)}</div>
        ) : (
          <>
            {visibleGames.map((game) => (
              <CheckRow
                key={game.id}
                id={`game-${game.slug}`}
                label={game.name}
                count={gameCount(game.id)}
                checked={filters.games.includes(game.slug)}
                onToggle={() => onChange({ games: toggle(filters.games, game.slug) })}
              />
            ))}
            {hiddenGames > 0 ? (
              <button type="button" onClick={() => setShowAllGames(true)} className="mt-1 text-xs font-semibold text-primary hover:underline">
                {t("search.filter.moreGames", "+ แสดงเพิ่มอีก {count} เกม", { count: hiddenGames })}
              </button>
            ) : null}
          </>
        )}
      </Group>

      <Group title={t("search.category", "หมวดหมู่")}>
        {categories === undefined ? (
          <div className="space-y-2">{Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-5 w-32" />)}</div>
        ) : (
          orderedCategories.map(({ category, child }) => (
            <CheckRow
              key={category.id}
              id={`category-${category.slug}`}
              label={categoryLabel(category)}
              count={categoryCount(category.id)}
              indent={child}
              checked={filters.category === category.slug}
              onToggle={() => onChange({ category: filters.category === category.slug ? null : category.slug })}
            />
          ))
        )}
      </Group>

      <Group title={t("search.filter.priceRange", "ช่วงราคา (฿)")}>
        <PriceFilter
          key={`${filters.minPrice}-${filters.maxPrice}`}
          min={filters.minPrice}
          max={filters.maxPrice}
          onApply={(minPrice, maxPrice) => onChange({ minPrice, maxPrice })}
        />
        <div className="mt-3 flex flex-wrap gap-2">
          {PRICE_PRESETS.map((preset) => {
            const active = filters.minPrice === preset.min && filters.maxPrice === preset.max;
            const label = !preset.min
              ? `< ${format.money(Number(preset.max))}`
              : !preset.max
                ? `${format.money(Number(preset.min))}+`
                : `${format.money(Number(preset.min))}–${format.money(Number(preset.max))}`;
            return (
              <Chip
                key={label}
                active={active}
                onClick={() => onChange(active ? { minPrice: "", maxPrice: "" } : { minPrice: preset.min, maxPrice: preset.max })}
              >
                {label}
              </Chip>
            );
          })}
        </div>
      </Group>

      <Group title={t("search.filter.condition", "สภาพการ์ด")}>
        <div className="flex flex-wrap gap-2">
          {SEARCH_CONDITIONS.map((condition) => {
            const count = conditionCount(condition);
            return (
              <Chip
                key={condition}
                active={filters.conditions.includes(condition)}
                disabled={count === 0}
                onClick={() => onChange({ conditions: toggle(filters.conditions, condition) })}
              >
                {condition === "SEALED" ? t("condition.sealed", "ซีล") : condition}
              </Chip>
            );
          })}
        </div>
      </Group>

      <Group title={t("search.filter.more", "ตัวเลือกเพิ่มเติม")}>
        <div className="flex flex-col gap-3">
          <label
            className={cn(
              "flex items-center justify-between gap-3 text-sm",
              facets?.onSaleCount === 0 && !filters.onSale && "opacity-45",
            )}
          >
            <span>
              {t("search.filter.onSale", "กำลังลดราคา")}
              {facets ? <span className="ml-1.5 text-xs text-muted-foreground">{format.number(facets.onSaleCount)}</span> : null}
            </span>
            <Switch
              checked={filters.onSale}
              disabled={facets?.onSaleCount === 0 && !filters.onSale}
              onCheckedChange={(checked) => onChange({ onSale: checked })}
            />
          </label>
          <label className="flex items-center justify-between gap-3 text-sm">
            {t("search.filter.inStock", "มีของพร้อมขาย")}
            <Switch checked={filters.inStock} onCheckedChange={(checked) => onChange({ inStock: checked })} />
          </label>
        </div>
      </Group>
    </div>
  );
}

function PriceFilter({ min, max, onApply }: { min: string; max: string; onApply: (min: string, max: string) => void }) {
  const { t } = useTranslate("buyer");
  const [minimum, setMinimum] = useState(min);
  const [maximum, setMaximum] = useState(max);
  const invalid = minimum !== "" && maximum !== "" && Number(minimum) > Number(maximum);

  const apply = (event?: FormEvent) => {
    event?.preventDefault();
    if (invalid || (minimum.trim() === min && maximum.trim() === max)) return;
    onApply(minimum.trim(), maximum.trim());
  };

  return (
    <form onSubmit={apply}>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <Input
          type="number"
          inputMode="numeric"
          min="0"
          aria-label={t("search.minPrice", "ราคาต่ำสุด")}
          placeholder={t("search.filter.minPlaceholder", "ต่ำสุด")}
          value={minimum}
          onChange={(event) => setMinimum(event.target.value)}
          onBlur={() => apply()}
          className="bg-background"
        />
        <span className="text-muted-foreground">–</span>
        <Input
          type="number"
          inputMode="numeric"
          min="0"
          aria-label={t("search.maxPrice", "ราคาสูงสุด")}
          placeholder={t("search.filter.maxPlaceholder", "สูงสุด")}
          value={maximum}
          onChange={(event) => setMaximum(event.target.value)}
          onBlur={() => apply()}
          className="bg-background"
        />
      </div>
      {invalid ? (
        <p role="alert" className="mt-2 text-xs text-destructive">
          {t("search.priceRangeInvalid", "ราคาต่ำสุดต้องไม่มากกว่าราคาสูงสุด")}
        </p>
      ) : null}
      <button type="submit" className="sr-only">
        {t("search.applyFilter", "ใช้ตัวกรอง")}
      </button>
    </form>
  );
}
