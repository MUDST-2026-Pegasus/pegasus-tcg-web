import { ImageIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import type { SelectedCard } from "../../listing-form.types";

type CatalogCardSummaryProps = {
  title: string;
  card: SelectedCard;
  /** ไม่ส่งมา = ซ่อนปุ่มเปลี่ยนการ์ด (หน้าแก้ไข — เปลี่ยนการ์ดต้องลงประกาศใหม่) */
  onChange?: () => void;
};

/** การ์ดที่เลือกจากแคตตาล็อก — รูปทางการ ชื่อ พิมพ์ และ SKU ที่ประกาศจะชี้ไป */
export function CatalogCardSummary({
  title,
  card,
  onChange,
}: CatalogCardSummaryProps) {
  const tags = [card.variantLabel, ...card.tags, card.sku];

  return (
    <Card className="w-full gap-3.5 rounded-xl border border-border p-5 shadow-none ring-0">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {onChange ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-md px-2.5"
            onClick={onChange}
          >
            เปลี่ยนการ์ด
          </Button>
        ) : null}
      </div>

      <div className="flex items-center gap-3.5 rounded-[10px] bg-emerald-50 p-3.5">
        <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-card">
          {card.imageUrl ? (
            <img
              src={card.imageUrl}
              alt={card.productName}
              className="size-full object-contain"
            />
          ) : (
            <ImageIcon aria-hidden="true" className="size-6 text-slate-500" />
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-[5px]">
          <p className="text-sm font-semibold text-foreground">
            {card.productName}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <Badge
                key={tag}
                className="h-5 rounded-[5px] bg-card px-2 text-xs text-teal-600"
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
