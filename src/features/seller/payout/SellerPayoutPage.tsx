import { useState } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PanelSkeleton, TableSkeleton } from "@/components/common/PageSkeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import { financeApi } from "@/features/finance/finance.api";
import type { Payout, Wallet } from "@/features/finance/finance.types";
import { dashboardKeys } from "@/features/seller/dashboard/dashboard.queries";
import { hasErrorCode } from "@/lib/api";
import { PayoutAccountCard } from "./components/PayoutAccountCard";
import { PayoutBalance } from "./components/PayoutBalance";
import { PayoutDetailSheet } from "./components/PayoutDetailSheet";
import { PayoutHistory } from "./components/PayoutHistory";
import { PayoutRequestDialog } from "./components/PayoutRequestDialog";
import { PayoutTracker } from "./components/PayoutTracker";
import { WalletLedger } from "./components/WalletLedger";
import { money, PAYOUT_MINIMUM, validatePayoutAmount } from "./payout.format";
import { translateError, useTranslate } from "@/lib/i18n";

const activeStatuses = new Set(["REQUESTED", "APPROVED", "PROCESSING"]);
const PAGE_SIZE = 20;

export function SellerPayoutPage() {
  const { t } = useTranslate("seller");
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [tab, setTab] = useState<"payouts" | "wallet">("payouts");
  const [filter, setFilter] = useState("ALL");
  const [amount, setAmount] = useState("");
  const [showRequest, setShowRequest] = useState(false);
  const [selected, setSelected] = useState<Payout | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [conflict, setConflict] = useState<string | null>(null);
  const wallet = useQuery({
    queryKey: ["finance", "wallet", page],
    queryFn: () => financeApi.wallet(page, PAGE_SIZE),
    placeholderData: keepPreviousData,
  });
  const payouts = useQuery({ queryKey: ["finance", "payouts"], queryFn: financeApi.myPayouts });
  const account = useQuery({ queryKey: ["finance", "payout-account"], queryFn: financeApi.payoutAccount, retry: false });
  const missingAccount = account.isError && hasErrorCode(account.error, "PAYOUT_ACCOUNT_NOT_FOUND");
  const unverified = [wallet.error, payouts.error, account.error].some((error) => error && hasErrorCode(error, "SELLER_NOT_VERIFIED"));
  const sellerNotFound = [wallet.error, payouts.error, account.error].some((error) => error && hasErrorCode(error, "SELLER_NOT_FOUND"));
  const otherError = [wallet.error, payouts.error, account.error].some((error) => error && !["PAYOUT_ACCOUNT_NOT_FOUND", "SELLER_NOT_VERIFIED", "SELLER_NOT_FOUND"].some((code) => hasErrorCode(error, code)));
  const allPayouts = payouts.data ?? [];
  const active = allPayouts.filter((payout) => activeStatuses.has(payout.status));
  const withdrawable = Number(wallet.data?.withdrawable ?? 0);
  const blockedReason = missingAccount ? t("payout.blocked.noAccount", "ยังไม่มีบัญชีรับเงิน — ยืนยันตัวตนและบัญชีธนาคารให้ผ่านก่อน จึงจะขอถอนได้") : unverified ? t("payout.blocked.unverified", "สถานะร้านยังไม่ใช่ ''ยืนยันแล้ว'' — ยืนยันตัวตนและบัญชีธนาคารให้ผ่านก่อน จึงจะขอถอนได้") : !wallet.data || !payouts.data ? t("payout.blocked.notLoaded", "ยังโหลดข้อมูลการเงินไม่ครบ กรุณาลองอีกครั้ง") : withdrawable < PAYOUT_MINIMUM ? t("payout.blocked.belowMinimum", "ต้องมียอดถอนได้อย่างน้อย {min} จึงจะส่งคำขอได้", { min: money(PAYOUT_MINIMUM) }) : null;
  const selectedCurrent = selected && (allPayouts.find((payout) => payout.id === selected.id) ?? selected);

  function openRequest(value = "") {
    if (blockedReason) return;
    setAmount(value);
    setConflict(null);
    setSelected(null);
    setShowRequest(true);
  }
  function changeDialogOpen(open: boolean) {
    if (submitting && !open) return;
    setShowRequest(open);
  }
  async function requestPayout() {
    if (submitting || !account.data || !wallet.data || blockedReason || validatePayoutAmount(amount, withdrawable)) return;
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
      toast.add({ type: "success", title: t("payout.request.success", "ส่งคำขอถอน #{id} แล้ว", { id: created.id }), description: t("payout.request.successDescription", "{amount} ถูกกันไว้ รอแอดมินตรวจสอบ", { amount: money(created.amount) }) });
      await Promise.all([queryClient.invalidateQueries({ queryKey: ["finance", "wallet"] }), queryClient.invalidateQueries({ queryKey: ["finance", "payouts"] }), queryClient.invalidateQueries({ queryKey: dashboardKeys.all })]);
    } catch (error) {
      if (hasErrorCode(error, "INSUFFICIENT_BALANCE")) {
        const latest = await wallet.refetch();
        const latestAmount = Number(latest.data?.withdrawable ?? withdrawable);
        setConflict(t("payout.request.conflict", "ยอดถอนได้เปลี่ยนไปแล้ว กรุณาตรวจสอบจำนวนเงินอีกครั้ง · ยอดล่าสุดคือ {amount}", { amount: money(latestAmount) }));
      } else {
        toast.add({ type: "error", title: t("payout.request.failed", "ขอถอนเงินไม่สำเร็จ"), description: translateError(error, t("payout.tryAgain", "กรุณาลองอีกครั้ง")) });
        if (["VALIDATION_FAILED", "PAYOUT_BELOW_MINIMUM", "SELLER_NOT_VERIFIED", "PAYOUT_ACCOUNT_NOT_FOUND"].some((code) => hasErrorCode(error, code))) {
          void Promise.all([wallet.refetch(), payouts.refetch(), account.refetch()]);
        }
      }
    } finally { setSubmitting(false); }
  }

  if (sellerNotFound) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">{t("payout.title", "ถอนเงิน")}</h1>
        <Card className="p-6">
          <h2 className="font-semibold">{t("payout.notReady.title", "ยังไม่พร้อมถอนเงิน")}</h2>
          <p className="text-sm text-muted-foreground">{t("payout.notReady.description", "กรุณาสมัครและยืนยันตัวตนผู้ขายก่อน")}</p>
        </Card>
      </div>
    );
  }

  const initialLoading = wallet.isPending || payouts.isPending || account.isPending;
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">{t("payout.title", "ถอนเงิน")}</h1>
        <p className="text-sm text-muted-foreground">{t("payout.subtitle", "ขอถอนยอดเงินจากการขายเข้าบัญชีธนาคารที่ยืนยันแล้ว — แอดมินตรวจสอบและโอนให้ด้วยตนเอง")}</p>
      </header>

      {initialLoading && (
        <div role="status" aria-label={t("payout.loading", "กำลังโหลดข้อมูลการเงิน")} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_320px]">
            <Skeleton className="h-64 rounded-xl" />
            <PanelSkeleton rows={3} />
          </div>
          <TableSkeleton rows={4} columns={5} />
        </div>
      )}
      {otherError && (
        <p role="alert" className="flex items-center gap-3 text-sm text-destructive">
          {t("payout.loadFailed", "โหลดข้อมูลไม่สำเร็จ")}
          <Button variant="outline" size="sm" onClick={() => { void wallet.refetch(); void payouts.refetch(); void account.refetch(); }}>{t("payout.retry", "ลองอีกครั้ง")}</Button>
        </p>
      )}

      {!initialLoading && !otherError && (
        <>
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_320px]">
            <PayoutBalance wallet={wallet.data ?? null} pendingCount={payouts.data ? active.length : null} blockedReason={blockedReason} onWithdraw={() => openRequest()} />
            <PayoutAccountCard account={account.data ?? null} missingAccount={missingAccount} />
          </div>

          {payouts.data ? (
            <PayoutTracker payouts={active} onSelect={setSelected} />
          ) : (
            <p role="alert" className="rounded-xl border bg-card p-5 text-sm text-muted-foreground">{t("payout.history.unavailableUnverified", "ยังโหลดรายการคำขอถอนเงินไม่ได้ กรุณาลองอีกครั้งเมื่อบัญชีผู้ขายได้รับการยืนยัน")}</p>
          )}

          <Card className="gap-0 overflow-hidden rounded-xl py-0">
            <div className="flex gap-5 border-b px-5">
              <button type="button" className={`py-4 text-sm ${tab === "payouts" ? "border-b-2 border-teal-600 font-semibold" : "text-muted-foreground"}`} onClick={() => setTab("payouts")}>{t("payout.tabs.payouts", "คำขอถอนเงิน")}</button>
              <button type="button" className={`py-4 text-sm ${tab === "wallet" ? "border-b-2 border-teal-600 font-semibold" : "text-muted-foreground"}`} onClick={() => setTab("wallet")}>{t("payout.tabs.wallet", "รายการเคลื่อนไหวกระเป๋า")}</button>
            </div>
            {tab === "payouts" ? (
              <PayoutHistory payouts={payouts.data ?? null} filter={filter} onFilterChange={setFilter} onSelect={setSelected} />
            ) : (
              <WalletLedger wallet={wallet.data ?? null} payouts={allPayouts} page={page} pageSize={PAGE_SIZE} isFetching={wallet.isFetching} onPageChange={setPage} onSelect={setSelected} />
            )}
          </Card>
        </>
      )}

      {account.data && (
        <PayoutRequestDialog
          open={showRequest}
          onOpenChange={changeDialogOpen}
          amount={amount}
          onAmountChange={(value) => { setAmount(value); setConflict(null); }}
          withdrawable={withdrawable}
          account={account.data}
          submitting={submitting}
          conflict={conflict}
          onSubmit={() => void requestPayout()}
        />
      )}
      <PayoutDetailSheet payout={selectedCurrent} onClose={() => setSelected(null)} onRetry={(value) => openRequest(value.toFixed(2))} canRetry={!blockedReason} />
    </div>
  );
}
