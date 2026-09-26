import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { formatCount } from "../catalog.format";
import type { Game } from "../catalog.types";
import { ATTRIBUTE_TYPE_LABEL, ATTRIBUTE_TYPES } from "../taxonomy.format";

import { FieldTypeBadge } from "./FieldTypeBadge";
import { GameAvatar } from "./GameAvatar";

type GameListPanelProps = {
  games: Game[];
  activeGameId: number;
  onSelectGame: (gameId: number) => void;
  onAddGame: () => void;
  /** `gameId` → จำนวนฟิลด์ — ยังโหลดไม่เสร็จก็ไม่ต้องโชว์ */
  fieldCounts: Record<number, number>;
  /** `gameId` → จำนวนการ์ดในแคตตาล็อก */
  productCounts: Record<number, number>;
  /** การ์ด "ประเภทฟิลด์ที่รองรับ" เกี่ยวกับแท็บฟิลด์เท่านั้น */
  showFieldTypes: boolean;
};

/** คอลัมน์ซ้าย — รายชื่อเกมทั้งหมด (รวมที่ปิดอยู่) + คำอธิบายชนิดฟิลด์ (กว้าง 224px ตามดีไซน์) */
export function GameListPanel({
  games,
  activeGameId,
  onSelectGame,
  onAddGame,
  fieldCounts,
  productCounts,
  showFieldTypes,
}: GameListPanelProps) {
  return (
    <div className="flex w-full flex-col gap-4 lg:w-[224px] lg:shrink-0">
      <Card className="gap-0 rounded-xl border border-border p-0 shadow-none ring-0">
        <div className="flex items-center justify-between gap-2 px-4 pt-3 pb-2">
          <p className="text-[13px] font-semibold text-foreground">
            เกมทั้งหมด ({games.length})
          </p>
          <Button
            variant="outline"
            size="sm"
            className="rounded-md px-2.5"
            onClick={onAddGame}
          >
            + เพิ่มเกม
          </Button>
        </div>

        <ul className="flex flex-col gap-0.5 px-2 pb-3">
          {games.map((game) => {
            const isActive = game.id === activeGameId;
            const meta = [
              fieldCounts[game.id] === undefined
                ? null
                : `${fieldCounts[game.id]} ฟิลด์`,
              game.active
                ? productCounts[game.id] === undefined
                  ? null
                  : `${formatCount(productCounts[game.id])} การ์ด`
                : "ซ่อนจากหน้าร้าน",
            ]
              .filter(Boolean)
              .join(" · ");

            return (
              <li key={game.id}>
                <button
                  type="button"
                  aria-current={isActive ? "true" : undefined}
                  onClick={() => onSelectGame(game.id)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[9px] text-left transition-colors",
                    isActive
                      ? "bg-[#e8f1fc]"
                      : "hover:bg-[#eef1f2] focus-visible:bg-[#eef1f2]",
                    !game.active && !isActive && "opacity-60",
                  )}
                >
                  <GameAvatar game={game} size="sm" highlighted={isActive} />
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span
                      className={cn(
                        "truncate text-xs",
                        isActive
                          ? "font-medium text-[#0058bc]"
                          : "text-[#414755]",
                      )}
                    >
                      {game.name}
                    </span>
                    <span
                      className={cn(
                        "truncate text-[10px]",
                        isActive ? "text-[#0058bc]" : "text-[#9aa5ad]",
                      )}
                    >
                      {meta || " "}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </Card>

      {showFieldTypes && (
        <Card className="gap-2 rounded-xl border border-border p-4 shadow-none ring-0">
          <p className="text-xs font-semibold text-foreground">
            ประเภทฟิลด์ที่รองรับ
          </p>
          <ul className="flex flex-col gap-2">
            {ATTRIBUTE_TYPES.map((type) => (
              <li key={type} className="flex items-center gap-2">
                <FieldTypeBadge type={type} />
                <span className="text-[11px] text-muted-foreground">
                  {ATTRIBUTE_TYPE_LABEL[type]}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
