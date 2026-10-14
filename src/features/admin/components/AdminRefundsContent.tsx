import { useState } from "react";
import { Inbox, Info } from "lucide-react";

import { EmptyState, QueryBoundary } from "@/components/common";
import { downloadCsv } from "@/lib/csv";

import {
  formatAgo,
  formatBahtShort,
  matchesSearch,
  NEUTRAL_BADGE,
  REFUND_STATUS_META,
  refundSourceLabel,
} from "../finance.format";
import { useRefundQueue, useRefundSummary } from "../finance.queries";
import type { AdminRefund, RefundStatus } from "../finance.types";
import {
  FinanceDetailPlaceholder,
  FinancePageHeader,
  FinanceQueueCard,
  FinanceQueueHeader,
  FinanceStatStrip,
  FinanceTabs,
  type FinanceBadge,
} from "./FinanceShared";
import { RefundDetail } from "./RefundDetail";
import { SellerQueueSkeleton } from "./SellerQueueSkeleton";

type RefundTab = Extract<RefundStatus, "APPROVED" | "PROCESSING" | "PROCESSED"> | "ALL";

const QUEUE_TITLE: Record<RefundTab, string> = {
  APPROVED: "คิวพร้อมโอน",
  PROCESSING: "กำลังโอน",
  PROCESSED: "โอนแล้ว",
  ALL: "ทั้งหมด",
};

/**
 * หน้า "คืนเงินผู้ซื้อ" — รายการคืนเงินที่ระบบสร้างจากการยกเลิกหรือคืนสินค้า
 * admin โอนเข้าบัญชีที่ผู้ซื้อระบุนอกระบบ แล้วกลับมายืนยันด้วยเลขอ้างอิง
 * อ้างจาก Figma node 1913:2813
 */
export function AdminRefundsContent() {
  const [tab, setTab] = useState<RefundTab>("APPROVED");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const queue = useRefundQueue(tab);
  const summary = useRefundSummary();
  const counts = summary.data;

  const refunds = (queue.data ?? []).filter((refund) =>
    matchesSearch(
      search,
      `RF-${refund.id}`,
      refund.orderNumber,
      refund.sellerOrderNumber,
      refund.buyer.username,
      refund.buyer.displayName,
    ),
  );
  const selected = refunds.find((refund) => refund.id === selectedId) ?? null;

  const changeTab = (next: RefundTab) => {
    setTab(next);
    setSelectedId(null);
  };

  const exportCsv = () =>
    downloadCsv(`refunds-${tab.toLowerCase()}.csv`, [
      ["refund_id", "status", "order_number", "seller_order", "buyer", "amount", "bank", "account", "reference", "requested_at"],
      ...refunds.map((r) => [
        r.id,
        r.status,
        r.orderNumber,
        r.sellerOrderNumber,
        r.buyer.username,
        r.amount,
        r.bankName,
        r.accountNumber,
        r.transferReference,
        r.requestedAt,
      ]),
    ]);

  const badgesFor = (refund: AdminRefund): FinanceBadge[] => {
    const source = refundSourceLabel(refund.resolution, refund.returnRequestId);
    const badges: FinanceBadge[] = [
      { label: source.label, className: source.badgeClass },
      { label: refund.orderNumber, className: NEUTRAL_BADGE },
    ];
    if (tab === "ALL") {
      const meta = REFUND_STATUS_META[refund.status];
      badges.push({ label: meta.label, className: meta.badgeClass });
    }
    if (refund.failedAttempts > 0 && refund.status !== "PROCESSED") {
      badges.push({
        label: `โอนพลาด ${refund.failedAttempts} ครั้ง`,
        className: "bg-[#fbe9e8] text-[#d0342c]",
      });
    }
    if (!refund.accountNumber && refund.status === "APPROVED" && refund.method === "BANK_TRANSFER") {
      badges.push({ label: "ยังไม่ระบุบัญชี", className: "bg-[#fdf0dd] text-[#b45309]" });
    }
    return badges;
  };

  const sourceText = (refund: AdminRefund) =>
    refund.returnRequestId !== null
      ? refund.resolution === "PARTIAL_REFUND"
        ? "คืนสินค้าบางส่วน"
        : "คืนสินค้าเต็มจำนวน"
      : "ยกเลิกคำสั่งซื้อ";

  return (
    <div className="flex flex-col gap-6">
      <FinancePageHeader
        title="คืนเงินผู้ซื้อ"
        description="รายการคืนเงินที่ระบบสร้างจากการยกเลิกคำสั่งซื้อและการคืนสินค้า · admin โอนคืนเข้าบัญชีที่ผู้ซื้อระบุ"
        onExport={exportCsv}
        exportDisabled={refunds.length === 0}
      />

      <div className="flex items-start gap-2.5 rounded-xl bg-[#e8f1fc] px-4 py-3 text-xs text-[#0058bc]">
        <Info className="mt-px size-4 shrink-0" />
        <p>
          ไม่มีปุ่มขอคืนเงินโดยตรง — ระบบสร้างรายการคืนเงินให้เองเมื่อ (1) คำสั่งซื้อที่ชำระแล้วถูกยกเลิก หรือ
          (2) ผู้ขายอนุมัติการคืนสินค้า · ผู้ซื้อต้องระบุบัญชีรับเงินก่อน admin จะเริ่มโอนได้
        </p>
      </div>

      <FinanceStatStrip
        isLoading={summary.isPending}
        isError={summary.isError}
        stats={[
          { label: "พร้อมโอน", value: String(counts?.ready ?? 0), dotClass: "bg-[#b45309]", emphasized: true },
          { label: "กำลังโอน", value: String(counts?.processing ?? 0), dotClass: "bg-[#12805c]" },
          {
            label: "โอนไม่สำเร็จ · รอผู้ซื้อแก้บัญชี",
            value: String(counts?.failedAwaitingBuyer ?? 0),
            dotClass: "bg-[#d0342c]",
          },
          {
            label: "โอนแล้วเดือนนี้",
            value: `${counts?.processedThisMonth ?? 0} · ${formatBahtShort(counts?.processedAmountThisMonth ?? 0)}`,
            dotClass: "bg-[#9aa5ad]",
          },
        ]}
      />

      <FinanceTabs<RefundTab>
        tabs={[
          { value: "APPROVED", label: `พร้อมโอน (${counts?.ready ?? 0})` },
          { value: "PROCESSING", label: `กำลังโอน (${counts?.processing ?? 0})` },
          { value: "PROCESSED", label: "โอนแล้ว" },
          { value: "ALL", label: "ทั้งหมด" },
        ]}
        active={tab}
        onChange={changeTab}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="ค้นหา RF / ORD / ชื่อผู้ซื้อ"
      />

      <div className="flex flex-col items-start gap-6 lg:flex-row">
        <div className="flex w-full flex-col gap-3 lg:w-[420px] lg:shrink-0">
          <QueryBoundary
            query={queue}
            loading={<SellerQueueSkeleton />}
            errorTitle="โหลดรายการคืนเงินไม่สำเร็จ"
            errorMessage="ตรวจสอบการเชื่อมต่อแล้วลองใหม่"
            isEmpty={() => refunds.length === 0}
            empty={
              <EmptyState
                icon={Inbox}
                title={search ? "ไม่พบรายการที่ค้นหา" : `ไม่มีรายการใน "${QUEUE_TITLE[tab]}"`}
                description={search ? "ลองค้นด้วยเลข RF, เลขคำสั่งซื้อ หรือชื่อผู้ซื้อ" : "รายการคืนเงินจะขึ้นที่นี่เมื่อระบบสร้างให้"}
              />
            }
          >
            {() => (
              <>
                <FinanceQueueHeader
                  title={`${QUEUE_TITLE[tab]} (${refunds.length})`}
                  sortLabel={tab === "ALL" ? "เรียงตาม: ใหม่สุด" : "เรียงตาม: เก่าสุด"}
                />
                <ul className="flex flex-col gap-3">
                  {refunds.map((refund) => (
                    <li key={refund.id}>
                      <FinanceQueueCard
                        party={refund.buyer}
                        title={refund.buyer.username}
                        subtitle={`RF-${refund.id} · ${sourceText(refund)} · ${formatAgo(refund.requestedAt)}`}
                        amount={formatBahtShort(refund.amount)}
                        badges={badgesFor(refund)}
                        active={refund.id === selected?.id}
                        onSelect={() => setSelectedId(refund.id)}
                      />
                    </li>
                  ))}
                </ul>
              </>
            )}
          </QueryBoundary>
        </div>

        {selected ? (
          <RefundDetail
            key={selected.id}
            refund={selected}
            onMoved={(status) => {
              // อยู่แท็บ "ทั้งหมด" รายการไม่หลุดอยู่แล้ว
              if (tab !== "ALL" && (status === "APPROVED" || status === "PROCESSING" || status === "PROCESSED")) {
                setTab(status);
              }
            }}
          />
        ) : (
          <FinanceDetailPlaceholder>เลือกรายการคืนเงินจากคิวทางซ้ายเพื่อดูบัญชีและโอนคืน</FinanceDetailPlaceholder>
        )}
      </div>
    </div>
  );
}
