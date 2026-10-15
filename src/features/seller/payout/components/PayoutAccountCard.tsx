import { CreditCard } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { PayoutAccount } from "@/features/finance/finance.types";
import { formatThaiDateTime, maskAccount } from "../payout.format";

type Props = {
  account: PayoutAccount | null;
  missingAccount: boolean;
};

export function PayoutAccountCard({ account, missingAccount }: Props) {
  const badge = account ? "ยืนยันแล้ว" : missingAccount ? "ยังไม่มี" : "ตรวจสอบไม่ได้";

  return (
    <Card className="gap-4 rounded-xl border bg-white p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-semibold">บัญชีรับเงิน</h2>
        <span className={`rounded-full px-2 py-1 text-xs ${account ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
          {badge}
        </span>
      </div>

      {account ? (
        <div className="space-y-3 rounded-lg border bg-white p-4 text-sm">
          <div className="flex gap-3">
            <CreditCard className="size-5 shrink-0 text-teal-700" />
            <div>
              <strong>{account.bankName}</strong>
              <p>{maskAccount(account.accountNumber)}</p>
            </div>
          </div>
          <div className="grid gap-3 border-t pt-2 sm:grid-cols-2 md:grid-cols-1 xl:grid-cols-2">
            <div>
              <p className="text-xs text-muted-foreground">ชื่อบัญชี</p>
              <p>{account.accountName}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">ยืนยันเมื่อ</p>
              <p>{formatThaiDateTime(account.verifiedAt)}</p>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          {missingAccount ? "ยังไม่มีบัญชีรับเงินที่ยืนยันแล้ว" : "ยังโหลดข้อมูลบัญชีรับเงินไม่ได้"}
        </p>
      )}

      <p className="text-xs text-muted-foreground">
        เงินจะโอนเข้าบัญชีนี้เท่านั้น หากต้องการใช้บัญชีใหม่ กรุณาส่งเอกสารยืนยันอีกครั้ง
      </p>
      <button type="button" disabled title="ยังไม่เปิดให้ใช้งาน" className="inline-flex cursor-not-allowed items-center rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-xs font-medium text-slate-400">
        {missingAccount ? "ยืนยันตัวตนและบัญชีธนาคาร" : "ส่งยืนยันบัญชีใหม่"}
      </button>
    </Card>
  );
}
