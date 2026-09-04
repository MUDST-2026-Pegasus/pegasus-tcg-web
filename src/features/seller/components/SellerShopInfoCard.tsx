import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { SellerShopData } from "@/features/seller/seller.types";

type SellerShopInfoCardProps = SellerShopData["info"];

export function SellerShopInfoCard({
  title,
  description,
  fields,
}: SellerShopInfoCardProps) {
  return (
    <Card className="w-full gap-4 rounded-xl border border-border p-5 shadow-none ring-0">
      <div className="flex flex-col gap-[3px]">
        <p className="text-base font-semibold text-zinc-950">{title}</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>

      {fields.map((field) => (
        <div key={field.id} className="flex flex-col gap-1.5">
          <label
            htmlFor={field.id}
            className="text-xs font-medium text-gray-700"
          >
            {field.label}
          </label>
          <Input
            id={field.id}
            defaultValue={field.value}
            className="h-9 rounded-lg border-input bg-background px-2.5 py-1 text-sm text-zinc-950"
          />
          <p className="text-[10px] text-gray-400">{field.helper}</p>
        </div>
      ))}
    </Card>
  );
}
