import { ImageIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import type { ProductCreateData } from "../../product-create.types";

type CatalogCardSummaryProps = ProductCreateData["catalogCard"];

export function CatalogCardSummary({
  title,
  changeLabel,
  name,
  tags,
}: CatalogCardSummaryProps) {
  return (
    <Card className="w-full gap-3.5 rounded-xl border border-border p-5 shadow-none ring-0">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-zinc-950">{title}</h2>
        <Button variant="outline" size="sm" className="rounded-md px-2.5">
          {changeLabel}
        </Button>
      </div>

      <div className="flex items-center gap-3.5 rounded-[10px] bg-emerald-50 p-3.5">
        <div className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-white">
          <ImageIcon aria-hidden="true" className="size-6 text-slate-500" />
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-[5px]">
          <p className="text-sm font-semibold text-zinc-950">{name}</p>
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <Badge
                key={tag}
                className="h-5 rounded-[5px] bg-white px-2 text-xs text-teal-600"
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
