import { useEffect, useRef, useState } from "react";

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

import {
  ORDER_TABS,
  SORT_OPTIONS,
  countOf,
  type OrderTab,
  type SortChoice,
} from "../orders.format";
import type { SellerOrderCounts } from "../orders.types";

/** พิมพ์หยุดนานเท่านี้ค่อยค้น ไม่ยิงทุกตัวอักษร */
const SEARCH_DELAY_MS = 400;

type OrderFilterBarProps = {
  activeTab: OrderTab;
  onTabChange: (tab: OrderTab) => void;
  /** `undefined` = กำลังโหลดตัวเลข */
  counts: SellerOrderCounts | undefined;
  search: string;
  onSearchChange: (search: string) => void;
  sort: SortChoice;
  onSortChange: (sort: SortChoice) => void;
};

export function OrderFilterBar({
  activeTab,
  onTabChange,
  counts,
  search,
  onSearchChange,
  sort,
  onSortChange,
}: OrderFilterBarProps) {
  const [text, setText] = useState(search);
  const [syncedSearch, setSyncedSearch] = useState(search);
  const timer = useRef<number | undefined>(undefined);

  // URL เปลี่ยนจากที่อื่น (กด back) — เอาค่าในช่องตามไปด้วย
  if (search !== syncedSearch) {
    setSyncedSearch(search);
    if (text.trim() !== search) {
      setText(search);
    }
  }

  useEffect(() => () => window.clearTimeout(timer.current), []);

  function handleSearchInput(value: string) {
    setText(value);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => onSearchChange(value), SEARCH_DELAY_MS);
  }

  function handleSearchSubmit() {
    window.clearTimeout(timer.current);
    onSearchChange(text);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {ORDER_TABS.map((tab) => {
        const isActive = tab.id === activeTab;

        return (
          <button
            key={tab.id}
            type="button"
            aria-pressed={isActive}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "cursor-pointer rounded-full px-3.5 py-2 text-xs transition-colors",
              isActive
                ? "bg-zinc-950 font-medium text-white"
                : "border border-zinc-200 bg-white font-normal text-gray-700 hover:bg-gray-50",
            )}
          >
            {tab.label} {counts === undefined ? "…" : countOf(counts, tab.statuses)}
          </button>
        );
      })}

      <div className="flex-1" />

      <div className="flex flex-wrap items-center gap-2">
        <InputGroup className="h-8 w-60 rounded-lg bg-background">
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupInput
            type="search"
            aria-label="ค้นหาคำสั่งซื้อ"
            placeholder="เลขออเดอร์ หรือชื่อผู้ซื้อ"
            value={text}
            onChange={(event) => handleSearchInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") handleSearchSubmit();
            }}
          />
        </InputGroup>

        <Select
          items={SORT_OPTIONS}
          value={sort}
          onValueChange={(next) => {
            if (next !== null) onSortChange(next as SortChoice);
          }}
        >
          <SelectTrigger
            aria-label="เรียงลำดับ"
            className="h-8 w-48 rounded-lg border-input bg-background text-sm"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
