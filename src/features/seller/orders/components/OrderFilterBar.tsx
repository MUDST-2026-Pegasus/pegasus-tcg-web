import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { OrderStatus } from "@/features/seller/shared/seller.types";
import { cn } from "@/lib/utils";

import type { OrderFilter, OrdersData } from "../orders.types";

type OrderFilterBarProps = {
  filters: OrderFilter[];
  activeFilterId: OrderStatus;
  onFilterChange: (id: OrderStatus) => void;
  sort: OrdersData["sort"];
};

export function OrderFilterBar({
  filters,
  activeFilterId,
  onFilterChange,
  sort,
}: OrderFilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {filters.map((filter) => {
        const isActive = filter.id === activeFilterId;

        return (
          <button
            key={filter.id}
            type="button"
            aria-pressed={isActive}
            onClick={() => onFilterChange(filter.id)}
            className={cn(
              "cursor-pointer rounded-full px-3.5 py-2 text-xs transition-colors",
              isActive
                ? "bg-zinc-950 font-medium text-white"
                : "border border-zinc-200 bg-white font-normal text-gray-700 hover:bg-gray-50",
            )}
          >
            {filter.label} {filter.count}
          </button>
        );
      })}

      <div className="flex-1" />

      <Select
        items={Object.fromEntries(
          sort.options.map((option) => [option.value, option.label]),
        )}
        defaultValue={sort.options[0]?.value}
      >
        <SelectTrigger
          aria-label={sort.placeholder}
          className="h-8 w-48 rounded-lg border-input bg-background text-sm"
        >
          <SelectValue placeholder={sort.placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {sort.options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
