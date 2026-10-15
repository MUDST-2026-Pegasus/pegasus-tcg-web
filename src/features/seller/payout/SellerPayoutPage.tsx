import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PanelSkeleton, TableSkeleton } from "@/components/common/PageSkeletons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import { financeApi } from "@/features/finance/finance.api";
import { getErrorMessage, hasErrorCode } from "@/lib/api";
import { BalanceCard } from "./components/BalanceCard";
import { walletEntryLabel } from "./payout.format";

const money = (value: number) => `฿${Number(value).toLocaleString("th-TH", { minimumFractionDigits: 2 })}`;
const maskAccount = (value: string) => value.length > 4 ? `••••${value.slice(-4)}` : value;
const payoutStatus: Record<string, string> = { REQUESTED: "รอตรวจสอบ", APPROVED: "อนุมัติแล้ว", PROCESSING: "กำลังโอน", PAID: "โอนสำเร็จ", REJECTED: "ปฏิเสธ", FAILED: "โอนไม่สำเร็จ", CANCELLED: "ยกเลิก" };

export function SellerPayoutPage() {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState("");
  const [showRequest, setShowRequest] = useState(false);
  const [year, setYear] = useState("all");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const wallet = useQuery({ queryKey: ["finance", "wallet"], queryFn: financeApi.wallet });
  const payouts = useQuery({ queryKey: ["finance", "payouts"], queryFn: financeApi.myPayouts });
  const account = useQuery({
    queryKey: ["finance", "payout-account"],
    queryFn: financeApi.payoutAccount,
    retry: false,
  });
  const missingAccount = account.isError && hasErrorCode(account.error, "PAYOUT_ACCOUNT_NOT_FOUND");
  const needsVerification = [wallet.error, payouts.error, account.error].some((error) =>
    error && (hasErrorCode(error, "SELLER_NOT_FOUND") || hasErrorCode(error, "SELLER_NOT_VERIFIED")));
  const available = Number(wallet.data?.withdrawable ?? 0);
  const requested = Number(amount);
  const validAmount = /^\d+(?:\.\d{1,2})?$/.test(amount) && requested > 0 && requested <= available;
  const paidTotal = payouts.data?.filter((payout) => payout.status === "PAID").reduce((sum, payout) => sum + Number(payout.amount), 0) ?? 0;
  const years = Array.from(new Set(payouts.data?.map((payout) => String(new Date(payout.requestedAt).getFullYear())) ?? [])).sort().reverse();
  const yearItems = [{ value: "all", label: "ทุกปี" }, ...years.map((value) => ({ value, label: `ปี ${Number(value) + 543}` }))];
  const history = payouts.data?.filter((payout) => year === "all" || String(new Date(payout.requestedAt).getFullYear()) === year) ?? [];

  async function requestPayout() {
    if (!validAmount || !account.data || !window.confirm(`ยืนยันการขอถอน ${money(requested)} ไปยังบัญชี ${account.data.accountNumber}?`)) return;
    setIsSubmitting(true);
    try {
      await financeApi.requestPayout(requested);
      setAmount("");
      setShowRequest(false);
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

  function exportHistory() {
    const rows = [["id", "requested_at", "amount", "status", "transfer_reference"], ...history.map((payout) => [String(payout.id), payout.requestedAt, String(payout.amount), payout.status, payout.transferReference ?? ""])];
    const csv = "\uFEFF" + rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = `payouts-${year}.csv`; link.click(); URL.revokeObjectURL(url);
  }

  if (needsVerification) return <div className="space-y-6"><div><h1 className="text-2xl font-bold">ถอนเงิน</h1><p className="text-xs text-muted-foreground">ยอดเงินจากการขายและประวัติการโอนเข้าบัญชีธนาคาร</p></div><Card><CardHeader><CardTitle>ยังไม่พร้อมถอนเงิน</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">กรุณาสมัครและยืนยันตัวตนผู้ขายก่อน ระบบจึงจะสร้างบัญชีรับเงินและเปิด Wallet ให้ใช้งาน</CardContent></Card></div>;

  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-bold">ถอนเงิน</h1><p className="text-xs text-muted-foreground">ยอดเงินจากการขายและประวัติการโอนเข้าบัญชีธนาคาร</p></div><Button variant="outline" size="sm" disabled={!payouts.data?.length} onClick={exportHistory}>ดาวน์โหลดใบสรุป</Button></div>
    {(wallet.isPending || payouts.isPending || account.isPending) && <PayoutSkeleton />}
    {(wallet.isError || payouts.isError || (account.isError && !missingAccount)) && <p role="alert" className="text-destructive">โหลดข้อมูลไม่สำเร็จ <Button variant="outline" onClick={() => { void wallet.refetch(); void payouts.refetch(); void account.refetch(); }}>ลองอีกครั้ง</Button></p>}
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      {wallet.data && <BalanceCard label="ยอดเงินพร้อมถอน" amount={money(available)} withdrawLabel="ถอนเงินตอนนี้" onWithdraw={() => setShowRequest(true)} withdrawDisabled={!account.data || available <= 0}
        stats={[{ id: "processing", label: "กำลังดำเนินการ", value: money(wallet.data.reservedForPayout) }, { id: "pending", label: "รอครบกำหนด", value: money(wallet.data.balancePending) }, { id: "paid", label: "ถอนสะสมทั้งหมด", value: money(paidTotal) }]}
        scheduleNote="คำขอถอนเงินต้องรอผู้ดูแลตรวจสอบและยืนยันการโอน" />}
      <Card className="gap-3 rounded-xl p-5"><div className="flex justify-between"><h2 className="text-sm font-semibold">บัญชีรับเงิน</h2>{account.data && <Badge className="bg-green-100 text-emerald-700">ยืนยันแล้ว</Badge>}</div>
        {account.data ? <div className="space-y-3 rounded-lg border bg-neutral-50 p-4"><div className="flex items-center gap-3"><CreditCard className="size-6 text-teal-600" /><div><p className="font-medium">{account.data.bankName}</p><p className="text-sm text-muted-foreground">{maskAccount(account.data.accountNumber)}</p></div></div><div className="border-t pt-2"><p className="text-xs text-muted-foreground">ชื่อบัญชี</p><p className="text-sm">{account.data.accountName}</p></div></div>
          : <p className="text-sm text-muted-foreground">{missingAccount ? "ยังไม่มีบัญชีรับเงินที่ยืนยันแล้ว" : "กำลังตรวจสอบบัญชีรับเงิน"}</p>}
        <p className="text-xs text-muted-foreground">บัญชีนี้มาจากการยืนยันตัวตนของผู้ขาย การเปลี่ยนบัญชีต้องยืนยันใหม่</p>
      </Card>
    </div>
    {showRequest && <Card><CardHeader><CardTitle>ขอถอนเงิน</CardTitle></CardHeader><CardContent className="space-y-3"><p className="text-sm">ยอดพร้อมถอน {money(available)} · บัญชีปลายทาง {account.data ? maskAccount(account.data.accountNumber) : "ยังไม่พร้อม"}</p><Input aria-label="จำนวนเงินที่ต้องการถอน" type="number" min="0.01" max={available} step="0.01" inputMode="decimal" placeholder="จำนวนเงินที่ต้องการถอน" value={amount} onChange={(event) => setAmount(event.target.value)} /><div className="flex gap-2"><Button disabled={!validAmount || !account.data || isSubmitting} onClick={() => void requestPayout()}>{isSubmitting ? "กำลังส่งคำขอ..." : "ยืนยันคำขอถอนเงิน"}</Button><Button variant="outline" onClick={() => setShowRequest(false)}>ยกเลิก</Button></div><p className="text-xs text-muted-foreground">ระบบจะกันยอดเงินไว้เมื่อส่งคำขอ และหักเงินจริงเมื่อผู้ดูแลยืนยันการโอน</p></CardContent></Card>}
    <Card className="gap-0"><CardHeader><div className="flex flex-wrap items-center justify-between gap-2"><div><CardTitle>ประวัติการถอนเงิน</CardTitle><p className="text-xs text-muted-foreground">{history.length} รายการ · ยอดรวม {money(history.reduce((sum, payout) => sum + Number(payout.amount), 0))}</p></div><div className="flex gap-2"><Select items={yearItems} value={year} onValueChange={(value) => setYear(value ?? "all")}><SelectTrigger aria-label="เลือกปี" size="sm" className="rounded-md border-border bg-background"><SelectValue /></SelectTrigger><SelectContent><SelectGroup>{yearItems.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectGroup></SelectContent></Select><Button variant="outline" size="sm" disabled={!history.length} onClick={exportHistory}>ส่งออก CSV</Button></div></div></CardHeader><CardContent className="overflow-x-auto">
      {history.length === 0 ? <p className="py-4 text-sm text-muted-foreground">ยังไม่มีรายการถอนเงินในช่วงที่เลือก</p> : <table className="w-full min-w-[680px] text-left text-sm"><thead className="border-y bg-neutral-50 text-muted-foreground"><tr><th className="p-3">วันที่ทำรายการ</th><th>รหัสรายการ</th><th>จำนวนเงิน</th><th>ปลายทาง</th><th>สถานะ</th><th>อ้างอิงการโอน</th></tr></thead><tbody>{history.map((payout) => <tr key={payout.id} className="border-b"><td className="p-3">{new Date(payout.requestedAt).toLocaleString("th-TH")}</td><td>#{payout.id}</td><td className="font-semibold">{money(payout.amount)}</td><td>{account.data ? `${account.data.bankName} ${maskAccount(account.data.accountNumber)}` : "—"}</td><td><Badge variant={payout.status === "PAID" ? "secondary" : payout.status === "REJECTED" || payout.status === "FAILED" ? "destructive" : "outline"}>{payoutStatus[payout.status] ?? payout.status}</Badge></td><td>{payout.transferReference ?? payout.rejectionReason ?? "—"}</td></tr>)}</tbody></table>}
    </CardContent></Card>
    <details className="rounded-lg border p-4"><summary className="cursor-pointer font-medium">รายการเคลื่อนไหว Wallet</summary><div className="mt-3 space-y-2">{wallet.data?.entries.items.length === 0 && <p className="text-sm text-muted-foreground">ยังไม่มีรายการ</p>}{wallet.data?.entries.items.map((entry) => <div key={entry.id} className="flex justify-between border-b py-2 text-sm"><span>{walletEntryLabel(entry.type)} · {new Date(entry.createdAt).toLocaleString("th-TH")}</span><span>{entry.direction === "CREDIT" ? "+" : "−"}{money(entry.amount)}</span></div>)}</div></details>
  </div>;
}

/** วางตรงกับยอดเงิน + บัญชีรับเงิน + ประวัติ ระหว่างรอ wallet / payouts / account */
function PayoutSkeleton() {
  return <div role="status" aria-busy="true" aria-label="กำลังโหลดข้อมูลการเงิน" className="space-y-6">
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      <Skeleton className="h-56 rounded-2xl" />
      <PanelSkeleton rows={2} className="rounded-xl" />
    </div>
    <TableSkeleton rows={4} columns={4} />
  </div>;
}
