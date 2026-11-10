import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { ReturnSortOrder } from "../useSellerReturns";
import { useTranslate } from "@/lib/i18n";

interface ReturnSortSelectProps {
  value: ReturnSortOrder;
  onChange: (value: ReturnSortOrder) => void;
}

export function ReturnSortSelect({ value, onChange }: ReturnSortSelectProps) {
  const { t } = useTranslate("seller");

  const sortOptions = [
    { value: "longest_first" as const, label: t("sellerReturns.sort.longestFirst", "เรียง: รอนานสุดก่อน") },
    { value: "newest_first" as const, label: t("sellerReturns.sort.newestFirst", "เรียง: ใหม่สุดก่อน") },
  ];

  return (
    <Select
      items={sortOptions}
      value={value}
      onValueChange={(next) => {
        if (next !== null) onChange(next as ReturnSortOrder);
      }}
    >
      <SelectTrigger
        aria-label={t("sellerReturns.sort.ariaLabel", "เรียงลำดับคำขอคืนสินค้า")}
        size="sm"
        className="rounded-lg border-input bg-background text-xs font-medium text-foreground"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="w-auto min-w-(--anchor-width)">
        <SelectGroup>
          {sortOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
