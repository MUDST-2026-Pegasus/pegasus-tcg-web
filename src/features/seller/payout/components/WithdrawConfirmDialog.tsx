import { useEffect, useId, useState } from "react";

import { REGEXP_ONLY_DIGITS } from "input-otp";
import { CreditCard, Wallet } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

import type { PayoutData } from "../payout.types";

const OTP_SLOT_CLASS =
  "h-12 w-10 rounded-lg border border-zinc-200 bg-white text-lg font-bold text-zinc-950 first:rounded-lg last:rounded-lg sm:w-11 data-[active=true]:border-teal-600 data-[active=true]:ring-teal-600/20";

/** 167 → "02:47" */
function formatCountdown(totalSeconds: number): string {
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

type WithdrawConfirmDialogProps = PayoutData["withdraw"] & {
  bankAccount: PayoutData["bankAccount"];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (otp: string) => void;
};

export function WithdrawConfirmDialog({
  open,
  onOpenChange,
  ...props
}: WithdrawConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="gap-0 overflow-hidden rounded-2xl bg-white p-0 shadow-[0px_12px_32px_0px_rgba(0,0,0,0.18)] ring-0 sm:max-w-[480px]"
      >
        {/* เนื้อหาถูก unmount ทุกครั้งที่ปิด dialog — เปิดใหม่ช่อง OTP กับตัวนับจึงเริ่มใหม่เสมอ */}
        <WithdrawConfirmForm {...props} />
      </DialogContent>
    </Dialog>
  );
}

type WithdrawConfirmFormProps = Omit<
  WithdrawConfirmDialogProps,
  "open" | "onOpenChange"
>;

function WithdrawConfirmForm({
  title,
  description,
  amountLabel,
  amount,
  feeLabel,
  fee,
  netLabel,
  net,
  otp,
  limitNote,
  cancelLabel,
  confirmLabel,
  bankAccount,
  onConfirm,
}: WithdrawConfirmFormProps) {
  const otpId = useId();
  const [code, setCode] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(otp.resendAfterSeconds);

  const isComplete = code.length === otp.length;

  useEffect(() => {
    if (secondsLeft <= 0) return;

    const timer = window.setTimeout(
      () => setSecondsLeft((current) => current - 1),
      1000,
    );
    return () => window.clearTimeout(timer);
  }, [secondsLeft]);

  function handleResend() {
    setCode("");
    setSecondsLeft(otp.resendAfterSeconds);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isComplete) onConfirm(code);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col">
      <div className="flex flex-col gap-3 px-6 pt-6 pb-4">
        <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-50">
          <Wallet aria-hidden="true" className="size-5 text-teal-600" />
        </div>
        <div className="flex flex-col gap-1.5">
          <DialogTitle className="text-base leading-normal font-bold text-zinc-950">
            {title}
          </DialogTitle>
          <DialogDescription className="text-xs leading-4 text-gray-500">
            {description}
          </DialogDescription>
        </div>
      </div>

      <div className="flex flex-col gap-3.5 px-6 pb-5">
        <div className="flex flex-col gap-3 rounded-xl bg-zinc-950 p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-gray-400">{amountLabel}</p>
            <p className="text-xs font-medium text-white">{amount}</p>
          </div>
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-gray-400">{feeLabel}</p>
            <p className="text-xs font-medium text-gray-400">{fee}</p>
          </div>
          <Separator className="bg-gray-800" />
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-white">{netLabel}</p>
            <p className="text-xl font-bold text-white">{net}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-[10px] border border-gray-100 bg-neutral-50 p-3.5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-green-100">
            <CreditCard aria-hidden="true" className="size-4 text-emerald-700" />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
            <p className="text-xs font-medium text-zinc-950">
              {bankAccount.bankName} · {bankAccount.accountNumber}
            </p>
            <p className="text-xs text-gray-500">{bankAccount.accountName}</p>
          </div>
          <Badge className="h-5 rounded-full bg-green-100 px-2 text-xs text-emerald-700">
            {bankAccount.statusLabel}
          </Badge>
        </div>

        <Field className="gap-1.5">
          <FieldLabel
            htmlFor={otpId}
            className="text-xs font-medium text-gray-700"
          >
            {otp.label} *
          </FieldLabel>

          <InputOTP
            id={otpId}
            required
            maxLength={otp.length}
            pattern={REGEXP_ONLY_DIGITS}
            value={code}
            onChange={setCode}
            autoComplete="one-time-code"
          >
            <InputOTPGroup className="gap-2">
              {Array.from({ length: otp.length }, (_, index) => (
                <InputOTPSlot
                  key={index}
                  index={index}
                  className={cn(
                    OTP_SLOT_CLASS,
                    index < code.length && "border-2 border-teal-600",
                  )}
                />
              ))}
            </InputOTPGroup>
          </InputOTP>

          <div className="flex items-center gap-1.5">
            {secondsLeft > 0 ? (
              <p className="text-[10px] text-gray-400">
                {otp.resendCountdownLabel} {formatCountdown(secondsLeft)}
              </p>
            ) : (
              <Button
                type="button"
                variant="link"
                size="xs"
                onClick={handleResend}
                className="h-auto px-0 text-[10px] font-medium text-teal-600"
              >
                {otp.resendLabel}
              </Button>
            )}
          </div>
        </Field>
      </div>

      <DialogFooter className="flex-row items-center justify-end gap-2.5 border-t border-gray-100 bg-neutral-50 px-6 py-4">
        <p className="flex-1 text-[10px] text-gray-400">{limitNote}</p>

        <DialogClose
          render={
            <Button variant="outline" size="sm" className="rounded-md px-2.5" />
          }
        >
          {cancelLabel}
        </DialogClose>

        {/* ยังกรอก OTP ไม่ครบทุกหลัก = ยืนยันไม่ได้ */}
        <Button
          type="submit"
          size="sm"
          className="rounded-md px-2.5"
          disabled={!isComplete}
        >
          {confirmLabel}
        </Button>
      </DialogFooter>
    </form>
  );
}
