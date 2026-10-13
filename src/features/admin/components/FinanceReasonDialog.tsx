import { useState, type FormEvent } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";

type FinanceReasonDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  placeholder: string;
  confirmLabel: string;
  /** โยน error ออกมาได้ — dialog จะโชว์ข้อความจาก `errorMessage` แล้วเปิดค้างไว้ */
  onConfirm: (reason: string) => Promise<unknown>;
  errorMessage: (error: unknown) => string;
};

/**
 * กล่องกรอกเหตุผล ใช้กับ "ปฏิเสธถอนเงิน" และ "โอนไม่สำเร็จ" ทั้งคืนเงินและถอนเงิน
 * backend บังคับ `@NotBlank` ทุกตัว และเก็บได้ไม่เกิน 255 ตัวอักษร
 *
 * ฟอร์มอยู่ใน `DialogContent` ที่ถูก unmount ตอนปิด ค่าจึงรีเซ็ตเองทุกครั้ง
 */
export function FinanceReasonDialog({ open, onOpenChange, title, description, ...form }: FinanceReasonDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <ReasonForm {...form} onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function ReasonForm({
  placeholder,
  confirmLabel,
  onConfirm,
  errorMessage,
  onClose,
}: Pick<FinanceReasonDialogProps, "placeholder" | "confirmLabel" | "onConfirm" | "errorMessage"> & {
  onClose: () => void;
}) {
  const [reason, setReason] = useState("");
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const missing = reason.trim() === "";

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setTouched(true);
    if (missing) {
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onConfirm(reason.trim());
      onClose();
    } catch (caught) {
      setError(caught);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="flex flex-col gap-6" onSubmit={submit} noValidate>
      {error !== null && (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage(error)}</AlertDescription>
        </Alert>
      )}

      <Field data-invalid={(touched && missing) || undefined}>
        <FieldLabel htmlFor="finance-reason">เหตุผล</FieldLabel>
        <Textarea
          id="finance-reason"
          rows={4}
          maxLength={255}
          placeholder={placeholder}
          aria-invalid={touched && missing}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
        />
        <FieldError errors={touched && missing ? [{ message: "กรุณากรอกเหตุผล" }] : []} />
      </Field>

      <DialogFooter>
        <DialogClose render={<Button type="button" variant="outline" />}>ยกเลิก</DialogClose>
        <Button type="submit" variant="destructive" disabled={submitting}>
          {submitting && <Spinner data-icon="inline-start" />}
          {confirmLabel}
        </Button>
      </DialogFooter>
    </form>
  );
}
