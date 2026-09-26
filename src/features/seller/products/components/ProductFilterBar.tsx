import { SearchIcon } from "lucide-react";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import { LISTING_STATUS_LABEL } from "../products.format";
import { LISTING_STATUSES, type ListingCounts } from "../products.queries";
import type { ListingStatus } from "../products.types";

type ProductFilterBarProps = {
  counts: ListingCounts;
  /** `undefined` = ทั้งหมด */
  activeStatus: ListingStatus | undefined;
  onStatusChange: (status: ListingStatus | undefined) => void;
};

const NOT_SUPPORTED =
  "ยังค้นหาและเรียงลำดับเองไม่ได้ในตอนนี้ รายการเรียงตามที่แก้ไขล่าสุดก่อน";

/**
 * ชิปตัวกรองใช้ `ListingStatus` จริง หนึ่งชิปต่อหนึ่งสถานะ ตัวเลขนับจาก backend
 * "ถูกระงับ" โผล่เฉพาะตอนมีประกาศที่ถูกระงับ ร้านส่วนใหญ่ไม่เคยเจอ
 *
 * ช่องค้นหากับตัวเรียงยังเปิดใช้ไม่ได้ — `GET /sellers/me/listings` รับแค่ status /
 * variantId / condition / page / size และเรียง `updated_at desc` ตายตัว
 * ปิดไว้พร้อมบอกเหตุผล ดีกว่ากรองเฉพาะหน้าที่เห็นแล้วทำให้เข้าใจผิดว่าค้นทั้งร้าน
 */
export function ProductFilterBar({
  counts,
  activeStatus,
  onStatusChange,
}: ProductFilterBarProps) {
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
                ? "bg-zinc-950 font-medium text-white"
                : "border border-zinc-200 bg-white font-normal text-gray-700 hover:bg-gray-50",
            )}
          >
            {chip.label} {counts.isPending ? "…" : chip.count}
          </button>
        );
      })}

      <div className="flex-1" />

      <Tooltip>
        <TooltipTrigger render={<div className="flex items-center gap-2" />}>
          <InputGroup className="h-8 w-60 rounded-lg bg-background opacity-60">
            <InputGroupAddon>
              <SearchIcon />
            </InputGroupAddon>
            <InputGroupInput
              type="search"
              aria-label="ค้นหาสินค้า"
              placeholder="ค้นหาสินค้า..."
              disabled
            />
          </InputGroup>
          <span className="flex h-8 w-48 items-center rounded-lg border border-input bg-background px-2.5 text-sm text-muted-foreground opacity-60">
            เรียง: แก้ไขล่าสุด
          </span>
        </TooltipTrigger>
        <TooltipContent>{NOT_SUPPORTED}</TooltipContent>
      </Tooltip>
    </div>
  );
}
