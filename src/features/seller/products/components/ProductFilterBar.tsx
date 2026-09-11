import { SearchIcon } from "lucide-react";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

import type {
  ProductFilter,
  ProductFilterId,
  ProductsData,
} from "../products.types";

type ProductFilterBarProps = {
  filters: ProductFilter[];
  activeFilterId: ProductFilterId;
  onFilterChange: (id: ProductFilterId) => void;
  toolbar: ProductsData["toolbar"];
};

export function ProductFilterBar({
  filters,
  activeFilterId,
  onFilterChange,
  toolbar,
}: ProductFilterBarProps) {
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

      <InputGroup className="h-8 w-60 rounded-lg bg-background">
        <InputGroupAddon>
          <SearchIcon />
        </InputGroupAddon>
        <InputGroupInput
          type="search"
          aria-label={toolbar.searchPlaceholder}
          placeholder={toolbar.searchPlaceholder}
        />
      </InputGroup>

      <Select
        items={Object.fromEntries(
          toolbar.sortOptions.map((option) => [option.value, option.label]),
        )}
        defaultValue={toolbar.sortOptions[0]?.value}
      >
        <SelectTrigger
          aria-label={toolbar.sortPlaceholder}
          className="h-8 w-48 rounded-lg bg-background text-sm"
        >
          <SelectValue placeholder={toolbar.sortPlaceholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {toolbar.sortOptions.map((option) => (
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
