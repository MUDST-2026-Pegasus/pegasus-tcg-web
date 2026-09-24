import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

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
import { toast } from "@/components/ui/toast";
import { applyApiErrors } from "@/lib/form";

import { verificationErrorMessage } from "../verification.format";
import { useRejectVerification } from "../verification.queries";
import {
  EMPTY_REJECT_FORM,
  rejectVerificationSchema,
  type RejectVerificationValues,
} from "../verification.schema";
import type { Verification } from "../verification.types";

type RejectVerificationDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  verification: Verification | null;
  /** เรียกเมื่อปฏิเสธสำเร็จ ส่งใบที่อัปเดตแล้วกลับไปให้หน้าโชว์สถานะใหม่ */
  onRejected: (updated: Verification) => void;
};

/**
 * กล่องปฏิเสธคำขอ — บังคับกรอกเหตุผลเพราะผู้ขายจะเห็นข้อความนี้ในหน้าสมัคร
 * (`RejectVerificationRequest` ฝั่ง backend เป็น `@NotBlank`)
 *
 * ตัวฟอร์มแยกเป็น component ใน `DialogContent` ที่ถูก unmount ตอนปิด ค่าจึงรีเซ็ตเอง
 */
export function RejectVerificationDialog({
  open,
  onOpenChange,
  verification,
  onRejected,
}: RejectVerificationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>ปฏิเสธคำขอเปิดร้าน</DialogTitle>
          <DialogDescription>
            ผู้ขายจะเห็นเหตุผลนี้ในหน้าสมัคร และส่งเอกสารใหม่มาได้ทีหลัง
          </DialogDescription>
        </DialogHeader>

        {verification ? (
          <RejectForm
            key={verification.id}
            verification={verification}
            onRejected={onRejected}
            onClose={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function RejectForm({
  verification,
  onRejected,
  onClose,
}: {
  verification: Verification;
  onRejected: (updated: Verification) => void;
  onClose: () => void;
}) {
  const rejectVerification = useRejectVerification();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RejectVerificationValues>({
    resolver: zodResolver(rejectVerificationSchema),
    defaultValues: EMPTY_REJECT_FORM,
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const updated = await rejectVerification.mutateAsync({
        id: verification.id,
        payload: { reason: values.reason },
      });
      toast.add({ type: "success", title: "ปฏิเสธคำขอแล้ว" });
      onRejected(updated);
      onClose();
    } catch (error) {
      // ชื่อฟิลด์ `reason` ตรงกับช่องอยู่แล้ว ไม่ต้อง map
      // เคสอื่น (เช่น ถูกตัดสินไปก่อน) ไม่มีช่องรับผิดชอบ ไปโผล่ที่ Alert ด้านบน
      applyApiErrors(error, setError);
    }
  });

  return (
    <form className="flex flex-col gap-6" onSubmit={onSubmit} noValidate>
      {rejectVerification.isError && errors.reason === undefined && (
        <Alert variant="destructive">
          <AlertDescription>
            {verificationErrorMessage(
              rejectVerification.error,
              "ปฏิเสธคำขอไม่สำเร็จ ลองใหม่อีกครั้ง",
            )}
          </AlertDescription>
        </Alert>
      )}

      <Field data-invalid={Boolean(errors.reason) || undefined}>
        <FieldLabel htmlFor="reason">เหตุผลที่ปฏิเสธ</FieldLabel>
        <Textarea
          id="reason"
          rows={4}
          maxLength={255}
          placeholder="เช่น ชื่อบัญชีไม่ตรงกับชื่อที่กรอก กรุณาส่งสมุดบัญชีที่ชื่อตรงกัน"
          aria-invalid={Boolean(errors.reason)}
          {...register("reason")}
        />
        <FieldError errors={[errors.reason]} />
      </Field>

      <DialogFooter>
        <DialogClose render={<Button type="button" variant="outline" />}>
          ยกเลิก
        </DialogClose>
        <Button type="submit" variant="destructive" disabled={isSubmitting}>
          {isSubmitting && <Spinner data-icon="inline-start" />}
          ยืนยันการปฏิเสธ
        </Button>
      </DialogFooter>
    </form>
  );
}
