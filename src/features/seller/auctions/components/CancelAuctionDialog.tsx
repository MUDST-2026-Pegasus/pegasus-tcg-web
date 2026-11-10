import { ConfirmDialog } from "@/components/common";
import { Ban } from "lucide-react";

import { toast } from "@/components/ui/toast";
import { useCancelAuction } from "@/features/auction/auction.queries";
import type { SellerAuctionRow } from "@/features/auction/auction.types";
import { ApiError } from "@/lib/api/errors";
import { translateError, useTranslate } from "@/lib/i18n";

type CancelAuctionDialogProps = {
  /** ประมูลที่จะยกเลิก — เก็บไว้แม้ปิดแล้ว เนื้อหาจะได้ไม่หายระหว่าง animation ปิด */
  row: SellerAuctionRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** S3-B ยืนยันยกเลิกประมูล (ได้เฉพาะตอนยังไม่มีบิด) [TCG-632 · FE-6] */
export function CancelAuctionDialog({ row, open, onOpenChange }: CancelAuctionDialogProps) {
  const { t } = useTranslate("auction");
  const cancel = useCancelAuction(row?.id ?? 0);

  const confirm = () => {
    if (!row || cancel.isPending) return;
    cancel.mutate(undefined, {
      onSuccess: () => onOpenChange(false),
      onError: (error) =>
        toast.add({
          type: "error",
          // ข้อความ AUCTION_HAS_BIDS ตาม Figma S3-E
          title: error instanceof ApiError && error.code === "AUCTION_HAS_BIDS" ? t("seller.cancelAuctionDialog.text", "ยกเลิกไม่ได้ — มีผู้บิดแล้ว") : t("seller.cancelAuctionDialog.text2", "ยกเลิกประมูลไม่สำเร็จ"),
          description: error instanceof ApiError ? translateError(error, error.message) : undefined,
        }),
    });
  };

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      icon={Ban}
      variant="destructive"
      title={t("seller.cancelAuctionDialog.title", "ยกเลิกการประมูลนี้?")}
      description={t("seller.cancelAuctionDialog.description", "{value}ยังไม่มีผู้บิด — การ์ดจะกลับเข้าสต็อกและขายในหน้าร้านได้ตามปกติ", { value: row ? `${row.item.card.productName} · ` : "" })}
      confirmLabel={t("seller.cancelAuctionDialog.confirmLabel", "ยกเลิกประมูล")}
      cancelLabel={t("seller.cancelAuctionDialog.cancelLabel", "ไม่ยกเลิก")}
      isPending={cancel.isPending}
      onConfirm={confirm}
    />
  );
}
