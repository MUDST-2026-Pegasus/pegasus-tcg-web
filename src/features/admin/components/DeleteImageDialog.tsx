import { ConfirmDialog } from "@/components/common";
import { Trash2 } from "lucide-react";


import { catalogErrorMessage } from "../catalog.format";
import type { CatalogImage } from "../catalog.types";

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
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      icon={Trash2}
      variant="destructive"
      title="ลบรูปนี้?"
      description={`ไฟล์จะถูกลบจากที่เก็บด้วย กู้คืนไม่ได้${image?.primary ? " · รูปนี้เป็นรูปหลัก รูปถัดไปจะขึ้นเป็นรูปหลักแทน" : ""}`}
      confirmLabel="ลบรูป"
      isPending={isPending}
      error={error ? catalogErrorMessage(error, "ลบรูปไม่สำเร็จ ลองใหม่อีกครั้ง") : null}
      onConfirm={onConfirm}
    />
  );
}
