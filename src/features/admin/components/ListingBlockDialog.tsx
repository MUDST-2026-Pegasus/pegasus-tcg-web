import { ConfirmDialog } from "@/components/common";
import { useState } from "react";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { hasErrorCode } from "@/lib/api";

import {
  LISTING_STATUS_LABEL,
  listingConditionLabel,
  unblockTarget,
} from "../card-listings.format";
import { catalogErrorMessage, formatCount } from "../catalog.format";
import { useChangeListingBlock } from "../catalog.queries";
import type { AdminCardListing } from "../catalog.types";

import { formatThaiDate } from "../users.format";

const MAX_REASON = 500;

type ListingBlockDialogProps = {
  productId: number;
  /** ชื่อการ์ดกับ variant — บอกให้ชัดว่ากำลังระงับใบไหน */
  cardLabel: string;
  listing: AdminCardListing;
  action: "block" | "unblock";
  onClose: () => void;
};

/**
 * ยืนยันการระงับหรือปลดการระงับ ต้องมีเหตุผลเสมอ — ตอนระงับผู้ขายเห็นเหตุผลนี้
 * เปิดด้วย `key` ใหม่ทุกครั้ง ช่องเหตุผลจึงไม่ค้างจากประกาศก่อนหน้า
 */
export function ListingBlockDialog({
  productId,
  cardLabel,
  listing,
  action,
  onClose,
}: ListingBlockDialogProps) {
  const change = useChangeListingBlock(productId);
  const [reason, setReason] = useState("");
  const isBlock = action === "block";
  const target = unblockTarget(listing);
  const summary = `${cardLabel} · ${listingConditionLabel(listing)} · ร้าน ${listing.seller.username}`;

  function handleConfirm() {
    change.mutate(
      { listingId: listing.id, action, reason: reason.trim() },
      {
        onSuccess: () => {
          toast.add({
            type: "success",
            title: isBlock ? "ระงับการขายแล้ว" : "ปลดการระงับแล้ว",
            description: summary,
          });
          onClose();
        },
      },
    );
  }

  return (
    <ConfirmDialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      variant={isBlock ? "destructive" : "default"}
      title={isBlock ? "ระงับการขายประกาศนี้?" : "ปลดการระงับประกาศนี้?"}
      description={
        <>
          {summary}
          {isBlock
            ? ` · เหลือ ${formatCount(listing.quantityAvailable)} ใบ`
            : ` — ประกาศจะกลับเป็น “${LISTING_STATUS_LABEL[target]}”`}
          {!isBlock && target === "ACTIVE" ? " และผู้ซื้อเห็นทันที" : null}
        </>
      }
      confirmLabel={isBlock ? "ระงับการขาย" : "ปลดการระงับ"}
      isPending={change.isPending}
      confirmDisabled={reason.trim() === ""}
      error={
        change.error ? (
          <>
            <p className="font-medium">{isBlock ? "ระงับไม่สำเร็จ" : "ปลดการระงับไม่สำเร็จ"}</p>
            {hasErrorCode(change.error, "LISTING_STATUS_TRANSITION")
              ? "สถานะของประกาศเปลี่ยนไปแล้ว รายการอัปเดตให้ใหม่แล้ว"
              : catalogErrorMessage(change.error, "ลองใหม่อีกครั้ง")}
          </>
        ) : null
      }
      onConfirm={handleConfirm}
    >
      {!isBlock && listing.block ? (
        <div className="flex flex-col gap-1 rounded-lg bg-muted/60 p-3">
          <p className="text-[11px] font-medium text-muted-foreground">
            เหตุผลที่ระงับ
            {listing.block.blockedByUsername
              ? ` · ${listing.block.blockedByUsername}`
              : null}
            {` · ${formatThaiDate(listing.block.blockedAt)}`}
          </p>
          <p className="text-sm break-words text-foreground">
            {listing.block.reason}
          </p>
        </div>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="listing-block-reason">
          {isBlock ? "เหตุผล (ผู้ขายจะเห็น) *" : "เหตุผลที่ปลด *"}
        </Label>
        <Textarea
          id="listing-block-reason"
          value={reason}
          maxLength={MAX_REASON}
          rows={3}
          placeholder={
            isBlock
              ? "เช่น สงสัยการ์ดปลอม รูปไม่ตรงกับการ์ดจริง"
              : "เช่น ตรวจแล้วเป็นการ์ดจริง"
          }
          onChange={(event) => setReason(event.target.value)}
        />
      </div>

      {isBlock ? (
        <div className="flex flex-col gap-1 rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
          <p className="font-semibold text-foreground">เมื่อระงับแล้ว</p>
          <p>ประกาศหายจากหน้าร้านและผลค้นหาทันที ตะกร้าที่มีอยู่ชำระเงินไม่ได้</p>
          <p>
            การ์ดที่ติดจอง {formatCount(listing.quantityReserved)}{" "}
            ใบในออเดอร์เดิมยังเดินต่อ ไม่ถูกยกเลิก
          </p>
          <p>ผู้ขายแก้ราคา เปลี่ยนสถานะ หรือลบประกาศไม่ได้จนกว่าจะปลด</p>
        </div>
      ) : null}
    </ConfirmDialog>
  );
}
