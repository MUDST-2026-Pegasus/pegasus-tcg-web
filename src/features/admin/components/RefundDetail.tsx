import { useState } from "react";
import { CheckCircle2, CreditCard } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

import {
  financeErrorMessage,
  formatAccountNumber,
  formatBaht,
  formatThaiDateTime,
  NEUTRAL_BADGE,
  REFUND_STATUS_META,
  RESOLUTION_LABEL,
  refundSourceLabel,
} from "../finance.format";
import {
  useCompleteRefundTransfer,
  useFailRefundTransfer,
  useRefundTransfers,
  useStartRefundTransfer,
} from "../finance.queries";
import { refundMethodLabel } from "@/features/finance/refund.format";

import type { AdminRefund, RefundStatus } from "../finance.types";
import { AmountRow, InfoField, PartyAvatar } from "./FinanceShared";
import { FinanceReasonDialog } from "./FinanceReasonDialog";
import { useTranslate, translate } from "@/lib/i18n";

/**
 * คอลัมน์ขวาของหน้าคืนเงิน — ยอด + บัญชีผู้ซื้อ, ขั้นตอนโอนสองขั้น, ประวัติการโอน
 *
 * ขั้น 1 พิมพ์เลขบัญชีซ้ำเพื่อล็อกปลายทาง (APPROVED → PROCESSING) ถ้าผู้ซื้อแก้บัญชีระหว่างนั้น
 * backend ตอบ REFUND_DESTINATION_CHANGED · ขั้น 2 กรอกเลขอ้างอิงการโอน (→ PROCESSED)
 * หรือแจ้งโอนไม่สำเร็จ (→ กลับเป็น APPROVED ให้ผู้ซื้อแก้บัญชี)
 *
 * ผู้เรียกใส่ `key={refund.id}` ให้ช่องกรอกล้างเองเมื่อเปลี่ยนรายการ
 */
export function RefundDetail({
  refund,
  onMoved,
}: {
  refund: AdminRefund;
  /** รายการเปลี่ยนสถานะแล้ว — ให้หน้าหลักสลับแท็บตามไป รายการจะได้ไม่หลุดจากจอ */
  onMoved: (status: RefundStatus) => void;
}) {
  const { t } = useTranslate("admin");
  const meta = REFUND_STATUS_META[refund.status];
  const source = refundSourceLabel(refund.resolution, refund.returnRequestId);
  const typeLabel = refund.resolution
    ? `${RESOLUTION_LABEL[refund.resolution] ?? source.label} (${refund.resolution})`
    : refund.returnRequestId === null
      ? t("refunds.source.cancel", "ยกเลิกคำสั่งซื้อ")
      : source.label;
  const settled = refund.status === "PROCESSED";
  const refundedBefore =
    refund.escrowRefunded === null ? null : refund.escrowRefunded - (settled ? refund.amount : 0);
  const remaining =
    refund.escrowAmount === null || refund.escrowRefunded === null
      ? null
      : refund.escrowAmount - refund.escrowRefunded - (settled ? 0 : refund.amount);
  const origin =
    refund.returnRequestId !== null
      ? t("refunds.origin.return", "มาจากคืนสินค้า RTN-{id} ของ {order}", { id: refund.returnRequestId, order: refund.orderNumber })
      : t("refunds.origin.cancel", "มาจากการยกเลิก {order}", { order: refund.orderNumber });
  const shop =
    refund.seller && refund.sellerOrderNumber
      ? ` (${t("refunds.origin.shop", "ร้าน {shop} · {so}", { shop: refund.seller.username, so: refund.sellerOrderNumber })})`
      : "";

  return (
    <div className="flex w-full min-w-0 flex-1 flex-col gap-4">
      <Card className="gap-5 rounded-xl border border-border p-5 shadow-none ring-0">
        <div className="flex items-center gap-3.5">
          <PartyAvatar party={refund.buyer} className="size-[52px]" />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-foreground">{refund.buyer.username}</h2>
              <Badge className={cn("h-5 rounded-full px-2 text-[11px] font-medium", meta.badgeClass)}>
                {meta.label}
              </Badge>
              <Badge className={cn("h-5 rounded-[5px] px-2 text-[10px] font-medium", NEUTRAL_BADGE)}>
                {refund.status}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              RF-{refund.id} · {origin}
              {shop} · {t("refunds.createdAt", "สร้างเมื่อ {date}", { date: formatThaiDateTime(refund.requestedAt) })}
            </p>
          </div>
        </div>

        <Separator className="w-60! bg-muted" />

        <div className="flex flex-col gap-4 md:flex-row md:items-stretch">
          <div className="flex min-w-0 flex-1 flex-col gap-2 rounded-[10px] bg-secondary p-4">
            <span className="text-[11px] text-[#9aa5ad]">{t("refunds.detail.amount", "ยอดที่ต้องโอนคืน")}</span>
            <span className="text-[26px] leading-tight font-bold text-foreground">{formatBaht(refund.amount)}</span>
            <AmountRow label={t("refunds.detail.type", "ประเภท")} value={typeLabel} />
            {refund.escrowAmount !== null && (
              <AmountRow
                label={t("refunds.detail.escrow", "ยอดใน escrow ของ {so}", { so: refund.sellerOrderNumber ?? "SO" })}
                value={formatBaht(refund.escrowAmount)}
              />
            )}
            {refundedBefore !== null && (
              <AmountRow label={t("refunds.detail.refundedBefore", "คืนไปแล้วก่อนหน้า")} value={formatBaht(refundedBefore)} />
            )}
            <p className="text-[11px] text-muted-foreground">
              {settled
                ? `${t("refunds.detail.settled", "โอนคืนแล้ว")}${refund.processedAt ? t("refunds.detail.settledAt", "เมื่อ {date}", { date: formatThaiDateTime(refund.processedAt) }) : ""} · ${t("refunds.detail.reference", "เลขอ้างอิง {ref}", { ref: refund.transferReference ?? "—" })}`
                : `${t("refunds.detail.afterConfirm", "ยืนยันโอนแล้ว → ตัดยอดออกจาก escrow ของ SO นี้")}${remaining !== null ? ` ${t("refunds.detail.remaining", "คงเหลือ {amount}", { amount: formatBaht(remaining) })}` : ""}`}
            </p>
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-3 rounded-[10px] border border-border p-4">
            <div className="flex items-center gap-2">
              <CreditCard className="size-4 text-foreground" />
              <p className="text-xs font-semibold text-foreground">{t("refunds.account.title", "บัญชีรับเงินคืนที่ผู้ซื้อระบุ")}</p>
            </div>
            {refund.accountNumber ? (
              <>
                <InfoField label={t("refunds.account.bank", "ธนาคาร")} value={refund.bankName ?? "—"} />
                <InfoField label={t("refunds.account.name", "ชื่อบัญชี")} value={refund.accountName ?? "—"} />
                <InfoField label={t("refunds.account.number", "เลขบัญชี")} value={formatAccountNumber(refund.accountNumber)} large />
              </>
            ) : refund.method === "BANK_TRANSFER" ? (
              <p className="text-[13px] text-muted-foreground">
                {t("refunds.account.missing", "ผู้ซื้อยังไม่ได้ระบุบัญชี — รอผู้ซื้อกรอกที่หน้าคืนเงินของตัวเองก่อนจึงเริ่มโอนได้")}
              </p>
            ) : (
              <p className="text-[13px] text-muted-foreground">
                {t("refunds.account.automatic", "ไม่ต้องโอนเอง — {method} ระบบคืนให้อัตโนมัติ", { method: refundMethodLabel(refund.method) })}
              </p>
            )}
            {refund.failedAttempts > 0 && refund.status === "APPROVED" && (
              <Badge className="h-auto self-start rounded-full bg-[#fdf0dd] px-2 py-0.5 text-[11px] font-medium whitespace-normal text-[#b45309]">
                {t("refunds.account.failedAttempts", "โอนไม่สำเร็จ {count} ครั้ง — ตรวจว่าผู้ซื้อแก้บัญชีแล้วก่อนเริ่มโอนใหม่", { count: refund.failedAttempts })}
              </Badge>
            )}
          </div>
        </div>
      </Card>

      <RefundSteps refund={refund} onMoved={onMoved} />
      <RefundHistory refundId={refund.id} />
    </div>
  );
}

function StepHead({
  number,
  title,
  transition,
  state,
}: {
  number: number;
  title: string;
  transition: string;
  state: "active" | "done" | "waiting";
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
          state === "active" && "bg-[#0058bc] text-white",
          state === "done" && "bg-[#e3f4ec] text-[#12805c]",
          state === "waiting" && "bg-muted text-[#9aa5ad]",
        )}
      >
        {state === "done" ? <CheckCircle2 className="size-4" /> : number}
      </span>
      <p
        className={cn(
          "text-[13px] font-semibold",
          state === "waiting" ? "text-[#9aa5ad]" : "text-foreground",
        )}
      >
        {title}
      </p>
      <Badge
        className={cn(
          "h-5 rounded-[5px] px-2 text-[10px] font-medium",
          state === "active" ? "bg-[#e8f1fc] text-[#0058bc]" : NEUTRAL_BADGE,
        )}
      >
        {transition}
      </Badge>
    </div>
  );
}

function RefundSteps({
  refund,
  onMoved,
}: {
  refund: AdminRefund;
  onMoved: (status: RefundStatus) => void;
}) {
  const { t } = useTranslate("admin");
  const [accountNumber, setAccountNumber] = useState("");
  const [reference, setReference] = useState("");
  const [failOpen, setFailOpen] = useState(false);
  const start = useStartRefundTransfer();
  const complete = useCompleteRefundTransfer();
  const fail = useFailRefundTransfer();

  const canStart = refund.status === "APPROVED" && refund.method === "BANK_TRANSFER";
  const processing = refund.status === "PROCESSING";
  const settled = refund.status === "PROCESSED";
  const busy = start.isPending || complete.isPending || fail.isPending;

  const stepOne = canStart ? "active" : processing || settled ? "done" : "waiting";
  const stepTwo = processing ? "active" : settled ? "done" : "waiting";

  const startTransfer = () =>
    start.mutate(
      { id: refund.id, accountNumber: accountNumber.replace(/[\s-]/g, "") },
      {
        onSuccess: () => {
          toast.add({ type: "success", title: t("refunds.steps.locked", "ล็อกบัญชีแล้ว เริ่มโอนได้") });
          setAccountNumber("");
          onMoved("PROCESSING");
        },
        onError: (error) =>
          toast.add({
            type: "error",
            title: t("refunds.steps.startFailed", "เริ่มโอนไม่สำเร็จ"),
            description: financeErrorMessage(error, t("refunds.steps.checkAccount", "ตรวจเลขบัญชีแล้วลองใหม่")),
          }),
      },
    );

  const completeTransfer = () =>
    complete.mutate(
      { id: refund.id, transferReference: reference.trim() },
      {
        onSuccess: () => {
          toast.add({ type: "success", title: t("refunds.steps.recorded", "บันทึกการโอนคืนแล้ว") });
          onMoved("PROCESSED");
        },
        onError: (error) =>
          toast.add({
            type: "error",
            title: t("refunds.steps.recordFailed", "บันทึกไม่สำเร็จ"),
            description: financeErrorMessage(error, t("common.tryAgain", "ลองใหม่อีกครั้ง")),
          }),
      },
    );

  if (refund.method !== "BANK_TRANSFER") {
    return null;
  }

  return (
    <Card className="gap-5 rounded-xl border border-border p-5 shadow-none ring-0">
      <p className="text-sm font-semibold text-foreground">{t("refunds.steps.title", "ขั้นตอนการโอนคืน")}</p>

      <div className="flex flex-col gap-3">
        <StepHead number={1} title={t("refunds.steps.one", "ยืนยันเลขบัญชี แล้วเริ่มโอน")} transition="APPROVED → PROCESSING" state={stepOne} />
        <div className="flex flex-col gap-2 pl-10">
          <p className="text-xs text-muted-foreground">
            {t("refunds.steps.oneHint", "พิมพ์เลขบัญชีปลายทางให้ตรงกับที่ผู้ซื้อบันทึกไว้ ถ้าผู้ซื้อแก้เลขบัญชีระหว่างนี้ระบบจะไม่ให้เริ่มโอน")}
            (REFUND_DESTINATION_CHANGED)
          </p>
          {stepOne === "active" && (
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                aria-label={t("refunds.steps.accountInput", "เลขบัญชีปลายทาง")}
                inputMode="numeric"
                placeholder={t("refunds.steps.accountPlaceholder", "พิมพ์เลขบัญชีปลายทาง เช่น 1234567890")}
                value={accountNumber}
                onChange={(event) => setAccountNumber(event.target.value)}
                className="h-9 flex-1 rounded-md border-input bg-background"
              />
              <Button
                size="sm"
                className="h-9 rounded-md px-3"
                disabled={busy || !refund.accountNumber || !accountNumber.trim()}
                onClick={startTransfer}
              >
                {start.isPending && <Spinner data-icon="inline-start" />}
                {t("refunds.steps.start", "เริ่มโอน")}
              </Button>
            </div>
          )}
        </div>
      </div>

      <Separator className="bg-muted" />

      <div className="flex flex-col gap-3">
        <StepHead number={2} title={t("refunds.steps.two", "ยืนยันผลการโอน")} transition="PROCESSING → PROCESSED" state={stepTwo} />
        <div className="flex flex-col gap-2 pl-10">
          <p className="text-xs text-muted-foreground">
            {t("refunds.steps.twoHint", "หลังโอนในแอปธนาคารแล้ว กรอกเลขอ้างอิงเพื่อปิดรายการ (กดซ้ำด้วยเลขเดิมได้ไม่เกิดผลซ้ำ) หรือแจ้งว่าโอนไม่สำเร็จ รายการจะกลับเป็นพร้อมโอนให้ผู้ซื้อแก้บัญชี")}
          </p>
          {settled ? (
            <p className="text-[13px] font-medium text-[#12805c]">
              {t("refunds.steps.done", "โอนคืนแล้ว · เลขอ้างอิง {ref}", { ref: refund.transferReference ?? "—" })}
            </p>
          ) : (
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                aria-label={t("refunds.steps.referenceInput", "เลขอ้างอิงการโอน")}
                placeholder={t("refunds.steps.referencePlaceholder", "เลขอ้างอิงการโอน (transferReference)")}
                value={reference}
                disabled={!processing}
                maxLength={64}
                onChange={(event) => setReference(event.target.value)}
                className="h-9 flex-1 rounded-md border-input bg-background"
              />
              <Button
                variant="outline"
                size="sm"
                className="h-9 rounded-md px-3"
                disabled={!processing || busy}
                onClick={() => setFailOpen(true)}
              >
                {t("refunds.steps.failed", "โอนไม่สำเร็จ")}
              </Button>
              <Button
                size="sm"
                className="h-9 rounded-md px-3"
                disabled={!processing || busy || !reference.trim()}
                onClick={completeTransfer}
              >
                {complete.isPending && <Spinner data-icon="inline-start" />}
                {t("refunds.steps.confirm", "ยืนยันว่าโอนแล้ว")}
              </Button>
            </div>
          )}
        </div>
      </div>

      <FinanceReasonDialog
        open={failOpen}
        onOpenChange={setFailOpen}
        title={t("refunds.failDialog.title", "แจ้งว่าโอนคืนไม่สำเร็จ")}
        description={t("refunds.failDialog.description", "รายการจะกลับเป็น “พร้อมโอน” และผู้ซื้อจะต้องแก้บัญชีรับเงินคืนก่อนโอนใหม่")}
        placeholder={t("refunds.failDialog.placeholder", "เช่น บัญชีปลายทางถูกปิดแล้ว ธนาคารตีกลับ")}
        confirmLabel={t("refunds.failDialog.confirm", "บันทึกว่าโอนไม่สำเร็จ")}
        onConfirm={async (reason) => {
          await fail.mutateAsync({ id: refund.id, reason });
          toast.add({ type: "success", title: t("refunds.failDialog.done", "บันทึกว่าโอนไม่สำเร็จแล้ว") });
          onMoved("APPROVED");
        }}
        errorMessage={(error) => financeErrorMessage(error, t("refunds.steps.recordFailedRetry", "บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง"))}
      />
    </Card>
  );
}

const ATTEMPT_BADGE: Record<string, { label: string; className: string }> = {
  PROCESSING: { get label() { return translate("admin", "refunds.attempt.processing", "กำลังโอน"); }, className: "bg-[#e8f1fc] text-[#0058bc]" },
  PROCESSED: { get label() { return translate("admin", "refunds.attempt.processed", "สำเร็จ"); }, className: "bg-[#e3f4ec] text-[#12805c]" },
  FAILED: { get label() { return translate("admin", "refunds.attempt.failed", "ล้มเหลว"); }, className: "bg-[#fbe9e8] text-[#d0342c]" },
};

function RefundHistory({ refundId }: { refundId: number }) {
  const { t } = useTranslate("admin");
  const history = useRefundTransfers(refundId);
  const attempts = history.data ?? [];

  return (
    <Card className="gap-3 rounded-xl border border-border p-5 shadow-none ring-0">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-foreground">{t("refunds.history.title", "ประวัติการโอน")}</p>
        <span className="text-xs text-[#9aa5ad]">{t("refunds.history.count", "{count} ครั้ง", { count: attempts.length })}</span>
      </div>
      {history.isPending ? (
        <Skeleton className="h-14 w-full rounded-[10px]" />
      ) : history.isError ? (
        <p role="alert" className="text-xs text-destructive">
          {t("refunds.history.loadFailed", "โหลดประวัติไม่สำเร็จ")}{" "}
          <button type="button" className="underline" onClick={() => void history.refetch()}>
            {t("actions.retry", "ลองใหม่", { ns: "common" })}
          </button>
        </p>
      ) : attempts.length === 0 ? (
        <p className="text-xs text-muted-foreground">{t("refunds.history.empty", "ยังไม่เคยเริ่มโอน")}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {attempts.map((attempt, index) => {
            const badge = ATTEMPT_BADGE[attempt.status];
            return (
              <li
                key={attempt.id}
                className="flex items-center gap-3 rounded-[10px] border border-border px-4 py-3"
              >
                <span className="text-xs font-semibold text-muted-foreground">#{attempts.length - index}</span>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-[13px] text-foreground">
                    {formatThaiDateTime(attempt.startedAt)} · {attempt.bankName ?? "—"}{" "}
                    {attempt.accountNumber ? formatAccountNumber(attempt.accountNumber) : ""}
                  </span>
                  {(attempt.failureReason || attempt.transferReference) && (
                    <span className="text-[11px] text-muted-foreground">
                      {attempt.failureReason
                        ? t("refunds.history.reason", "เหตุผล: {reason}", { reason: attempt.failureReason })
                        : t("refunds.history.reference", "เลขอ้างอิง: {ref}", { ref: attempt.transferReference })}
                    </span>
                  )}
                </div>
                {badge && (
                  <Badge className={cn("h-5 rounded-full px-2 text-[11px] font-medium", badge.className)}>
                    {badge.label}
                  </Badge>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

// @tolgee-key {"key": "refunds.attempt.processing", "ns": "admin", "defaultValue": "กำลังโอน"}
// @tolgee-key {"key": "refunds.attempt.processed", "ns": "admin", "defaultValue": "สำเร็จ"}
// @tolgee-key {"key": "refunds.attempt.failed", "ns": "admin", "defaultValue": "ล้มเหลว"}
