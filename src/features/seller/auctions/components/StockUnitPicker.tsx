import { useEffect, useState } from "react";
import { ArrowRight, Lock, Search } from "lucide-react";
import { Link } from "react-router-dom";

import { EmptyState } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { formatBaht } from "@/features/auction/auction.format";
import { useEligibleUnits } from "@/features/auction/auction.queries";
import type { EligibleUnit } from "@/features/auction/auction.types";
import type { CardCondition } from "@/features/catalog/catalog.types";
import { useGameList } from "@/features/catalog/catalog.queries";
import { CARD_CONDITIONS } from "@/features/seller/products/listing-form.format";
import { cn } from "@/lib/utils";

import { isSelectableUnit } from "../auction-form.schema";
import { AuctionFieldError } from "./AuctionFieldError";
import { intlLocale } from "@/lib/i18n";

const RESTOCK_PATH = "/seller/products";
const ALL = "ALL";

type StockUnitPickerProps = {
  value: string | null;
  onSelect: (unit: EligibleUnit) => void;
  error?: string;
};

/** ขั้น 1 · เลือกการ์ดจากสต็อก (Figma S2a) [TCG-633 · FE-7] */
export function StockUnitPicker({ value, onSelect, error }: StockUnitPickerProps) {
  const [text, setText] = useState("");
  const [q, setQ] = useState("");
  const [gameId, setGameId] = useState<string>(ALL);
  const [condition, setCondition] = useState<string>(ALL);

  // ส่งคำค้นเมื่อหยุดพิมพ์ 300ms
  useEffect(() => {
    const timer = setTimeout(() => setQ(text.trim()), 300);
    return () => clearTimeout(timer);
  }, [text]);

  const units = useEligibleUnits({
    q: q || undefined,
    gameId: gameId === ALL ? undefined : Number(gameId),
    condition: condition === ALL ? undefined : (condition as CardCondition),
  });
  const games = useGameList();

  const filtered = q !== "" || gameId !== ALL || condition !== ALL;
  const items = units.data?.page.items ?? [];
  const nothingToAuction = units.data !== undefined && !filtered && !items.some(isSelectableUnit);

  if (nothingToAuction) {
    return (
      <EmptyState
        icon={Lock}
        title="ไม่มีการ์ดที่นำมาประมูลได้"
        description="การ์ดทุกใบอยู่ในคำสั่งซื้อหรือประมูลอื่น หรือสต็อกยังว่าง"
        className="min-h-80 rounded-xl bg-card"
      >
        <Button variant="outline" size="sm" className="rounded-md px-2.5" nativeButton={false} render={<Link to={RESTOCK_PATH} />}>
          เติมสต็อก
        </Button>
      </EmptyState>
    );
  }

  const gameItems = [{ value: ALL, label: "เกม: ทั้งหมด" }, ...(games.data ?? []).map((game) => ({ value: String(game.id), label: `เกม: ${game.name}` }))];
  const conditionItems = [{ value: ALL, label: "สภาพ: ทั้งหมด" }, ...CARD_CONDITIONS.map((code) => ({ value: code, label: `สภาพ: ${code}` }))];

  return (
    <Card className="w-full gap-4 rounded-xl border border-border p-5 shadow-none ring-0">
      <div className="flex flex-col gap-1">
        <h2 className="text-sm font-bold text-foreground">เลือกการ์ดจากสต็อกของคุณ</h2>
        <p className="text-xs text-muted-foreground">เลือกได้ 1 ใบต่อการประมูล · แสดงเฉพาะการ์ดที่อยู่กับคุณและยังไม่ได้ขายหรือประมูล</p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            aria-label="ค้นหาการ์ดในสต็อก"
            placeholder="ค้นหาชื่อการ์ด เลขการ์ด หรือรหัสใบ…"
            value={text}
            onChange={(event) => setText(event.target.value)}
            className="h-9 rounded-lg border-input bg-background pl-9 text-sm"
          />
        </div>
        <FilterSelect label="เกม" items={gameItems} value={gameId} onChange={setGameId} />
        <FilterSelect label="สภาพ" items={conditionItems} value={condition} onChange={setCondition} />
      </div>

      {units.isPending ? (
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((key) => (
            <Skeleton key={key} className="h-[68px] w-full rounded-xl" />
          ))}
        </div>
      ) : units.isError ? (
        <p className="rounded-lg bg-red-50 px-3.5 py-3 text-xs text-destructive">โหลดการ์ดในสต็อกไม่สำเร็จ ลองใหม่อีกครั้ง</p>
      ) : items.length === 0 ? (
        <p className="rounded-lg bg-neutral-50 px-3.5 py-6 text-center text-xs text-muted-foreground">ไม่พบการ์ดที่ตรงกับคำค้นหรือตัวกรอง</p>
      ) : (
        <RadioGroup
          aria-label="การ์ดในสต็อก"
          value={value ?? ""}
          onValueChange={(next) => {
            const unit = items.find((item) => item.unitUid === next);
            if (unit && isSelectableUnit(unit)) onSelect(unit);
          }}
          className={cn("flex flex-col gap-3", units.isPlaceholderData && "opacity-60")}
        >
          {items.map((unit) => (
            <UnitRow key={unit.unitUid} unit={unit} selected={unit.unitUid === value} />
          ))}
        </RadioGroup>
      )}

      <AuctionFieldError message={error} />

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <p className="text-muted-foreground">
          {units.data ? `แสดง ${items.length.toLocaleString(intlLocale())} จาก ${units.data.totalInStock.toLocaleString(intlLocale())} ใบในสต็อก` : null}
        </p>
        <Link to={RESTOCK_PATH} className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
          ไม่มีการ์ดที่ต้องการ? เติมสต็อก
          <ArrowRight aria-hidden className="size-3.5" />
        </Link>
      </div>
    </Card>
  );
}

function UnitRow({ unit, selected }: { unit: EligibleUnit; selected: boolean }) {
  const selectable = isSelectableUnit(unit);
  const { item } = unit;
  return (
    <label
      className={cn(
        "flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors",
        selected ? "border-teal-700 bg-teal-50" : "border-border bg-card",
        selectable ? "cursor-pointer hover:border-teal-700/50" : "cursor-not-allowed opacity-60",
      )}
    >
      <RadioGroupItem value={unit.unitUid} disabled={!selectable} className="border-input bg-background data-checked:border-teal-700" />
      <div className="h-12 w-9 shrink-0 overflow-hidden rounded bg-secondary">
        {item.card.officialImageUrl ? <img src={item.card.officialImageUrl} alt="" className="size-full object-cover" loading="lazy" /> : null}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="truncate text-sm font-semibold text-foreground">{item.card.productName}</p>
        <p className="truncate text-xs text-muted-foreground">
          {item.cardNumber} · {item.condition} · ใบ {unit.unitLabel}
        </p>
        {unit.availability === "LISTED" ? (
          <p className="w-fit rounded bg-amber-50 px-1.5 py-0.5 text-[11px] font-medium text-amber-800">
            วางขายในหน้าร้านอยู่ — จะถูกถอดออกจากประกาศขายเมื่อเปิดประมูล
          </p>
        ) : null}
      </div>
      {selectable ? (
        <div className="flex shrink-0 flex-col items-end gap-0.5 text-right">
          <p className="text-sm font-bold text-foreground tabular-nums">ตลาด {unit.marketGuide ? formatBaht(unit.marketGuide.median) : "—"}</p>
          {unit.unitCost !== null ? <p className="text-xs text-muted-foreground tabular-nums">ทุน {formatBaht(unit.unitCost)}</p> : null}
        </div>
      ) : (
        <p className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
          <Lock aria-hidden className="size-3.5" />
          {unit.availability === "IN_AUCTION" ? "อยู่ในประมูล" : "จองในคำสั่งซื้อ"} {unit.heldBy ?? ""}
        </p>
      )}
    </label>
  );
}

function FilterSelect({
  label,
  items,
  value,
  onChange,
}: {
  label: string;
  items: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Select items={items} value={value} onValueChange={(next) => onChange(next ?? ALL)}>
      <SelectTrigger aria-label={label} className="h-9 w-full rounded-lg border-input bg-background text-sm sm:w-40">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
