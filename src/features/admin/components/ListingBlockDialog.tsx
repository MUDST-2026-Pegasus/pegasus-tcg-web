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
import { useTranslate } from "@/lib/i18n";

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
  const { t } = useTranslate("admin");
  const change = useChangeListingBlock(productId);
  const [reason, setReason] = useState("");
  const isBlock = action === "block";
  const target = unblockTarget(listing);
  const summary = t("catalog.listings.blockDialog.summary", "{card} · {condition} · ร้าน {shop}", { card: cardLabel, condition: listingConditionLabel(listing), shop: listing.seller.username });

  function handleConfirm() {
    change.mutate(
      { listingId: listing.id, action, reason: reason.trim() },
      {
        onSuccess: () => {
          toast.add({
            type: "success",
            title: isBlock ? t("catalog.listings.blockDialog.blocked", "ระงับการขายแล้ว") : t("catalog.listings.blockDialog.unblocked", "ปลดการระงับแล้ว"),
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
      title={isBlock ? t("catalog.listings.blockDialog.blockTitle", "ระงับการขายประกาศนี้?") : t("catalog.listings.blockDialog.unblockTitle", "ปลดการระงับประกาศนี้?")}
      description={
        <>
          {summary}
          {isBlock
            ? ` · ${t("catalog.listings.blockDialog.remaining", "เหลือ {count} ใบ", { count: formatCount(listing.quantityAvailable) })}`
            : ` — ${t("catalog.listings.blockDialog.returnsTo", "ประกาศจะกลับเป็น “{status}”", { status: LISTING_STATUS_LABEL[target] })}`}
          {!isBlock && target === "ACTIVE" ? ` ${t("catalog.listings.blockDialog.visibleNow", "และผู้ซื้อเห็นทันที")}` : null}
        </>
      }
      confirmLabel={isBlock ? t("catalog.listings.block", "ระงับการขาย") : t("catalog.listings.unblock", "ปลดการระงับ")}
      isPending={change.isPending}
      confirmDisabled={reason.trim() === ""}
      error={
        change.error ? (
          <>
            <p className="font-medium">{isBlock ? t("catalog.listings.blockDialog.blockFailed", "ระงับไม่สำเร็จ") : t("catalog.listings.blockDialog.unblockFailed", "ปลดการระงับไม่สำเร็จ")}</p>
            {hasErrorCode(change.error, "LISTING_STATUS_TRANSITION")
              ? t("catalog.listings.blockDialog.conflict", "สถานะของประกาศเปลี่ยนไปแล้ว รายการอัปเดตให้ใหม่แล้ว")
              : catalogErrorMessage(change.error, t("common.tryAgain", "ลองใหม่อีกครั้ง"))}
          </>
        ) : null
      }
      onConfirm={handleConfirm}
    >
      {!isBlock && listing.block ? (
        <div className="flex flex-col gap-1 rounded-lg bg-muted/60 p-3">
          <p className="text-[11px] font-medium text-muted-foreground">
            {t("catalog.listings.blockDialog.blockReason", "เหตุผลที่ระงับ")}
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
          {isBlock ? t("catalog.listings.blockDialog.reasonBlock", "เหตุผล (ผู้ขายจะเห็น) *") : t("catalog.listings.blockDialog.reasonUnblock", "เหตุผลที่ปลด *")}
        </Label>
        <Textarea
          id="listing-block-reason"
          value={reason}
          maxLength={MAX_REASON}
          rows={3}
          placeholder={
            isBlock
              ? t("catalog.listings.blockDialog.reasonBlockPlaceholder", "เช่น สงสัยการ์ดปลอม รูปไม่ตรงกับการ์ดจริง")
              : t("catalog.listings.blockDialog.reasonUnblockPlaceholder", "เช่น ตรวจแล้วเป็นการ์ดจริง")
          }
          onChange={(event) => setReason(event.target.value)}
        />
      </div>

      {isBlock ? (
        <div className="flex flex-col gap-1 rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
          <p className="font-semibold text-foreground">{t("catalog.listings.blockDialog.effectsTitle", "เมื่อระงับแล้ว")}</p>
          <p>{t("catalog.listings.blockDialog.effectHidden", "ประกาศหายจากหน้าร้านและผลค้นหาทันที ตะกร้าที่มีอยู่ชำระเงินไม่ได้")}</p>
          <p>
            {t("catalog.listings.blockDialog.effectReserved", "การ์ดที่ติดจอง {count} ใบในออเดอร์เดิมยังเดินต่อ ไม่ถูกยกเลิก", { count: formatCount(listing.quantityReserved) })}
          </p>
          <p>{t("catalog.listings.blockDialog.effectLocked", "ผู้ขายแก้ราคา เปลี่ยนสถานะ หรือลบประกาศไม่ได้จนกว่าจะปลด")}</p>
        </div>
      ) : null}
    </ConfirmDialog>
  );
}
