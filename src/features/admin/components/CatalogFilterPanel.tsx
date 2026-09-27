import type { QueryLike } from "@/components/common";
import { Card } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { formatCount } from "../catalog.format";
import type { CatalogCounts } from "../catalog.queries";
import type { CardSet, Game } from "../catalog.types";

const ALL_SETS = "all";

type CatalogFilterPanelProps = {
  games: Game[];
  activeGameId: number;
  onGameChange: (gameId: number) => void;
  counts: CatalogCounts;
  cardSets: QueryLike<CardSet[]>;
  /** `null` = ทุกชุด */
  activeSetId: number | null;
  onSetChange: (cardSetId: number | null) => void;
};

/**
 * คอลัมน์ตัวกรองด้านซ้ายของหน้าแคตตาล็อก (กว้าง 236px ตามดีไซน์)
 *
 * ดีไซน์วาด "กรองตามชุด" เป็น checkbox แต่ `GET /admin/catalog/products` รับ
 * `cardSetId` ได้ทีละค่า จึงเป็นตัวเลือกเดียว (radio) มี "ทุกชุด" ไว้ยกเลิก
 */
export function CatalogFilterPanel({
  games,
  activeGameId,
  onGameChange,
  counts,
  cardSets,
  activeSetId,
  onSetChange,
}: CatalogFilterPanelProps) {
  const activeGames = games.filter((game) => game.active).length;
  const retiredGames = games.length - activeGames;

  return (
    <div className="flex w-full flex-col gap-4 lg:w-[236px] lg:shrink-0">
      {/* รายชื่อเกม */}
      <Card className="gap-0 rounded-xl border border-border p-0 shadow-none ring-0">
        <div className="flex flex-col gap-0.5 px-4 pt-4 pb-3">
          <p className="text-sm font-semibold text-foreground">เกมทั้งหมด</p>
          <p className="text-[11px] text-muted-foreground">
            {activeGames} เกมที่เปิดใช้งาน
            {retiredGames > 0 ? ` · ปิดแล้ว ${retiredGames}` : ""}
          </p>
        </div>

        <ul className="flex flex-col gap-0.5 px-2 pb-3">
          {games.map((game) => {
            const isActive = game.id === activeGameId;
            const count = counts.byGame[game.id];

            return (
              <li key={game.id}>
                <button
                  type="button"
                  aria-current={isActive ? "true" : undefined}
                  onClick={() => onGameChange(game.id)}
                  className={cn(
                    "flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg px-2.5 py-[9px] text-left transition-colors",
                    isActive
                      ? "bg-[#e8f1fc]"
                      : "hover:bg-[#eef1f2] focus-visible:bg-[#eef1f2]",
                  )}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      aria-hidden="true"
                      className={cn(
                        "size-[7px] shrink-0 rounded-full",
                        isActive ? "bg-[#0058bc]" : "bg-[#9aa5ad]",
                      )}
                    />
                    <span
                      className={cn(
                        "truncate text-xs",
                        isActive
                          ? "font-medium text-[#0058bc]"
                          : "text-[#414755]",
                        !game.active && "line-through decoration-[#9aa5ad]",
                      )}
                    >
                      {game.name}
                    </span>
                    {!game.active ? (
                      <span className="shrink-0 text-[10px] text-[#9aa5ad]">
                        ปิดแล้ว
                      </span>
                    ) : null}
                  </span>
                  <span
                    className={cn(
                      "text-[11px] tabular-nums",
                      isActive ? "text-[#0058bc]" : "text-[#9aa5ad]",
                    )}
                  >
                    {count === undefined ? "…" : formatCount(count)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </Card>

      {/* กรองตามชุด */}
      <Card className="gap-3 rounded-xl border border-border p-4 shadow-none ring-0">
        <p className="text-[13px] font-semibold text-foreground">
          กรองตามชุด (Set)
        </p>
        {/* ไม่ใช้ QueryBoundary — ErrorState สูงครึ่งจอ ใหญ่เกินกล่องแคบ ๆ นี้ */}
        {cardSets.isPending ? (
          <div className="flex flex-col gap-[9px]">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="h-4 w-36" />
            ))}
          </div>
        ) : cardSets.data === undefined ? (
          <p className="text-xs text-muted-foreground">
            โหลดรายชื่อชุดไม่สำเร็จ{" "}
            <button
              type="button"
              onClick={() => cardSets.refetch()}
              className="cursor-pointer font-medium text-[#0058bc] underline-offset-2 hover:underline"
            >
              ลองใหม่
            </button>
          </p>
        ) : cardSets.data.length === 0 ? (
          <p className="text-xs text-muted-foreground">เกมนี้ยังไม่มีชุดการ์ด</p>
        ) : (
          <RadioGroup
            aria-label="กรองตามชุด"
            value={activeSetId === null ? ALL_SETS : String(activeSetId)}
            onValueChange={(value) =>
              onSetChange(value === ALL_SETS ? null : Number(value))
            }
            // ชุดของเกมหนึ่งมีได้เป็นร้อย เลื่อนในกล่องแทนดันทั้งหน้าให้ยาว
            // py-2 เผื่อพื้นที่กดของ radio (after:-inset-y-2) ไม่งั้นล้นแล้วกล่องเลื่อนเอง
            className="-my-2 max-h-72 gap-[9px] overflow-x-hidden overflow-y-auto py-2"
          >
            <SetOption id="card-set-all" value={ALL_SETS} label="ทุกชุด" />
            {cardSets.data.map((set) => (
              <SetOption
                key={set.id}
                id={`card-set-${set.id}`}
                value={String(set.id)}
                label={set.name}
                hint={set.code}
              />
            ))}
          </RadioGroup>
        )}
      </Card>

      {/* ตัวเลขสรุป */}
      <div className="flex flex-col gap-1.5 rounded-xl bg-[#e8f1fc] p-4 text-[#0058bc]">
        <p className="text-[11px] font-medium">สินค้าในแคตตาล็อก</p>
        <p className="text-2xl font-bold tracking-[-0.5px]">
          {counts.total === undefined ? "…" : formatCount(counts.total)}
        </p>
        <p className="text-[11px]">ทุกเกมรวมกัน นับรวมที่ปิดใช้งาน</p>
      </div>
    </div>
  );
}

function SetOption({
  id,
  value,
  label,
  hint,
}: {
  id: string;
  value: string;
  label: string;
  hint?: string;
}) {
  return (
    <Field orientation="horizontal" className="gap-2">
      <RadioGroupItem id={id} value={value} />
      <FieldLabel
        htmlFor={id}
        className="min-w-0 text-xs font-normal text-[#414755]"
      >
        <span className="truncate">{label}</span>
        {hint ? (
          <span className="shrink-0 text-[10px] text-[#9aa5ad]">{hint}</span>
        ) : null}
      </FieldLabel>
    </Field>
  );
}
