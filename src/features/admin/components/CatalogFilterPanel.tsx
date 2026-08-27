import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel } from "@/components/ui/field";
import type { AdminCatalogData } from "@/features/admin/admin.types";
import { cn } from "@/lib/utils";

type CatalogFilterPanelProps = Pick<
  AdminCatalogData,
  "games" | "sets" | "summary"
>;

/** คอลัมน์ตัวกรองด้านซ้ายของหน้าแคตตาล็อก (กว้าง 236px ตามดีไซน์) */
export function CatalogFilterPanel({
  games,
  sets,
  summary,
}: CatalogFilterPanelProps) {
  return (
    <div className="flex w-full flex-col gap-4 lg:w-[236px] lg:shrink-0">
      {/* รายชื่อเกม */}
      <Card className="gap-0 rounded-xl border border-border p-0 shadow-none ring-0">
        <div className="flex flex-col gap-0.5 px-4 pt-4 pb-3">
          <p className="text-sm font-semibold text-foreground">{games.title}</p>
          <p className="text-[11px] text-muted-foreground">
            {games.description}
          </p>
        </div>

        <ul className="flex flex-col gap-0.5 px-2 pb-3">
          {games.items.map((game) => {
            const isActive = game.id === games.activeId;

            return (
              <li key={game.id}>
                <button
                  type="button"
                  aria-current={isActive ? "true" : undefined}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-[9px] text-left transition-colors",
                    isActive
                      ? "bg-[#e8f1fc]"
                      : "hover:bg-[#eef1f2] focus-visible:bg-[#eef1f2]",
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span
                      aria-hidden="true"
                      className={cn(
                        "size-[7px] shrink-0 rounded-full",
                        isActive ? "bg-[#0058bc]" : "bg-[#9aa5ad]",
                      )}
                    />
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
                  </span>
                  <span
                    className={cn(
                      "text-[11px] tabular-nums",
                      isActive ? "text-[#0058bc]" : "text-[#9aa5ad]",
                    )}
                  >
                    {game.count}
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
          {sets.title}
        </p>
        <div className="flex flex-col gap-[9px]">
          {sets.items.map((set) => (
            <Field key={set.id} orientation="horizontal" className="gap-2">
              <Checkbox id={set.id} defaultChecked={set.defaultChecked} />
              <FieldLabel
                htmlFor={set.id}
                className="text-xs font-normal text-[#414755]"
              >
                {set.name}
              </FieldLabel>
            </Field>
          ))}
        </div>
      </Card>

      {/* ตัวเลขสรุป */}
      <div className="flex flex-col gap-1.5 rounded-xl bg-[#e8f1fc] p-4 text-[#0058bc]">
        <p className="text-[11px] font-medium">{summary.label}</p>
        <p className="text-2xl font-bold tracking-[-0.5px]">{summary.value}</p>
        <p className="text-[11px]">{summary.footnote}</p>
      </div>
    </div>
  );
}
