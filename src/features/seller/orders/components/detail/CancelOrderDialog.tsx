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

import { orderErrorMessage } from "../../orders.format";
import { useCancelOrder } from "../../orders.queries";
import {
  EMPTY_CANCEL_FORM,
  cancelOrderSchema,
  type CancelOrderValues,
} from "../../orders.schema";

type CancelOrderDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: number;
  orderNumber: string;
  /** จ่ายแล้วหรือยัง — บอกผู้ขายให้ชัดว่าระบบจะคืนเงินให้ผู้ซื้อ */
  paid: boolean;
};

/**
 * ยกเลิกคำสั่งซื้อฝั่งร้าน — บังคับกรอกเหตุผลเพราะผู้ซื้อไม่ได้เป็นคนเลือก
 * ตัวฟอร์มอยู่ใน `DialogContent` ที่ถูก unmount ตอนปิด ค่าจึงรีเซ็ตเอง
 */
export function CancelOrderDialog({
  open,
  onOpenChange,
  orderId,
  orderNumber,
  paid,
}: CancelOrderDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>ยกเลิกคำสั่งซื้อ {orderNumber}</DialogTitle>
          <DialogDescription>
            การ์ดในออเดอร์นี้จะกลับไปวางขายทันที
            {paid ? " และระบบจะคืนเงินให้ผู้ซื้อ" : ""} — ทำย้อนกลับไม่ได้
          </DialogDescription>
        </DialogHeader>

        <CancelForm orderId={orderId} onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function CancelForm({ orderId, onClose }: { orderId: number; onClose: () => void }) {
  const cancel = useCancelOrder();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CancelOrderValues>({
    resolver: zodResolver(cancelOrderSchema),
    defaultValues: EMPTY_CANCEL_FORM,
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await cancel.mutateAsync({ id: orderId, payload: { reason: values.reason } });
      toast.add({ type: "success", title: "ยกเลิกคำสั่งซื้อแล้ว" });
      onClose();
    } catch (error) {
      // `reason` ตรงกับชื่อช่องอยู่แล้ว เคสอื่น (ส่งไปแล้ว / สลิปรอตรวจ) ขึ้นที่ Alert
      applyApiErrors(error, setError);
    }
  });

  return (
    <form className="flex flex-col gap-6" onSubmit={onSubmit} noValidate>
      {cancel.isError && errors.reason === undefined ? (
        <Alert variant="destructive">
          <AlertDescription>
            {orderErrorMessage(cancel.error, "ยกเลิกไม่สำเร็จ ลองใหม่อีกครั้ง")}
          </AlertDescription>
        </Alert>
      ) : null}

      <Field data-invalid={Boolean(errors.reason) || undefined}>
        <FieldLabel htmlFor="cancel-reason">เหตุผลที่ยกเลิก</FieldLabel>
        <Textarea
          id="cancel-reason"
          rows={4}
          maxLength={255}
          placeholder="เช่น การ์ดเสียหายระหว่างแพ็ค ขออภัยในความไม่สะดวก"
          aria-invalid={Boolean(errors.reason)}
          {...register("reason")}
        />
        <FieldError errors={[errors.reason]} />
      </Field>

      <DialogFooter>
        <DialogClose render={<Button type="button" variant="outline" />}>
          ไม่ยกเลิก
        </DialogClose>
        <Button type="submit" variant="destructive" disabled={isSubmitting}>
          {isSubmitting ? <Spinner /> : null}
          ยืนยันยกเลิก
        </Button>
      </DialogFooter>
    </form>
  );
}
