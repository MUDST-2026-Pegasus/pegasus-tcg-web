import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import type { SellerShopData } from "@/features/seller/seller.types";
import { cn } from "@/lib/utils";

type SellerShopVerificationCardProps = SellerShopData["verification"];

export function SellerShopVerificationCard({
  title,
  statusLabel,
  items,
}: SellerShopVerificationCardProps) {
  return (
    <Card className="w-full gap-3.5 rounded-xl border border-border p-5 shadow-none ring-0">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-zinc-950">{title}</p>
        <Badge className="h-5 rounded-full bg-[#e3f4ec] px-2 text-xs text-[#12805c]">
          {statusLabel}
        </Badge>
      </div>

      {items.map((item) => (
        <div key={item.id} className="flex items-center gap-2">
          <Checkbox
            checked={item.verified}
            disabled
            className="size-4 rounded-full disabled:opacity-100"
          />
          <p
            className={cn(
              "flex-1 text-xs",
              item.verified ? "text-gray-700" : "text-gray-400",
            )}
          >
            {item.label}
          </p>
        </div>
      ))}
    </Card>
  );
}
