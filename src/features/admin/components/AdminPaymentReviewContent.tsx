import { useMemo, useState } from "react";
import { Inbox } from "lucide-react";

import { EmptyState, QueryBoundary } from "@/components/common";
import { toast } from "@/components/ui/toast";
import { downloadCsv } from "@/lib/csv";

import {
  financeErrorMessage,
  formatAgo,
  formatBahtShort,
  isNearDeadline,
} from "../finance.format";
import { usePaymentQueue, usePaymentSummary, useVerifyPayment } from "../finance.queries";
import type { PaymentReview } from "../finance.types";
import {
  FinanceDetailPlaceholder,
  FinancePageHeader,
  FinanceQueueCard,
  FinanceQueueHeader,
  FinanceStatStrip,
  type FinanceBadge,
} from "./FinanceShared";
import { PaymentSlipDetail } from "./PaymentSlipDetail";
import { SellerQueueSkeleton } from "./SellerQueueSkeleton";
import { SlipModeCard } from "./SlipModeCard";

/**
 * หน้า "ตรวจสอบสลิปชำระเงิน" — คิว `AWAITING_VERIFICATION` เรียงใกล้หมดเวลาชำระก่อน
 * อนุมัติแล้วเงินเข้า escrow แยกตามร้าน ปฏิเสธแล้วผู้ซื้อต้องสร้างรายการชำระใหม่
 * อ้างจาก Figma node 1913:2482
 */
export function AdminPaymentReviewContent() {
  const queue = usePaymentQueue();
  const summary = usePaymentSummary();
  const verify = useVerifyPayment();
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const payments = useMemo(
    () =>
      [...(queue.data ?? [])].sort(
        (a, b) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime(),
      ),
    [queue.data],
  );
  // รายการที่เลือกหลุดจากคิว (คนอื่นตัดสินไปแล้ว) ก็ถือว่าไม่ได้เลือก
  const selected = payments.find((payment) => payment.id === selectedId) ?? null;
  const nextAfter = (id: number) => {
    const index = payments.findIndex((payment) => payment.id === id);
    return payments[index + 1] ?? payments.find((payment) => payment.id !== id) ?? null;
  };

  const decide = (payment: PaymentReview, approved: boolean, reason?: string) => {
    const next = nextAfter(payment.id);
    verify.mutate(
      { id: payment.id, approved, reason },
      {
        onSuccess: () => {
          toast.add({
            type: "success",
            title: approved ? "อนุมัติการชำระเงินแล้ว" : "ปฏิเสธสลิปแล้ว",
            description: approved
              ? `เงิน ${formatBahtShort(payment.amount)} ถูกพักใน escrow ของแต่ละร้านแล้ว`
              : "ผู้ซื้อต้องสร้างรายการชำระใหม่",
          });
          setSelectedId(next?.id ?? null);
        },
        onError: (error) =>
          toast.add({
            type: "error",
            title: approved ? "อนุมัติไม่สำเร็จ" : "ปฏิเสธไม่สำเร็จ",
            description: financeErrorMessage(error, "ลองใหม่อีกครั้ง"),
          }),
      },
    );
  };

  const exportCsv = () =>
    downloadCsv("payment-slips.csv", [
      ["payment_id", "order_number", "buyer", "amount", "reference", "created_at", "expires_at"],
      ...payments.map((p) => [
        p.id,
        p.orderNumber,
        p.buyer.username,
        p.amount,
        p.referenceCode,
        p.createdAt,
        p.expiresAt,
      ]),
    ]);

  const counts = summary.data;
  const badgesFor = (payment: PaymentReview): FinanceBadge[] => {
    const badges: FinanceBadge[] = [
      { label: payment.orderNumber, className: "bg-[#eef1f2] text-muted-foreground" },
    ];
    if (payment.splits.length > 1) {
      badges.push({
        label: `${payment.splits.length} ร้านค้า`,
        className: "bg-[#eef1f2] text-muted-foreground",
      });
    }
    if (payment.id === selected?.id) {
      badges.push({ label: "กำลังดู", className: "rounded-full bg-[#e8f1fc] text-[11px] text-[#0058bc]" });
    } else if (isNearDeadline(payment.expiresAt)) {
      badges.push({
        label: "ใกล้หมดเวลาชำระ",
        className: "rounded-full bg-[#fdf0dd] text-[11px] text-[#b45309]",
      });
    }
    return badges;
  };

  return (
    <div className="flex flex-col gap-6">
      <FinancePageHeader
        title="ตรวจสอบสลิปชำระเงิน"
        description="ตรวจสลิปโอนเงินของผู้ซื้อก่อนยืนยันคำสั่งซื้อ · อนุมัติแล้วเงินจะถูกพักไว้ใน escrow แยกตามร้านค้า"
        onExport={exportCsv}
        exportDisabled={payments.length === 0}
      />

      <SlipModeCard queueCount={counts?.awaitingVerification ?? payments.length} />

      <FinanceStatStrip
        isLoading={summary.isPending}
        isError={summary.isError}
        stats={[
          {
            label: "รอตรวจสลิป",
            value: String(counts?.awaitingVerification ?? 0),
            dotClass: "bg-[#b45309]",
            emphasized: true,
          },
          { label: "อนุมัติวันนี้", value: String(counts?.approvedToday ?? 0), dotClass: "bg-[#12805c]" },
          { label: "ปฏิเสธวันนี้", value: String(counts?.rejectedToday ?? 0), dotClass: "bg-[#d0342c]" },
          { label: "รอผู้ซื้อโอน", value: String(counts?.awaitingTransfer ?? 0), dotClass: "bg-[#9aa5ad]" },
        ]}
      />

      <div className="flex flex-col items-start gap-6 lg:flex-row">
        <div className="flex w-full flex-col gap-3 lg:w-[420px] lg:shrink-0">
          <QueryBoundary
            query={queue}
            loading={<SellerQueueSkeleton />}
            errorTitle="โหลดคิวสลิปไม่สำเร็จ"
            errorMessage="ตรวจสอบการเชื่อมต่อแล้วลองใหม่"
            isEmpty={(data) => data.length === 0}
            empty={
              <EmptyState
                icon={Inbox}
                title="ไม่มีสลิปรอตรวจ"
                description="เมื่อผู้ซื้อแนบสลิป รายการจะขึ้นที่นี่โดยเรียงใกล้หมดเวลาชำระก่อน"
              />
            }
          >
            {() => (
              <>
                <FinanceQueueHeader
                  title={`คิวรอตรวจสลิป (${payments.length})`}
                  sortLabel="เรียงตาม: ใกล้หมดเวลา"
                />
                <ul className="flex flex-col gap-3">
                  {payments.map((payment) => (
                    <li key={payment.id}>
                      <FinanceQueueCard
                        party={payment.buyer}
                        title={payment.buyer.username}
                        subtitle={`PAY-${payment.id} · สร้างรายการ ${formatAgo(payment.createdAt)}`}
                        amount={formatBahtShort(payment.amount)}
                        badges={badgesFor(payment)}
                        active={payment.id === selected?.id}
                        onSelect={() => setSelectedId(payment.id)}
                      />
                    </li>
                  ))}
                </ul>
              </>
            )}
          </QueryBoundary>
        </div>

        {selected ? (
          <PaymentSlipDetail
            key={selected.id}
            payment={selected}
            busy={
              verify.isPending && verify.variables?.id === selected.id
                ? verify.variables.approved
                  ? "approve"
                  : "reject"
                : null
            }
            onApprove={() => decide(selected, true)}
            onReject={(reason) => decide(selected, false, reason)}
            onSkip={payments.length > 1 ? () => setSelectedId(nextAfter(selected.id)?.id ?? null) : null}
          />
        ) : (
          <FinanceDetailPlaceholder>เลือกสลิปจากคิวทางซ้ายเพื่อตรวจและตัดสิน</FinanceDetailPlaceholder>
        )}
      </div>
    </div>
  );
}
