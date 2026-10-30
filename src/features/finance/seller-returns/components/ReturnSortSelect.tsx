import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { ReturnSortOrder } from "../useSellerReturns";

const SORT_OPTIONS: { value: ReturnSortOrder; label: string }[] = [
  { value: "longest_first", label: "เรียง: รอนานสุดก่อน" },
  { value: "newest_first", label: "เรียง: ใหม่สุดก่อน" },
];

interface ReturnSortSelectProps {
  value: ReturnSortOrder;
  onChange: (value: ReturnSortOrder) => void;
}

export function ReturnSortSelect({ value, onChange }: ReturnSortSelectProps) {
  return (
    <Select
      items={SORT_OPTIONS}
      value={value}
      onValueChange={(next) => {
        if (next !== null) onChange(next as ReturnSortOrder);
      }}
    >
      <SelectTrigger
        aria-label="เรียงลำดับคำขอคืนสินค้า"
        size="sm"
        className="rounded-lg border-input bg-background text-xs font-medium text-foreground"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="w-auto min-w-(--anchor-width)">
        <SelectGroup>
          {SORT_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
