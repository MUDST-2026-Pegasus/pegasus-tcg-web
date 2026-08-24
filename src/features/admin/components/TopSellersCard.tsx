import { Card } from "@/components/ui/card";
import type { TopSeller } from "@/features/admin/admin.types";
import { cn } from "@/lib/utils";

type TopSellersCardProps = {
  title: string;
  description: string;
  items: TopSeller[];
};

const HIGHLIGHT_RANK = 3;

export function TopSellersCard({
  title,
  description,
  items,
}: TopSellersCardProps) {
  return (
    <Card className="min-w-0 flex-1 gap-4 rounded-xl border border-border p-5 shadow-none ring-0">
      <div className="flex flex-col gap-0.5">
        <p className="text-[15px] font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>

      <ol className="flex flex-col gap-3.5">
        {items.map((seller, index) => {
          const isTop = index < HIGHLIGHT_RANK;

          return (
            <li key={seller.id} className="flex flex-col gap-[7px]">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "flex size-5 items-center justify-center rounded-md text-[11px] font-bold",
                      isTop
                        ? "bg-[#e8f1fc] text-primary"
                        : "bg-[#eef1f2] text-muted-foreground",
                    )}
                  >
                    {index + 1}
                  </span>
                  <p className="text-[13px] font-medium text-foreground">
                    {seller.name}
                  </p>
                </div>
                <p className="text-[13px] font-semibold text-foreground tabular-nums">
                  {seller.amount}
                </p>
              </div>

              <div
                className="h-1.5 w-full overflow-hidden rounded-full bg-[#eef1f2]"
                role="presentation"
              >
                <div
                  style={{ width: `${seller.percent}%` }}
                  className={cn(
                    "h-full rounded-full",
                    isTop ? "bg-primary" : "bg-[#9aa5ad]",
                  )}
                />
              </div>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
