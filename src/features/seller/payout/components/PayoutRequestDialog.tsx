import { translate, useLanguage } from "@/lib/language";
import { CreditCard, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { PayoutAccount } from "@/features/finance/finance.types";
import { maskAccount, money, PAYOUT_MINIMUM, validatePayoutAmount } from "../payout.format";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount: string;
  onAmountChange: (value: string) => void;
  withdrawable: number;
  account: PayoutAccount;
  submitting: boolean;
  conflict: string | null;
  onSubmit: () => void;
};

export function PayoutRequestDialog({ open, onOpenChange, amount, onAmountChange, withdrawable, account, submitting, conflict, onSubmit }: Props) {
  useLanguage();
  const error = amount ? validatePayoutAmount(amount, withdrawable) : null;
  const invalid = !!validatePayoutAmount(amount, withdrawable);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={!submitting} className="grid-cols-[minmax(0,1fr)] gap-5 rounded-xl max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">{translate("ขอถอนเงิน", "Request withdrawal")}</DialogTitle>
          <DialogDescription>{translate("ยอดถอนได้", "Withdrawable balance") + " "}{money(withdrawable)} {" " + translate("· ขั้นต่ำต่อครั้ง", "· Minimum per withdrawal") + " "}{money(PAYOUT_MINIMUM)}</DialogDescription>
        </DialogHeader>

        <div className="min-w-0 space-y-2">
          <label htmlFor="payout-amount" className="text-sm font-medium">{translate("จำนวนเงินที่ต้องการถอน", "Withdrawal amount")}</label>
          <div className="flex min-w-0 items-center rounded-lg border-2 border-teal-600 bg-card px-4 focus-within:ring-2 focus-within:ring-teal-100">
            <span className="text-2xl font-semibold text-muted-foreground">฿</span>
            <input
              id="payout-amount"
              aria-label={translate("จำนวนเงินที่ต้องการถอน", "Withdrawal amount")}
              type="text"
              inputMode="decimal"
              className="h-14 min-w-0 flex-1 border-0 bg-transparent px-3 text-2xl font-bold outline-none placeholder:text-slate-400"
              placeholder="0.00"
              value={amount}
              onChange={(event) => onAmountChange(event.target.value)}
              disabled={submitting}
            />
            <Button variant="ghost" size="sm" disabled={submitting} className="shrink-0 rounded-md bg-teal-50 text-teal-700 hover:bg-teal-100" onClick={() => onAmountChange(Number(withdrawable).toFixed(2))}>
              {translate("ถอนทั้งหมด", "Withdraw all")}</Button>
          </div>
          <p className="text-xs text-muted-foreground">{translate("ทศนิยมไม่เกิน 2 ตำแหน่ง", "Up to two decimal places")}</p>
          {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
          {conflict && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{conflict}</p>}
        </div>

        <div className="flex min-w-0 items-center gap-3 rounded-lg bg-muted p-3">
          <CreditCard className="size-5 text-teal-700" />
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">{translate("โอนเข้า", "Transfer to")}</p>
            <p className="break-words text-sm font-medium">{account.bankName} {maskAccount(account.accountNumber)} · {account.accountName}</p>
          </div>
        </div>

        <div className="min-w-0 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{translate("ยอดที่ขอถอน", "Requested amount")}</span>
            <strong>{money(Number(amount) || 0)}</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{translate("ยอดถอนได้คงเหลือหลังส่งคำขอ", "Withdrawable balance after this request")}</span>
            <strong>{money(Math.max(0, withdrawable - (Number(amount) || 0)))}</strong>
          </div>
        </div>

        <div className="flex min-w-0 gap-2 rounded-lg border p-3 text-sm">
          <Info className="mt-0.5 size-4 shrink-0" />
          <p className="min-w-0 break-words">
            <strong>{translate("ยอดนี้จะถูกกันไว้ทันที", "This amount will be reserved immediately")}</strong><br />
            <span className="text-muted-foreground">{translate("แอดมินตรวจสอบและโอนให้ด้วยตนเอง · ส่งแล้วยกเลิกเองไม่ได้ · ถ้าไม่อนุมัติหรือโอนไม่สำเร็จ ยอดจะกลับมาถอนได้", "An administrator reviews and transfers funds manually. You cannot cancel a submitted request. If rejected or the transfer fails, the funds become available to withdraw again")}</span>
          </p>
        </div>

        <DialogFooter className="min-w-0 flex-row flex-wrap justify-end">
          <Button variant="outline" disabled={submitting} onClick={() => onOpenChange(false)}>{translate("ยกเลิก", "Cancel")}</Button>
          <Button className="bg-teal-600 text-white hover:bg-teal-700" disabled={invalid || submitting} onClick={onSubmit}>
            {submitting ? translate("กำลังส่งคำขอ…", "Submitting request…") : translate(`ยืนยันขอถอน ${money(Number(amount) || 0)}`, `Confirm withdrawal of ${money(Number(amount) || 0)}`)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
