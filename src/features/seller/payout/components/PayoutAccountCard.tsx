import { translate, useLanguage } from "@/lib/language";
import { CreditCard } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { PayoutAccount } from "@/features/finance/finance.types";
import { formatThaiDateTime, maskAccount } from "../payout.format";

type Props = {
  account: PayoutAccount | null;
  missingAccount: boolean;
};

export function PayoutAccountCard({ account, missingAccount }: Props) {
  useLanguage();
  const badge = account ? translate("ยืนยันแล้ว", "Verified") : missingAccount ? translate("ยังไม่มี", "Not yet available") : translate("ตรวจสอบไม่ได้", "Unable to verify");

  return (
    <Card className="gap-4 rounded-xl border bg-card p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-semibold">{translate("บัญชีรับเงิน", "Payout account")}</h2>
        <span className={`rounded-full px-2 py-1 text-xs ${account ? "bg-emerald-100 text-emerald-700" : "bg-secondary text-slate-600"}`}>
          {badge}
        </span>
      </div>

      {account ? (
        <div className="space-y-3 rounded-lg border bg-card p-4 text-sm">
          <div className="flex gap-3">
            <CreditCard className="size-5 shrink-0 text-teal-700" />
            <div>
              <strong>{account.bankName}</strong>
              <p>{maskAccount(account.accountNumber)}</p>
            </div>
          </div>
          <div className="grid gap-3 border-t pt-2 sm:grid-cols-2 md:grid-cols-1 xl:grid-cols-2">
            <div>
              <p className="text-xs text-muted-foreground">{translate("ชื่อบัญชี", "Account name")}</p>
              <p>{account.accountName}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{translate("ยืนยันเมื่อ", "Verified on")}</p>
              <p>{formatThaiDateTime(account.verifiedAt)}</p>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          {missingAccount ? translate("ยังไม่มีบัญชีรับเงินที่ยืนยันแล้ว", "No verified payout account yet") : translate("ยังโหลดข้อมูลบัญชีรับเงินไม่ได้", "Unable to load payout account details")}
        </p>
      )}

      <p className="text-xs text-muted-foreground">
        {translate("เงินจะโอนเข้าบัญชีนี้เท่านั้น หากต้องการใช้บัญชีใหม่ กรุณาส่งเอกสารยืนยันอีกครั้ง", "Funds will only be transferred to this account. Submit verification documents again to use a different account")}</p>
      <button type="button" disabled title={translate("ยังไม่เปิดให้ใช้งาน", "Not yet available")} className="inline-flex cursor-not-allowed items-center rounded-md border border-slate-200 bg-secondary px-3 py-2 text-xs font-medium text-slate-400">
        {missingAccount ? translate("ยืนยันตัวตนและบัญชีธนาคาร", "Verify identity and bank account") : translate("ส่งยืนยันบัญชีใหม่", "Resubmit bank account verification")}
      </button>
    </Card>
  );
}
