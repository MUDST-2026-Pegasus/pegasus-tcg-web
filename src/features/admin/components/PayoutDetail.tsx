import { useState, type ReactNode } from "react";
import { Check, CreditCard, XCircle } from "lucide-react";

import { FileUpload } from "@/components/common";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { useFileUpload } from "@/hooks/use-file-upload";
import { cn } from "@/lib/utils";

import {
  financeErrorMessage,
  formatAccountNumber,
  formatBaht,
  formatThaiDateTime,
  formatThaiShortDateTime,
  NEUTRAL_BADGE,
  PAYOUT_STATUS_META,
} from "../finance.format";
import { usePayoutAction, type PayoutAction } from "../finance.queries";
import type { AdminPayout, PayoutStatus } from "../finance.types";
import { AmountRow, InfoField, PartyAvatar } from "./FinanceShared";
import { FinanceReasonDialog } from "./FinanceReasonDialog";
import { useTranslate, translate } from "@/lib/i18n";

type PayoutDetailProps = {
  payout: AdminPayout;
  /** รายการเปลี่ยนสถานะแล้ว — ให้หน้าหลักสลับแท็บตามไปถ้ารายการหลุดจากแท็บปัจจุบัน */
  onMoved: (status: PayoutStatus) => void;
};

/**
 * คอลัมน์ขวาของหน้าถอนเงินผู้ขาย — timeline สี่ขั้น, ยอดเทียบ wallet, บัญชีที่ยืนยันแล้ว,
 * คำสั่งซื้อที่ผูกกับการถอน และปุ่มตามสถานะ
 *
 * เงินถูก "จอง" ตั้งแต่ตอนขอถอน แต่ตัดจาก ledger (PAYOUT_OUT) ตอนยืนยันว่าจ่ายแล้วเท่านั้น
 * ผู้เรียกใส่ `key={payout.id}` ให้ฟอร์มยืนยันการจ่ายล้างเองเมื่อเปลี่ยนรายการ
 */
export function PayoutDetail({ payout, onMoved }: PayoutDetailProps) {
  const { t } = useTranslate("admin");
  const meta = PAYOUT_STATUS_META[payout.status];
  const open = ["REQUESTED", "APPROVED", "PROCESSING"].includes(payout.status);
  const canWithdrawMore = payout.wallet.available - payout.wallet.reserved;
  const ordersTotal = payout.orders.reduce((sum, order) => sum + order.sellerNetAmount, 0);

  return (
    <div className="flex w-full min-w-0 flex-1 flex-col gap-4">
      <Card className="gap-5 rounded-xl border border-border p-5 shadow-none ring-0">
        <div className="flex items-center gap-3.5">
          <PartyAvatar party={payout.seller} className="size-[52px]" />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-foreground">{payout.seller.username}</h2>
              <Badge className={cn("h-5 rounded-full px-2 text-[11px] font-medium", meta.badgeClass)}>
                {meta.label}
              </Badge>
              <Badge className={cn("h-5 rounded-[5px] px-2 text-[10px] font-medium", NEUTRAL_BADGE)}>
                {payout.status}
              </Badge>
              {payout.account?.verifiedAt && (
                <Badge className="h-5 rounded-[5px] bg-[#e3f4ec] px-2 text-[10px] font-medium text-[#12805c]">
                  {t("payouts.detail.verified", "ยืนยันตัวตนแล้ว")}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("payouts.detail.meta", "PO-{id} · ร้าน {shop} · ขอถอนเมื่อ {date}", { id: payout.id, shop: payout.seller.displayName, date: formatThaiDateTime(payout.requestedAt) })}
            </p>
          </div>
        </div>

        <PayoutTimeline payout={payout} />

        <div className="flex flex-col gap-4 md:flex-row md:items-stretch">
          <div className="flex min-w-0 flex-1 flex-col gap-2 rounded-[10px] bg-secondary p-4">
            <span className="text-[11px] text-[#9aa5ad]">{t("payouts.detail.amount", "ยอดที่ต้องโอนให้ผู้ขาย")}</span>
            <span className="text-[26px] leading-tight font-bold text-foreground">{formatBaht(payout.amount)}</span>
            <AmountRow label={t("payouts.detail.available", "ยอด available ใน wallet")} value={formatBaht(payout.wallet.available)} />
            {open && (
              <>
                <AmountRow label={t("payouts.detail.reserved", "จองไว้ (รวมคำขอนี้)")} value={`− ${formatBaht(payout.wallet.reserved)}`} />
                <AmountRow label={t("payouts.detail.canWithdraw", "ผู้ขายถอนเพิ่มได้อีก")} value={formatBaht(canWithdrawMore)} strong />
              </>
            )}
            <p className="text-[11px] text-muted-foreground">
              {payout.status === "PAID"
                ? t("payouts.detail.ledgerDone", "ตัดเงินจาก ledger แล้ว (PAYOUT_OUT) · เลขอ้างอิง {ref}", { ref: payout.transferReference ?? "—" })
                : open
                  ? t("payouts.detail.ledgerPending", "ยังไม่ตัดเงินจาก ledger — ตัดจริง (PAYOUT_OUT) ตอนกดยืนยันว่าจ่ายแล้วเท่านั้น")
                  : t("payouts.detail.closed", "ปิดรายการแล้ว ยอดที่จองไว้คืนกลับให้ผู้ขายถอนใหม่ได้")}
            </p>
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-3 rounded-[10px] border border-border p-4">
            <div className="flex items-center gap-2">
              <CreditCard className="size-4 text-foreground" />
              <p className="text-xs font-semibold text-foreground">{t("payouts.account.title", "บัญชีรับเงินของผู้ขาย")}</p>
            </div>
            {payout.account ? (
              <>
                <InfoField label={t("refunds.account.bank", "ธนาคาร")} value={payout.account.bankName ?? "—"} />
                <InfoField label={t("refunds.account.name", "ชื่อบัญชี")} value={payout.account.accountName ?? "—"} />
                <InfoField label={t("refunds.account.number", "เลขบัญชี")} value={formatAccountNumber(payout.account.accountNumber)} large />
                {payout.account.verifiedAt && (
                  <Badge className="h-5 self-start rounded-full bg-[#e3f4ec] px-2 text-[10px] font-medium text-[#12805c]">
                    {t("payouts.account.verified", "ยืนยันบัญชีแล้ว · สร้างตอนอนุมัติ KYC")}
                  </Badge>
                )}
              </>
            ) : (
              <p className="text-[13px] text-muted-foreground">{t("payouts.account.missing", "ไม่พบบัญชีรับเงินของคำขอนี้")}</p>
            )}
          </div>
        </div>

        {payout.orders.length > 0 && (
          <div className="flex flex-col gap-2 rounded-[10px] border border-border p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-semibold text-foreground">
                {payout.ordersLinked ? t("payouts.orders.linked", "คำสั่งซื้อที่ผูกกับการถอนนี้") : t("payouts.orders.toLink", "คำสั่งซื้อที่จะผูกกับการถอนนี้")}
              </p>
              <span className="text-[11px] text-[#9aa5ad]">{t("payouts.orders.hint", "COMPLETED · เก่าไปใหม่จนครบยอด")}</span>
            </div>
            {payout.orders.map((order) => (
              <div key={order.sellerOrderId} className="flex items-center gap-2 text-[13px]">
                <span className="font-medium text-foreground">{order.sellerOrderNumber}</span>
                {order.completedAt && (
                  <span className="text-[11px] text-[#9aa5ad]">
                    {t("payouts.orders.completedAt", "จบเมื่อ {date}", { date: formatThaiShortDateTime(order.completedAt) })}
                  </span>
                )}
                <span className="ml-auto font-medium text-foreground">{formatBaht(order.sellerNetAmount)}</span>
              </div>
            ))}
            <div className="flex items-center justify-between gap-2 border-t border-border pt-2 text-[13px] text-foreground">
              <span className="font-semibold">{t("payouts.orders.total", "รวม (หลังหักค่าคอมมิชชั่น)")}</span>
              <span className="font-bold">{formatBaht(ordersTotal)}</span>
            </div>
          </div>
        )}
      </Card>

      <PayoutActions payout={payout} onMoved={onMoved} />
    </div>
  );
}

const STEPS = [
  { key: "REQUESTED", get label() { return translate("admin", "payouts.steps.requested", "ขอถอน"); } },
  { key: "APPROVED", get label() { return translate("admin", "payouts.steps.approved", "อนุมัติ"); } },
  { key: "PROCESSING", get label() { return translate("admin", "payouts.steps.processing", "กำลังโอน"); } },
  { key: "PAID", get label() { return translate("admin", "payouts.steps.paid", "จ่ายแล้ว"); } },
] as const;

/** ลำดับขั้นที่ถึงแล้ว — REJECTED จบที่ขั้นแรก, FAILED จบที่ขั้นกำลังโอน */
function reachedStep(status: PayoutStatus): number {
  switch (status) {
    case "REQUESTED":
    case "REJECTED":
      return 0;
    case "APPROVED":
      return 1;
    case "PROCESSING":
    case "FAILED":
      return 2;
    case "PAID":
      return 3;
  }
}

function PayoutTimeline({ payout }: { payout: AdminPayout }) {
  const { t } = useTranslate("admin");
  const reached = reachedStep(payout.status);
  const stopped = payout.status === "REJECTED" || payout.status === "FAILED";
  const captions = [
    formatThaiShortDateTime(payout.requestedAt),
    payout.approvedAt
      ? `${formatThaiShortDateTime(payout.approvedAt)}${payout.approvedBy ? ` · ${payout.approvedBy}` : ""}`
      : "",
    reached >= 2 ? (payout.status === "FAILED" ? t("payouts.transferFailed", "โอนไม่สำเร็จ") : "") : "",
    payout.paidAt ? formatThaiShortDateTime(payout.paidAt) : t("payouts.steps.awaiting", "รอยืนยัน"),
  ];

  return (
    <div className="flex flex-col gap-3">
      <ol className="grid grid-cols-4">
        {STEPS.map((step, index) => {
          const done = index < reached || (index === reached && payout.status === "PAID");
          const current = index === reached && !done;
          const failed = current && stopped;
          return (
            <li key={step.key} className="flex flex-col gap-1.5">
              <div className="flex items-center">
                <span
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold",
                    done && "bg-[#e3f4ec] text-[#12805c]",
                    current && !failed && "bg-[#0058bc] text-white",
                    failed && "bg-[#fbe9e8] text-[#d0342c]",
                    !done && !current && "bg-muted text-[#9aa5ad]",
                  )}
                >
                  {done ? <Check className="size-3" /> : failed ? <XCircle className="size-3" /> : index + 1}
                </span>
                {index < STEPS.length - 1 && (
                  <span className={cn("h-0.5 flex-1", index < reached ? "bg-[#12805c]" : "bg-border")} />
                )}
              </div>
              <span
                className={cn(
                  "text-xs font-semibold",
                  done || current ? "text-foreground" : "text-[#9aa5ad]",
                )}
              >
                {failed ? (payout.status === "REJECTED" ? t("payouts.steps.rejected", "ปฏิเสธ") : t("payouts.transferFailed", "โอนไม่สำเร็จ")) : step.label}
              </span>
              <span className="truncate pr-2 text-[11px] text-[#9aa5ad]">
                {index <= reached ? captions[index] : index === 3 ? t("payouts.steps.awaiting", "รอยืนยัน") : ""}
              </span>
            </li>
          );
        })}
      </ol>
      {stopped && payout.rejectionReason && (
        <p className="rounded-[10px] bg-[#fbe9e8] px-3 py-2 text-xs text-[#d0342c]">
          {t("refunds.history.reason", "เหตุผล: {reason}", { reason: payout.rejectionReason })}
        </p>
      )}
    </div>
  );
}

const MOVED_TO: Record<PayoutAction["kind"], PayoutStatus> = {
  approve: "APPROVED",
  start: "PROCESSING",
  paid: "PAID",
  reject: "REJECTED",
  fail: "FAILED",
};

const SUCCESS_TITLE: Record<PayoutAction["kind"], string> = {
  get approve() {
    return translate("admin", "payouts.done.approve", "อนุมัติคำขอถอนแล้ว");
  },
  get start() {
    return translate("admin", "payouts.done.start", "เริ่มดำเนินการโอนแล้ว");
  },
  get paid() {
    return translate("admin", "payouts.done.paid", "บันทึกการจ่ายเงินแล้ว");
  },
  get reject() {
    return translate("admin", "payouts.done.reject", "ปฏิเสธคำขอถอนแล้ว");
  },
  get fail() {
    return translate("admin", "payouts.done.fail", "บันทึกว่าโอนไม่สำเร็จแล้ว");
  },
};

function PayoutActions({ payout, onMoved }: PayoutDetailProps) {
  const { t } = useTranslate("admin");
  const action = usePayoutAction();
  const slip = useFileUpload({ purpose: "PAYOUT_SLIP" });
  const [reference, setReference] = useState("");
  const [reasonFor, setReasonFor] = useState<"reject" | "fail" | null>(null);
  const busyKind = action.isPending ? action.variables?.kind : undefined;

  const run = (next: PayoutAction) =>
    action.mutateAsync(next).then(() => {
      toast.add({ type: "success", title: SUCCESS_TITLE[next.kind] });
      onMoved(MOVED_TO[next.kind]);
    });

  const runWithToast = (next: PayoutAction) =>
    run(next).catch((error: unknown) =>
      toast.add({
        type: "error",
        title: t("payouts.actionFailed", "ดำเนินการไม่สำเร็จ"),
        description: financeErrorMessage(error, t("common.tryAgain", "ลองใหม่อีกครั้ง")),
      }),
    );

  const slipKey = slip.objectKeys[0];

  let body;
  switch (payout.status) {
    case "REQUESTED":
      body = (
        <ActionRow
          title={t("payouts.review.title", "ตรวจคำขอถอน")}
          description={t("payouts.review.description", "ตรวจยอดเทียบ wallet และบัญชีที่ยืนยันแล้วก่อนอนุมัติ · ปฏิเสธแล้วยอดที่จองไว้กลับให้ผู้ขายทันที")}
        >
          <Button
            variant="outline"
            size="sm"
            className="rounded-md px-2.5"
            disabled={action.isPending}
            onClick={() => setReasonFor("reject")}
          >
            {t("payouts.steps.rejected", "ปฏิเสธ")}
          </Button>
          <Button
            size="sm"
            className="rounded-md px-2.5"
            disabled={action.isPending}
            onClick={() => void runWithToast({ kind: "approve", id: payout.id })}
          >
            {busyKind === "approve" && <Spinner data-icon="inline-start" />}
            {t("payouts.review.approve", "อนุมัติ")}
          </Button>
        </ActionRow>
      );
      break;
    case "APPROVED":
      body = (
        <ActionRow
          title={t("payouts.start.title", "เริ่มโอนเงิน")}
          description={t("payouts.start.description", "กดเมื่อกำลังจะโอนในแอปธนาคาร — สถานะจะเป็น “กำลังโอน” ให้แอดมินคนอื่นเห็นว่ามีคนรับไปแล้ว")}
        >
          <Button
            size="sm"
            className="rounded-md px-2.5"
            disabled={action.isPending}
            onClick={() => void runWithToast({ kind: "start", id: payout.id })}
          >
            {busyKind === "start" && <Spinner data-icon="inline-start" />}
            {t("refunds.steps.start", "เริ่มโอน")}
          </Button>
        </ActionRow>
      );
      break;
    case "PROCESSING":
      body = (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-[3px]">
            <p className="text-sm font-semibold text-foreground">{t("payouts.paid.title", "ยืนยันการจ่ายเงิน")}</p>
            <p className="text-xs text-muted-foreground">
              {t("payouts.paid.description", "โอนเงินในแอปธนาคารแล้วกรอกเลขอ้างอิงพร้อมแนบสลิป (จำเป็นทั้งคู่) · ถ้าโอนไม่สำเร็จต้องระบุเหตุผล ยอดที่จองไว้จะกลับมาให้ผู้ขายถอนได้ทันที")}
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="payout-reference">{t("refunds.steps.referenceInput", "เลขอ้างอิงการโอน")}</FieldLabel>
              <Input
                id="payout-reference"
                placeholder={t("payouts.paid.referencePlaceholder", "เช่น 20261014KBANK0012345")}
                maxLength={64}
                value={reference}
                onChange={(event) => setReference(event.target.value)}
                className="h-9 rounded-md bg-background"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="payout-slip">{t("payouts.paid.slip", "สลิปการโอน (PAYOUT_SLIP)")}</FieldLabel>
              <FileUpload id="payout-slip" upload={slip} disabled={action.isPending} />
            </Field>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              variant="destructive"
              size="sm"
              className="rounded-md bg-destructive px-2.5 text-white hover:bg-destructive/90"
              disabled={action.isPending}
              onClick={() => setReasonFor("fail")}
            >
              {t("payouts.transferFailed", "โอนไม่สำเร็จ")}
            </Button>
            <Button
              size="sm"
              className="rounded-md px-2.5"
              disabled={action.isPending || slip.isUploading || !reference.trim() || !slipKey}
              onClick={() =>
                slipKey &&
                void runWithToast({
                  kind: "paid",
                  id: payout.id,
                  transferReference: reference.trim(),
                  slipImageKey: slipKey,
                })
              }
            >
              {busyKind === "paid" && <Spinner data-icon="inline-start" />}
              {t("payouts.paid.confirm", "ยืนยันว่าจ่ายแล้ว")}
            </Button>
          </div>
        </div>
      );
      break;
    case "PAID":
      body = (
        <p className="flex items-center gap-2 text-[13px] font-medium text-[#12805c]">
          <Check className="size-4" />
          {t("payouts.paid.done", "จ่ายแล้ว")}{payout.paidAt ? ` ${t("refunds.detail.settledAt", "เมื่อ {date}", { date: formatThaiDateTime(payout.paidAt) })}` : ""} · {t("refunds.detail.reference", "เลขอ้างอิง {ref}", { ref: payout.transferReference ?? "—" })}
        </p>
      );
      break;
    case "REJECTED":
    case "FAILED":
      body = (
        <p className="text-[13px] font-medium text-[#d0342c]">
          {payout.status === "REJECTED" ? t("payouts.closed.rejected", "ปฏิเสธคำขอแล้ว — ยอดที่จองไว้กลับให้ผู้ขายถอนใหม่ได้") : t("payouts.closed.failed", "โอนไม่สำเร็จ — ยอดที่จองไว้กลับให้ผู้ขายถอนใหม่ได้")}
        </p>
      );
      break;
  }

  return (
    <Card className="gap-3 rounded-xl border border-border px-5 py-[18px] shadow-none ring-0">
      {body}
      <FinanceReasonDialog
        open={reasonFor !== null}
        onOpenChange={(open) => !open && setReasonFor(null)}
        title={reasonFor === "fail" ? t("payouts.reason.failTitle", "แจ้งว่าโอนไม่สำเร็จ") : t("payouts.reason.rejectTitle", "ปฏิเสธคำขอถอนเงิน")}
        description={t("payouts.reason.description", "ผู้ขายจะเห็นเหตุผลนี้ และยอดที่จองไว้จะกลับมาให้ถอนใหม่ได้ · กรณีนี้ไม่ลง ledger")}
        placeholder={
          reasonFor === "fail" ? t("payouts.reason.failPlaceholder", "เช่น บัญชีปลายทางถูกระงับ ธนาคารตีกลับ") : t("payouts.reason.rejectPlaceholder", "เช่น บัญชีอยู่ระหว่างตรวจสอบ")
        }
        confirmLabel={reasonFor === "fail" ? t("refunds.failDialog.confirm", "บันทึกว่าโอนไม่สำเร็จ") : t("payouts.reason.rejectConfirm", "ยืนยันการปฏิเสธ")}
        onConfirm={(reason) => run({ kind: reasonFor ?? "reject", id: payout.id, reason })}
        errorMessage={(error) => financeErrorMessage(error, t("refunds.steps.recordFailedRetry", "บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง"))}
      />
    </Card>
  );
}

function ActionRow({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="flex shrink-0 gap-2">{children}</div>
    </div>
  );
}

// @tolgee-key {"key": "payouts.steps.requested", "ns": "admin", "defaultValue": "ขอถอน"}
// @tolgee-key {"key": "payouts.steps.approved", "ns": "admin", "defaultValue": "อนุมัติ"}
// @tolgee-key {"key": "payouts.steps.processing", "ns": "admin", "defaultValue": "กำลังโอน"}
// @tolgee-key {"key": "payouts.steps.paid", "ns": "admin", "defaultValue": "จ่ายแล้ว"}
// @tolgee-key {"key": "payouts.done.approve", "ns": "admin", "defaultValue": "อนุมัติคำขอถอนแล้ว"}
// @tolgee-key {"key": "payouts.done.start", "ns": "admin", "defaultValue": "เริ่มดำเนินการโอนแล้ว"}
// @tolgee-key {"key": "payouts.done.paid", "ns": "admin", "defaultValue": "บันทึกการจ่ายเงินแล้ว"}
// @tolgee-key {"key": "payouts.done.reject", "ns": "admin", "defaultValue": "ปฏิเสธคำขอถอนแล้ว"}
// @tolgee-key {"key": "payouts.done.fail", "ns": "admin", "defaultValue": "บันทึกว่าโอนไม่สำเร็จแล้ว"}
