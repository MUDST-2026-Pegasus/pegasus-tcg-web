import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

import { formatCount } from "../catalog.format";
import type { Game } from "../catalog.types";

import { GameAvatar } from "./GameAvatar";

type GameInfoCardProps = {
  game: Game;
  productCount: number | undefined;
  cardSetCount: number | undefined;
  onEdit: () => void;
  /** สลับ `active` — เปิด = ขายบนหน้าร้าน ปิด = ซ่อน (เกมลบไม่ได้เพราะสินค้าชี้อยู่) */
  onToggleActive: (active: boolean) => void;
  isToggling: boolean;
};

/** การ์ดหัวของเกมที่เลือก — ตัวตน สถิติ และสวิตช์ขายบนหน้าร้าน */
export function GameInfoCard({
  game,
  productCount,
  cardSetCount,
  onEdit,
  onToggleActive,
  isToggling,
}: GameInfoCardProps) {
  const meta = [`รหัส ${game.code}`, `/${game.slug}`, game.nameLocal]
    .filter(Boolean)
    .join("  ·  ");

  return (
    <Card className="flex-row flex-wrap items-center gap-4 rounded-xl border border-border p-5 shadow-none ring-0">
      <GameAvatar game={game} size="lg" highlighted />

      <div className="flex min-w-[180px] flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-[17px] font-semibold text-foreground">
            {game.name}
          </h2>
          <Badge
            variant="outline"
            className="h-5 gap-1.5 rounded-[5px] px-1.5 text-[10px] font-medium"
          >
            <span
              aria-hidden="true"
              className={cn(
                "size-1.5 rounded-full",
                game.active ? "bg-[#16a34a]" : "bg-[#9aa5ad]",
              )}
            />
            {game.active ? "เปิดขายอยู่" : "ซ่อนจากหน้าร้าน"}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">{meta}</p>
      </div>

      <dl className="flex gap-6 border-border pr-2 sm:border-l sm:pl-4">
        <Stat label="สินค้าในแคตตาล็อก" value={productCount} />
        <Stat label="ชุดการ์ด" value={cardSetCount} />
      </dl>

      <div className="flex items-center gap-3 border-border sm:border-l sm:pl-4">
        <label className="flex items-center gap-2 text-xs text-[#414755]">
          แสดงบนหน้าร้าน
          <Switch
            checked={game.active}
            disabled={isToggling}
            onCheckedChange={(checked) => onToggleActive(checked)}
          />
        </label>
        <Button variant="outline" className="rounded-md px-2.5" onClick={onEdit}>
          แก้ไขข้อมูลเกม
        </Button>
      </div>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: number | undefined }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="order-2 text-[11px] text-muted-foreground">{label}</dt>
      <dd className="order-1 text-[15px] font-semibold text-foreground">
        {value === undefined ? "—" : formatCount(value)}
      </dd>
    </div>
  );
}
