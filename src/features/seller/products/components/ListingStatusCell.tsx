import { ConfirmDialog } from "@/components/common";
import { useState } from "react";

import { Ban, ChevronDown, Pause, Play, type LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

import {
  LISTING_STATUS_BADGE,
  LISTING_STATUS_LABEL,
  listingErrorMessage,
} from "../products.format";
import { useChangeListingStatus } from "../products.queries";
import { activateBlockedReason, statusTargets } from "../products.rules";
import type { ListingStatus, SellerListingSummary } from "../products.types";

const BADGE_CLASS = "h-5 rounded-full px-2 text-xs";

/** ปลายทางที่ผู้ขายขอได้ — ตรงกับ `ListingStatusRequest.java` */
const TARGET_ACTION: Partial<
  Record<ListingStatus, { label: string; icon: LucideIcon }>
> = {
  ACTIVE: { label: "เปิดขาย", icon: Play },
  PAUSED: { label: "พักการขาย", icon: Pause },
  DELISTED: { label: "ปิดการขายถาวร…", icon: Ban },
};

type ListingStatusCellProps = {
  listing: SellerListingSummary;
  /** ร้านยังแก้ประกาศไม่ได้ (`canPublish = false`) */
  readOnly: boolean;
};

/**
 * badge สถานะที่กดเปลี่ยนสถานะได้ (`PATCH /{id}/status`) — ตารางเปลี่ยนให้เห็นก่อน
 * backend ตอบ ถ้าพลาดย้อนกลับพร้อมแจ้งเหตุผล
 *
 * เมนูเสนอเฉพาะทางที่ `ListingStatus.sellerTargets()` ยอม ส่วน "ปิดการขายถาวร"
 * ย้อนไม่ได้จึงถามยืนยันก่อน
 */
export function ListingStatusCell({
  listing,
  readOnly,
}: ListingStatusCellProps) {
  const changeStatus = useChangeListingStatus();
  const [confirmDelist, setConfirmDelist] = useState(false);

  const targets = statusTargets(listing);
  const label = LISTING_STATUS_LABEL[listing.status];

  if (readOnly || targets.length === 0) {
    return (
      <Badge className={cn(BADGE_CLASS, LISTING_STATUS_BADGE[listing.status])}>
        {label}
      </Badge>
    );
  }

  function move(target: ListingStatus) {
    changeStatus.mutate(
      { id: listing.id, status: target },
      {
        onSuccess: (updated) =>
          toast.add({
            type: "success",
            title: "เปลี่ยนสถานะแล้ว",
            // backend อาจย้ายไปที่อื่น เช่น เปิดขายประกาศที่ไม่เหลือการ์ดจะกลายเป็น SOLD_OUT
            description: `${listing.card.productName} · ${LISTING_STATUS_LABEL[updated.status]}`,
          }),
        onError: (error) =>
          toast.add({
            type: "error",
            title: "เปลี่ยนสถานะไม่สำเร็จ",
            description: listingErrorMessage(error, "ลองใหม่อีกครั้ง"),
          }),
      },
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button
              type="button"
              aria-label={`เปลี่ยนสถานะ: ${listing.card.productName} (ตอนนี้${label})`}
              className="cursor-pointer rounded-full focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
            />
          }
        >
          <Badge
            className={cn(BADGE_CLASS, "gap-0.5", LISTING_STATUS_BADGE[listing.status])}
          >
            {label}
            <ChevronDown aria-hidden="true" className="size-3" />
          </Badge>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-auto rounded-xl">
          {targets.map((target) => {
            const action = TARGET_ACTION[target];
            if (!action) return null;
            const blocked =
              target === "ACTIVE" ? activateBlockedReason(listing) : null;
            const Icon = action.icon;

            return (
              <DropdownMenuItem
                key={target}
                disabled={blocked !== null}
                variant={target === "DELISTED" ? "destructive" : "default"}
                onClick={() =>
                  target === "DELISTED" ? setConfirmDelist(true) : move(target)
                }
                className="rounded-lg text-xs"
              >
                <Icon />
                <span className="flex flex-col">
                  {action.label}
                  {blocked ? (
                    <span className="text-[10px] text-gray-400">{blocked}</span>
                  ) : null}
                </span>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={confirmDelist}
        onOpenChange={setConfirmDelist}
        variant="destructive"
        title={`ปิดการขาย “${listing.card.productName}” ถาวร?`}
        description="ประกาศที่ปิดถาวรกลับมาเปิดขายไม่ได้ ต้องลงประกาศใหม่ การ์ดที่วางขายอยู่จะกลับเข้าคลังของคุณ ส่วนใบที่ติดจองจะกลับมาเมื่อคำสั่งซื้อจบ ถ้าจะกลับมาขายอีกให้ใช้ “พักการขาย” แทน"
        confirmLabel="ปิดการขายถาวร"
        onConfirm={() => {
          setConfirmDelist(false);
          move("DELISTED");
        }}
      />
    </>
  );
}
