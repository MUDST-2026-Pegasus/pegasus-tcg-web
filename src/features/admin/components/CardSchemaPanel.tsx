import { Card } from "@/components/ui/card";
import type {
  AdminCardAttributesData,
  CardSchemaGame,
} from "@/features/admin/admin.types";
import { FieldTypeBadge } from "@/features/admin/components/FieldTypeBadge";
import { cn } from "@/lib/utils";

type CardSchemaPanelProps = Pick<
  AdminCardAttributesData,
  "gamePicker" | "fieldTypes"
> & {
  games: CardSchemaGame[];
  activeGameId: string;
  onSelectGame: (gameId: string) => void;
};

/** คอลัมน์ซ้ายของหน้าคุณสมบัติการ์ด — เลือกเกม + คำอธิบายชนิดฟิลด์ (กว้าง 224px ตามดีไซน์) */
export function CardSchemaPanel({
  gamePicker,
  fieldTypes,
  games,
  activeGameId,
  onSelectGame,
}: CardSchemaPanelProps) {
  return (
    <div className="flex w-full flex-col gap-4 lg:w-[224px] lg:shrink-0">
      {/* เลือกเกม */}
      <Card className="gap-0 rounded-xl border border-border p-0 shadow-none ring-0">
        <div className="px-4 pt-4 pb-2.5">
          <p className="text-[13px] font-semibold text-foreground">
            {gamePicker.title}
          </p>
        </div>

        <ul className="flex flex-col gap-0.5 px-2 pb-3">
          {games.map((game) => {
            const isActive = game.id === activeGameId;

            return (
              <li key={game.id}>
                <button
                  type="button"
                  aria-current={isActive ? "true" : undefined}
                  onClick={() => onSelectGame(game.id)}
                  className={cn(
                    "flex w-full flex-col gap-0.5 rounded-lg px-2.5 py-[9px] text-left transition-colors",
                    isActive
                      ? "bg-[#e8f1fc]"
                      : "hover:bg-[#eef1f2] focus-visible:bg-[#eef1f2]",
                  )}
                >
                  <span
                    className={cn(
                      "text-xs",
                      isActive
                        ? "font-medium text-[#0058bc]"
                        : "text-[#414755]",
                    )}
                  >
                    {game.name}
                  </span>
                  {/* จำนวนฟิลด์คิดจาก schema จริง ไม่ต้องมานั่งแก้ตัวเลขตามเวลาเพิ่มฟิลด์ */}
                  <span
                    className={cn(
                      "text-[10px]",
                      isActive ? "text-[#0058bc]" : "text-[#9aa5ad]",
                    )}
                  >
                    {game.fields.length} ฟิลด์
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </Card>

      {/* ประเภทฟิลด์ที่รองรับ */}
      <Card className="gap-2 rounded-xl border border-border p-4 shadow-none ring-0">
        <p className="text-xs font-semibold text-foreground">
          {fieldTypes.title}
        </p>
        <ul className="flex flex-col gap-2">
          {fieldTypes.items.map((item) => (
            <li key={item.type} className="flex items-center gap-2">
              <FieldTypeBadge type={item.type} />
              <span className="text-[11px] text-muted-foreground">
                {item.description}
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
