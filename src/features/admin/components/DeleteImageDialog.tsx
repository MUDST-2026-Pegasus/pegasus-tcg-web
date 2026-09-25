import { Trash2 } from "lucide-react";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

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
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="text-destructive">
            <Trash2 />
          </AlertDialogMedia>
          <AlertDialogTitle>ลบรูปนี้?</AlertDialogTitle>
          <AlertDialogDescription>
            ไฟล์จะถูกลบจากที่เก็บด้วย กู้คืนไม่ได้
            {image?.primary ? " · รูปนี้เป็นรูปหลัก รูปถัดไปจะขึ้นเป็นรูปหลักแทน" : ""}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error ? (
          <Alert variant="destructive">
            <AlertDescription>
              {catalogErrorMessage(error, "ลบรูปไม่สำเร็จ ลองใหม่อีกครั้ง")}
            </AlertDescription>
          </Alert>
        ) : null}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>ยกเลิก</AlertDialogCancel>
          <Button
            variant="destructive"
            disabled={isPending}
            onClick={onConfirm}
          >
            {isPending && <Spinner data-icon="inline-start" />}
            ลบรูป
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
