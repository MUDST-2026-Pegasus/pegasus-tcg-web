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
  LISTING_SORT_LABEL,
  LISTING_SORTS,
  LISTING_STATUS_LABEL,
} from "../products.format";
import { LISTING_STATUSES, type ListingCounts } from "../products.queries";
import type { ListingSort, ListingStatus } from "../products.types";

type ProductFilterBarProps = {
  counts: ListingCounts;
  /** `undefined` = ทั้งหมด */
  activeStatus: ListingStatus | undefined;
  onStatusChange: (status: ListingStatus | undefined) => void;
  /** คำค้นที่อยู่ใน URL ตอนนี้ */
  search: string;
  onSearchChange: (search: string) => void;
  sort: ListingSort;
  onSortChange: (sort: ListingSort) => void;
};

/** พิมพ์ค้างไว้ครู่หนึ่งค่อยค้น ไม่ยิงทุกตัวอักษร */
const SEARCH_DELAY_MS = 350;

const SORT_ITEMS = LISTING_SORTS.map((sort) => ({
  value: sort,
  label: `เรียง: ${LISTING_SORT_LABEL[sort]}`,
}));

/**
 * ชิปตัวกรองใช้ `ListingStatus` จริง หนึ่งชิปต่อหนึ่งสถานะ ตัวเลขนับจาก backend
 * "ถูกระงับ" โผล่เฉพาะตอนมีประกาศที่ถูกระงับ ร้านส่วนใหญ่ไม่เคยเจอ
 *
 * ช่องค้นหากับตัวเรียงส่ง `q` / `sort` ไปที่ `GET /sellers/me/listings` — ค้นทั้งร้าน
 * ไม่ใช่แค่หน้าที่เห็น ตัวเลขบนชิปนับทั้งร้านเสมอ ไม่ขึ้นกับคำค้น
 */
export function ProductFilterBar({
  counts,
  activeStatus,
  onStatusChange,
  search,
  onSearchChange,
  sort,
  onSortChange,
}: ProductFilterBarProps) {
  const [text, setText] = useState(search);
  const [syncedSearch, setSyncedSearch] = useState(search);
  const timer = useRef<number | undefined>(undefined);

  // URL เปลี่ยนจากที่อื่น (กด back, ล้างคำค้น) — เอาค่าในช่องตามไปด้วย
  // แต่ถ้าต่างกันแค่ช่องว่างท้ายคำที่กำลังพิมพ์อยู่ ปล่อยไว้ ไม่งั้นเคอร์เซอร์กระโดด
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
    timer.current = window.setTimeout(
      () => onSearchChange(value),
      SEARCH_DELAY_MS,
    );
  }

  function handleSearchSubmit() {
    window.clearTimeout(timer.current);
    onSearchChange(text);
  }

  const chips: {
    status: ListingStatus | undefined;
    label: string;
    count: number;
  }[] = [
    { status: undefined, label: "ทั้งหมด", count: counts.total },
    ...LISTING_STATUSES.filter(
      (status) =>
        status !== "BLOCKED" ||
        counts.counts.BLOCKED > 0 ||
        activeStatus === "BLOCKED",
    ).map((status) => ({
      status,
      label: LISTING_STATUS_LABEL[status],
      count: counts.counts[status],
    })),
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => {
        const isActive = chip.status === activeStatus;

        return (
          <button
            key={chip.status ?? "ALL"}
            type="button"
            aria-pressed={isActive}
            onClick={() => onStatusChange(chip.status)}
            className={cn(
              "cursor-pointer rounded-full px-3.5 py-2 text-xs transition-colors",
              isActive
                ? "bg-foreground font-medium text-background"
                : "border border-border bg-card font-normal text-gray-700 hover:bg-gray-50",
            )}
          >
            {chip.label} {counts.isPending ? "…" : chip.count}
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
            aria-label="ค้นหาสินค้า"
            placeholder="ชื่อการ์ด, เลขการ์ด, SKU, ล็อต..."
            value={text}
            onChange={(event) => handleSearchInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") handleSearchSubmit();
            }}
          />
        </InputGroup>

        <Select
          items={SORT_ITEMS}
          value={sort}
          onValueChange={(next) => {
            if (next !== null) onSortChange(next as ListingSort);
          }}
        >
          <SelectTrigger
            aria-label="เรียงลำดับ"
            className="h-8 w-52 rounded-lg border border-input bg-background text-sm"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {SORT_ITEMS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
