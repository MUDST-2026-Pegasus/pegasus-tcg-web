import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { financeApi } from "@/features/finance/finance.api";
import { getErrorMessage, hasErrorCode } from "@/lib/api";

const money = (value: number) => `฿${Number(value).toLocaleString("th-TH", { minimumFractionDigits: 2 })}`;

export function SellerPayoutPage() {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const wallet = useQuery({ queryKey: ["finance", "wallet"], queryFn: financeApi.wallet });
  const payouts = useQuery({ queryKey: ["finance", "payouts"], queryFn: financeApi.myPayouts });
  const account = useQuery({
    queryKey: ["finance", "payout-account"],
    queryFn: financeApi.payoutAccount,
    retry: false,
  });
  const missingAccount = account.isError && hasErrorCode(account.error, "PAYOUT_ACCOUNT_NOT_FOUND");
  const available = Number(wallet.data?.withdrawable ?? 0);
  const requested = Number(amount);
  const validAmount = /^\d+(?:\.\d{1,2})?$/.test(amount) && requested > 0 && requested <= available;

  async function requestPayout() {
    if (!validAmount || !account.data || !window.confirm(`ยืนยันการขอถอน ${money(requested)} ไปยังบัญชี ${account.data.accountNumber}?`)) return;
    setIsSubmitting(true);
    try {
      await financeApi.requestPayout(requested);
      setAmount("");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["finance", "wallet"] }),
        queryClient.invalidateQueries({ queryKey: ["finance", "payouts"] }),
      ]);
      toast.add({ type: "success", title: "ส่งคำขอถอนแล้ว", description: "รอผู้ดูแลดำเนินการโอนเงิน" });
    } catch (error) {
      toast.add({ type: "error", title: "ขอถอนเงินไม่สำเร็จ", description: getErrorMessage(error, "กรุณาลองอีกครั้ง") });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">การเงินและถอนเงิน</h1>
      {(wallet.isPending || payouts.isPending || account.isPending) && <p>กำลังโหลดข้อมูลการเงิน...</p>}
      {(wallet.isError || payouts.isError || (account.isError && !missingAccount)) && (
        <p role="alert" className="text-destructive">โหลดข้อมูลไม่สำเร็จ กรุณาลองใหม่</p>
      )}
      {wallet.data && (
        <Card>
          <CardHeader><CardTitle>ยอดเงินใน Wallet</CardTitle></CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-4">
            <p>พร้อมถอน <strong>{money(wallet.data.withdrawable)}</strong></p>
            <p>ยอดที่รับแล้ว <strong>{money(wallet.data.balanceAvailable)}</strong></p>
            <p>รอปล่อยเงิน <strong>{money(wallet.data.balancePending)}</strong></p>
            <p>กันไว้สำหรับคำขอถอน <strong>{money(wallet.data.reservedForPayout)}</strong></p>
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader><CardTitle>ขอถอนเงิน</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {account.data ? (
            <p>บัญชีที่ยืนยันแล้ว: {account.data.bankName} {account.data.accountNumber} ({account.data.accountName})</p>
          ) : missingAccount ? (
            <p>ยังไม่มีบัญชีรับเงินที่ยืนยันแล้ว กรุณายืนยันบัญชีธนาคารก่อนถอนเงิน</p>
          ) : null}
          <Input type="number" min="0.01" max={available} step="0.01" inputMode="decimal" aria-label="จำนวนเงินที่ต้องการถอน" placeholder="จำนวนเงินที่ต้องการถอน" value={amount} onChange={(event) => setAmount(event.target.value)} />
          <Button disabled={!validAmount || !account.data || isSubmitting} onClick={requestPayout}>
            {isSubmitting ? "กำลังส่งคำขอ..." : "ยืนยันคำขอถอนเงิน"}
          </Button>
          <p className="text-sm text-muted-foreground">ระบบจะกันยอดเงินไว้เมื่อส่งคำขอ และหักเงินจริงเมื่อผู้ดูแลยืนยันการโอน</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>ประวัติการถอนเงิน</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {payouts.data?.length === 0 && <p>ยังไม่มีรายการถอนเงิน</p>}
          {payouts.data?.map((payout) => (
            <div key={payout.id} className="flex flex-wrap justify-between gap-2 border-b py-2">
              <span>#{payout.id} · {new Date(payout.requestedAt).toLocaleString("th-TH")}</span>
              <span>{money(payout.amount)} · {payout.status}</span>
              {payout.rejectionReason && <span className="w-full text-sm text-destructive">{payout.rejectionReason}</span>}
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>รายการ Wallet</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {wallet.data?.entries.items.length === 0 && <p>ยังไม่มีรายการ</p>}
          {wallet.data?.entries.items.map((entry) => (
            <div key={entry.id} className="flex justify-between border-b py-2 text-sm">
              <span>{entry.type} · {new Date(entry.createdAt).toLocaleString("th-TH")}</span>
              <span>{entry.direction === "CREDIT" ? "+" : "−"}{money(entry.amount)}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
