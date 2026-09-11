import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

import type { ProductsData } from "../products.types";

type ProductBulkBarProps = {
  selectedCount: number;
  actions: ProductsData["bulkActions"];
  onClear: () => void;
};

/** แถบสีเขียวที่โผล่มาเมื่อมีสินค้าถูกเลือก — กดติ๊กออกเพื่อล้างการเลือกทั้งหมด */
export function ProductBulkBar({
  selectedCount,
  actions,
  onClear,
}: ProductBulkBarProps) {
  return (
    <div className="flex w-full items-center gap-3 rounded-[10px] bg-[#e6f4f2] px-4 py-3">
      <Checkbox
        checked
        aria-label={`ล้างการเลือก ${selectedCount} รายการ`}
        onCheckedChange={onClear}
      />
      <p className="text-xs font-medium text-teal-600">
        เลือกแล้ว {selectedCount} รายการ
      </p>

      <div className="flex-1" />

      {actions.map((action) => (
        <Button
          key={action.id}
          variant="outline"
          size="sm"
          className="rounded-md px-2.5"
        >
          {action.label}
        </Button>
      ))}
    </div>
  );
}
