import { CreditCard } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { PayoutAccount } from "@/features/finance/finance.types";
import { formatThaiDateTime, maskAccount } from "../payout.format";
import { useTranslate } from "@/lib/i18n";

type Props = {
  account: PayoutAccount | null;
  missingAccount: boolean;
};

export function PayoutAccountCard({ account, missingAccount }: Props) {
  const { t } = useTranslate("seller");
  const badge = account ? t("payout.account.verified", "ยืนยันแล้ว") : missingAccount ? t("payout.account.missing", "ยังไม่มี") : t("payout.account.unknown", "ตรวจสอบไม่ได้");

  return (
    <Card className="gap-4 rounded-xl border bg-card p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-semibold">{t("payout.account.title", "บัญชีรับเงิน")}</h2>
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
              <p className="text-xs text-muted-foreground">{t("payout.account.name", "ชื่อบัญชี")}</p>
              <p>{account.accountName}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("payout.account.verifiedAt", "ยืนยันเมื่อ")}</p>
              <p>{formatThaiDateTime(account.verifiedAt)}</p>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          {missingAccount ? t("payout.account.none", "ยังไม่มีบัญชีรับเงินที่ยืนยันแล้ว") : t("payout.account.loadFailed", "ยังโหลดข้อมูลบัญชีรับเงินไม่ได้")}
        </p>
      )}

      <p className="text-xs text-muted-foreground">
        {t("payout.account.note", "เงินจะโอนเข้าบัญชีนี้เท่านั้น หากต้องการใช้บัญชีใหม่ กรุณาส่งเอกสารยืนยันอีกครั้ง")}
      </p>
      <button type="button" disabled title={t("payout.account.notAvailable", "ยังไม่เปิดให้ใช้งาน")} className="inline-flex cursor-not-allowed items-center rounded-md border border-slate-200 bg-secondary px-3 py-2 text-xs font-medium text-slate-400">
        {missingAccount ? t("payout.account.verify", "ยืนยันตัวตนและบัญชีธนาคาร") : t("payout.account.reverify", "ส่งยืนยันบัญชีใหม่")}
      </button>
    </Card>
  );
}
