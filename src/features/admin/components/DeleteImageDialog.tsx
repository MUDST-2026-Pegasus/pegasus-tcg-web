import { ConfirmDialog } from "@/components/common";
import { Trash2 } from "lucide-react";


import { catalogErrorMessage } from "../catalog.format";
import type { CatalogImage } from "../catalog.types";
import { useTranslate } from "@/lib/i18n";

type DeleteImageDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  image: CatalogImage | null;
  isPending: boolean;
  error: unknown;
  onConfirm: () => void;
};

/**
 * ลบรูปแล้วไฟล์ใน storage หายไปด้วย กู้คืนไม่ได้ จึงถามก่อน
 * ลบรูปหลัก → รูปถัดไปขึ้นเป็นรูปหลักแทนเอง (backend จัดการ)
 */
export function DeleteImageDialog({
  open,
  onOpenChange,
  image,
  isPending,
  error,
  onConfirm,
}: DeleteImageDialogProps) {
  const { t } = useTranslate("admin");
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      icon={Trash2}
      variant="destructive"
      title={t("catalog.images.deleteTitle", "ลบรูปนี้?")}
      description={image?.primary ? t("catalog.images.deletePrimaryDescription", "ไฟล์จะถูกลบจากที่เก็บด้วย กู้คืนไม่ได้ · รูปนี้เป็นรูปหลัก รูปถัดไปจะขึ้นเป็นรูปหลักแทน") : t("catalog.images.deleteDescription", "ไฟล์จะถูกลบจากที่เก็บด้วย กู้คืนไม่ได้")}
      confirmLabel={t("catalog.images.deleteConfirm", "ลบรูป")}
      isPending={isPending}
      error={error ? catalogErrorMessage(error, t("catalog.images.deleteFailed", "ลบรูปไม่สำเร็จ ลองใหม่อีกครั้ง")) : null}
      onConfirm={onConfirm}
    />
  );
}
