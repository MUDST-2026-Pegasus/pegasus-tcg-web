import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CreditCard } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PanelSkeleton, TableSkeleton } from "@/components/common/PageSkeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import { financeApi } from "@/features/finance/finance.api";
import type { Payout, Wallet } from "@/features/finance/finance.types";
import { dashboardKeys } from "@/features/seller/dashboard/dashboard.queries";
import { getErrorMessage, hasErrorCode } from "@/lib/api";
import { PayoutBalance } from "./components/PayoutBalance";
import { PayoutDetailSheet } from "./components/PayoutDetailSheet";
import { PayoutRequestDialog } from "./components/PayoutRequestDialog";
import { formatThaiDateTime, maskAccount, money, payoutDetail, payoutStatus, payoutStatuses, PAYOUT_MINIMUM, validatePayoutAmount, walletEntryLabel } from "./payout.format";

const blankWallet: Wallet = { balanceAvailable: 0, balancePending: 0, reservedForPayout: 0, withdrawable: 0, entries: { items: [], totalItems: 0 } };
const activeStatuses = new Set(["REQUESTED", "APPROVED", "PROCESSING"]);
const PAGE_SIZE = 20;

function StatusBadge({ status }: { status: string }) { const badge = payoutStatus(status); return <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${badge.className}`}>● {badge.label}</span>; }

function PayoutTracker({ payouts, onSelect }: { payouts: Payout[]; onSelect: (payout: Payout) => void }) {
  if (!payouts.length) return null;
  const total = payouts.reduce((sum, payout) => sum + Number(payout.amount), 0);
  return <Card className="gap-0 rounded-xl border bg-white py-0"><div className="border-b px-5 py-4"><h2 className="font-semibold">คำขอที่ยังไม่โอน</h2><p className="text-xs text-muted-foreground">ยอดรวม {money(total)} ถูกกันไว้ ยังไม่ถูกตัดจากกระเป๋า</p></div><div className="space-y-3 p-5">{payouts.map((payout) => {
    const step = payout.status === "REQUESTED" ? 1 : payout.status === "APPROVED" ? 2 : 3;
    return <button key={payout.id} type="button" onClick={() => onSelect(payout)} className="grid w-full items-center gap-4 rounded-lg border p-4 text-left hover:bg-slate-50 md:grid-cols-[190px_minmax(0,1fr)_80px]"><div className="space-y-1"><div className="flex items-center gap-2"><span className="text-xs text-muted-foreground">#{payout.id}</span><StatusBadge status={payout.status}/></div><strong className="block">{money(payout.amount)}</strong><p className="text-xs text-muted-foreground">{payoutDetail(payout)}</p></div><div className="grid grid-cols-4 gap-1 text-center text-[11px]">{["ส่งคำขอ", "แอดมินอนุมัติ", "กำลังโอน", "โอนสำเร็จ"].map((label, index) => <div key={label} className="relative">{index < 3 && <span className={`absolute left-[calc(50%+8px)] right-[calc(-50%+8px)] top-[5px] h-px ${index < step - 1 ? "bg-teal-600" : "bg-slate-200"}`}/>}<div className={`relative z-10 mx-auto mb-1 flex size-3 items-center justify-center rounded-full ${index < step - 1 ? "bg-teal-600" : index === step - 1 ? "border-2 border-teal-600 bg-white" : "border border-slate-200 bg-slate-100"}`}>{index === step - 1 && <span className="size-1 rounded-full bg-teal-600"/>}</div><span className={index < step ? "font-medium text-teal-700" : "text-muted-foreground"}>{label}</span>{index === 0 && <p className="text-muted-foreground">{formatThaiDateTime(payout.requestedAt)}</p>}{index === 1 && payout.approvedAt && <p className="text-muted-foreground">{formatThaiDateTime(payout.approvedAt)}</p>}</div>)}</div><span className="text-right text-xs text-teal-700">รายละเอียด ›</span></button>;
  })}</div></Card>;
}

export function SellerPayoutPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [tab, setTab] = useState<"payouts" | "wallet">("payouts");
  const [filter, setFilter] = useState("ALL");
  const [amount, setAmount] = useState("");
  const [showRequest, setShowRequest] = useState(false);
  const [selected, setSelected] = useState<Payout | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [conflict, setConflict] = useState<string | null>(null);
  const wallet = useQuery({ queryKey: ["finance", "wallet", page], queryFn: () => financeApi.wallet(page, PAGE_SIZE) });
  const payouts = useQuery({ queryKey: ["finance", "payouts"], queryFn: financeApi.myPayouts });
  const account = useQuery({ queryKey: ["finance", "payout-account"], queryFn: financeApi.payoutAccount, retry: false });
  const missingAccount = account.isError && hasErrorCode(account.error, "PAYOUT_ACCOUNT_NOT_FOUND");
  const unverified = [wallet.error, payouts.error, account.error].some((error) => error && hasErrorCode(error, "SELLER_NOT_VERIFIED"));
  const sellerNotFound = [wallet.error, payouts.error, account.error].some((error) => error && hasErrorCode(error, "SELLER_NOT_FOUND"));
  const otherError = [wallet.error, payouts.error, account.error].some((error) => error && !["PAYOUT_ACCOUNT_NOT_FOUND", "SELLER_NOT_VERIFIED", "SELLER_NOT_FOUND"].some((code) => hasErrorCode(error, code)));
  const data = wallet.data ?? blankWallet;
  const allPayouts = payouts.data ?? [];
  const active = allPayouts.filter((payout) => activeStatuses.has(payout.status));
  const paidTotal = allPayouts.filter((payout) => payout.status === "PAID").reduce((sum, payout) => sum + Number(payout.amount), 0);
  const history = filter === "ALL" ? allPayouts : allPayouts.filter((payout) => payout.status === filter);
  const blockedReason = missingAccount ? "ยังไม่มีบัญชีรับเงิน — ยืนยันตัวตนและบัญชีธนาคารให้ผ่านก่อน จึงจะขอถอนได้" : unverified ? "สถานะร้านยังไม่ใช่ 'ยืนยันแล้ว' — ยืนยันตัวตนและบัญชีธนาคารให้ผ่านก่อน จึงจะขอถอนได้" : !wallet.data || !payouts.data ? "ยังโหลดข้อมูลการเงินไม่ครบ กรุณาลองอีกครั้ง" : Number(data.withdrawable) < PAYOUT_MINIMUM ? `ต้องมียอดถอนได้อย่างน้อย ${money(PAYOUT_MINIMUM)} จึงจะส่งคำขอได้` : null;
  const selectedCurrent = selected && (allPayouts.find((payout) => payout.id === selected.id) ?? selected);

  function openRequest(value = "") { setAmount(value); setConflict(null); setSelected(null); setShowRequest(true); }
  async function requestPayout() {
    if (submitting || !account.data || validatePayoutAmount(amount, Number(data.withdrawable))) return;
    setSubmitting(true); setConflict(null);
    try {
      const created = await financeApi.requestPayout(Number(amount));
      queryClient.setQueriesData<Wallet>({ queryKey: ["finance", "wallet"] }, (current) => current ? {
        ...current,
        withdrawable: Math.max(0, Number(current.withdrawable) - Number(created.amount)),
        reservedForPayout: Number(current.reservedForPayout) + Number(created.amount),
      } : current);
      queryClient.setQueryData<Payout[]>(["finance", "payouts"], (current) => current ? [created, ...current] : current);
      setShowRequest(false); setAmount("");
      toast.add({ type: "success", title: `ส่งคำขอถอน #${created.id} แล้ว`, description: `${money(created.amount)} ถูกกันไว้ รอแอดมินตรวจสอบ` });
      await Promise.all([queryClient.invalidateQueries({ queryKey: ["finance", "wallet"] }), queryClient.invalidateQueries({ queryKey: ["finance", "payouts"] }), queryClient.invalidateQueries({ queryKey: dashboardKeys.all })]);
    } catch (error) {
      if (hasErrorCode(error, "INSUFFICIENT_BALANCE")) {
        const latest = await wallet.refetch();
        const latestAmount = Number(latest.data?.withdrawable ?? data.withdrawable);
        setConflict(`ยอดถอนได้เปลี่ยนไปแล้ว กรุณาตรวจสอบจำนวนเงินอีกครั้ง · ยอดล่าสุดคือ ${money(latestAmount)}`);
      } else {
        toast.add({ type: "error", title: "ขอถอนเงินไม่สำเร็จ", description: getErrorMessage(error, "กรุณาลองอีกครั้ง") });
        if (["VALIDATION_FAILED", "PAYOUT_BELOW_MINIMUM", "SELLER_NOT_VERIFIED", "PAYOUT_ACCOUNT_NOT_FOUND"].some((code) => hasErrorCode(error, code))) {
          void Promise.all([wallet.refetch(), payouts.refetch(), account.refetch()]);
        }
      }
    } finally { setSubmitting(false); }
  }

  if (sellerNotFound) return <div className="space-y-6"><h1 className="text-2xl font-bold">ถอนเงิน</h1><Card className="p-6"><h2 className="font-semibold">ยังไม่พร้อมถอนเงิน</h2><p className="text-sm text-muted-foreground">กรุณาสมัครและยืนยันตัวตนผู้ขายก่อน</p></Card></div>;
  return <div className="space-y-6"><header><h1 className="text-2xl font-bold">ถอนเงิน</h1><p className="text-sm text-muted-foreground">ขอถอนยอดเงินจากการขายเข้าบัญชีธนาคารที่ยืนยันแล้ว — แอดมินตรวจสอบและโอนให้ด้วยตนเอง</p></header>
    {(wallet.isPending || payouts.isPending || account.isPending) && <div role="status" aria-label="กำลังโหลดข้อมูลการเงิน" className="space-y-6"><div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_320px]"><Skeleton className="h-64 rounded-xl"/><PanelSkeleton rows={3}/></div><TableSkeleton rows={4} columns={5}/></div>}
    {otherError && <p role="alert" className="flex items-center gap-3 text-sm text-destructive">โหลดข้อมูลไม่สำเร็จ <Button variant="outline" size="sm" onClick={() => { void wallet.refetch(); void payouts.refetch(); void account.refetch(); }}>ลองอีกครั้ง</Button></p>}
    {!(wallet.isPending || payouts.isPending || account.isPending || otherError) && <><div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_320px]"><PayoutBalance wallet={wallet.data ?? null} pendingCount={payouts.data ? active.length : null} blockedReason={blockedReason} onWithdraw={() => openRequest()}/><Card className="gap-4 rounded-xl border bg-white p-5"><div className="flex items-center justify-between gap-2"><h2 className="font-semibold">บัญชีรับเงิน</h2><span className={`rounded-full px-2 py-1 text-xs ${account.data ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{account.data ? "ยืนยันแล้ว" : missingAccount ? "ยังไม่มี" : "ตรวจสอบไม่ได้"}</span></div>{account.data ? <div className="space-y-3 rounded-lg border bg-white p-4 text-sm"><div className="flex gap-3"><CreditCard className="size-5 shrink-0 text-teal-700"/><div><strong>{account.data.bankName}</strong><p>{maskAccount(account.data.accountNumber)}</p></div></div><div className="grid gap-3 border-t pt-2 sm:grid-cols-2 md:grid-cols-1 xl:grid-cols-2"><div><p className="text-xs text-muted-foreground">ชื่อบัญชี</p><p>{account.data.accountName}</p></div><div><p className="text-xs text-muted-foreground">ยืนยันเมื่อ</p><p>{formatThaiDateTime(account.data.verifiedAt)}</p></div></div></div> : <p className="text-sm text-muted-foreground">{missingAccount ? "ยังไม่มีบัญชีรับเงินที่ยืนยันแล้ว" : "ยังโหลดข้อมูลบัญชีรับเงินไม่ได้"}</p>}<p className="text-xs text-muted-foreground">เงินจะโอนเข้าบัญชีนี้เท่านั้น หากต้องการใช้บัญชีใหม่ กรุณาส่งเอกสารยืนยันอีกครั้ง</p><Link className="inline-flex items-center rounded-md border px-3 py-2 text-xs font-medium hover:bg-slate-50" to="/seller/verification">{missingAccount ? "ยืนยันตัวตนและบัญชีธนาคาร" : "ส่งยืนยันบัญชีใหม่"}</Link></Card></div>
    {payouts.data && <PayoutTracker payouts={active} onSelect={setSelected}/>}
    {!payouts.data && <p role="alert" className="rounded-xl border bg-white p-5 text-sm text-muted-foreground">ยังโหลดรายการคำขอถอนเงินไม่ได้ กรุณาลองอีกครั้งเมื่อบัญชีผู้ขายได้รับการยืนยัน</p>}
    <Card className="gap-0 overflow-hidden rounded-xl py-0"><div className="flex gap-5 border-b px-5"><button type="button" className={`py-4 text-sm ${tab === "payouts" ? "border-b-2 border-teal-600 font-semibold" : "text-muted-foreground"}`} onClick={() => setTab("payouts")}>คำขอถอนเงิน</button><button type="button" className={`py-4 text-sm ${tab === "wallet" ? "border-b-2 border-teal-600 font-semibold" : "text-muted-foreground"}`} onClick={() => setTab("wallet")}>รายการเคลื่อนไหวกระเป๋า</button></div>
    {tab === "payouts" ? payouts.data ? <><div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"><div><h2 className="font-semibold">คำขอถอนเงิน</h2><p className="text-xs text-muted-foreground">{allPayouts.length} คำขอ · โอนสำเร็จแล้วรวม {money(paidTotal)}</p></div><select aria-label="สถานะคำขอ" className="rounded-md border bg-white px-3 py-2 text-sm" value={filter} onChange={(event) => setFilter(event.target.value)}><option value="ALL">สถานะ: ทั้งหมด</option>{Object.entries(payoutStatuses).map(([value, status]) => <option key={value} value={value}>{status.label}</option>)}</select></div>{history.length ? <div className="overflow-x-auto"><table className="w-full min-w-[740px] text-left text-sm"><thead className="bg-[#f0f3f3] text-xs text-muted-foreground"><tr><th className="px-5 py-3">วันที่ขอ</th><th>เลขที่</th><th>จำนวนเงิน</th><th>สถานะ</th><th>รายละเอียด</th><th className="pr-5"> </th></tr></thead><tbody>{history.map((payout) => <tr key={payout.id} className="cursor-pointer border-t hover:bg-slate-50" onClick={() => setSelected(payout)}><td className="px-5 py-4">{formatThaiDateTime(payout.requestedAt)}</td><td>#{payout.id}</td><td className="font-semibold">{money(payout.amount)}</td><td><StatusBadge status={payout.status}/></td><td className={payout.status === "REJECTED" || payout.status === "FAILED" ? "text-red-700" : ""}>{payoutDetail(payout)}</td><td className="pr-5"><button type="button" className="text-teal-700 hover:underline" onClick={() => setSelected(payout)}>ดูรายละเอียด ›</button></td></tr>)}</tbody></table></div> : <CardContent className="py-12 text-center"><p className="font-semibold">ยังไม่มีคำขอถอนเงิน</p><p className="mt-1 text-sm text-muted-foreground">เมื่อมียอดถอนได้อย่างน้อย {money(PAYOUT_MINIMUM)} คุณสามารถส่งคำขอถอนเงินได้ที่ปุ่มด้านบน</p></CardContent>}</> : <p className="p-8 text-center text-sm text-muted-foreground">ยังโหลดรายการคำขอถอนเงินไม่ได้</p> : wallet.data ? <><div className="px-5 py-4"><h2 className="font-semibold">รายการเคลื่อนไหวกระเป๋า</h2><p className="text-xs text-muted-foreground">ทุกการเปลี่ยนแปลงยอดในกระเป๋า เรียงล่าสุดก่อน · ยอดที่ขอถอนจะขึ้นที่นี่เมื่อโอนสำเร็จเท่านั้น</p></div><div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead className="bg-[#f0f3f3] text-xs text-muted-foreground"><tr><th className="px-5 py-3">วันที่</th><th>รายการ</th><th>อ้างอิง</th><th className="text-right">จำนวน</th><th className="pr-5 text-right">คงเหลือ</th></tr></thead><tbody>{data.entries.items.map((entry) => { const linked = entry.referenceType === "PAYOUT" ? allPayouts.find((payout) => payout.id === entry.referenceId) : null; return <tr key={entry.id} className="border-t"><td className="px-5 py-4">{formatThaiDateTime(entry.createdAt)}</td><td className="font-medium">{walletEntryLabel(entry.type)}</td><td>{linked ? <button type="button" className="text-teal-700 hover:underline" onClick={() => setSelected(linked)}>คำขอถอน #{linked.id}</button> : entry.referenceId ? `${entry.referenceType ?? "รายการ"} #${entry.referenceId}` : "—"}</td><td className={`text-right font-semibold ${entry.direction === "CREDIT" ? "text-emerald-700" : "text-red-600"}`}>{entry.direction === "CREDIT" ? "+" : "−"}{money(entry.amount)}</td><td className="pr-5 text-right text-muted-foreground">{money(entry.balanceAfter)}</td></tr>; })}</tbody></table>{!data.entries.items.length && <p className="p-8 text-center text-sm text-muted-foreground">ยังไม่มีรายการเคลื่อนไหว</p>}</div><div className="flex items-center justify-between border-t px-5 py-3 text-xs text-muted-foreground"><p>แสดง {data.entries.totalItems ? page * PAGE_SIZE + 1 : 0}–{Math.min((page + 1) * PAGE_SIZE, data.entries.totalItems)} จาก {data.entries.totalItems} รายการ</p><div className="flex gap-2"><Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((value) => value - 1)}>ก่อนหน้า</Button><Button variant="outline" size="sm" disabled={(page + 1) * PAGE_SIZE >= data.entries.totalItems} onClick={() => setPage((value) => value + 1)}>ถัดไป</Button></div></div></> : <p className="p-8 text-center text-sm text-muted-foreground">ยังโหลดรายการเคลื่อนไหวกระเป๋าไม่ได้</p>}
    </Card></>}
    {account.data && <PayoutRequestDialog open={showRequest} onOpenChange={setShowRequest} amount={amount} onAmountChange={(value) => { setAmount(value); setConflict(null); }} withdrawable={Number(data.withdrawable)} account={account.data} submitting={submitting} conflict={conflict} onSubmit={() => void requestPayout()}/>}
    <PayoutDetailSheet payout={selectedCurrent} onClose={() => setSelected(null)} onRetry={(value) => openRequest(value.toFixed(2))}/>
  </div>;
}
