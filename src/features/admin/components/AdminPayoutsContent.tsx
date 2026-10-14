import { useState } from "react";
import { Inbox } from "lucide-react";

import { EmptyState, QueryBoundary } from "@/components/common";
import { downloadCsv } from "@/lib/csv";

import {
  formatAgo,
  formatBahtShort,
  matchesSearch,
  PAYOUT_STATUS_META,
} from "../finance.format";
import { usePayoutQueue, usePayoutSummary } from "../finance.queries";
import type { AdminPayout, PayoutStatus } from "../finance.types";
import {
  FinanceDetailPlaceholder,
  FinancePageHeader,
  FinanceQueueCard,
  FinanceQueueHeader,
  FinanceStatStrip,
  FinanceTabs,
} from "./FinanceShared";
import { PayoutDetail } from "./PayoutDetail";
import { SellerQueueSkeleton } from "./SellerQueueSkeleton";

type PayoutTab = "OPEN" | "REQUESTED" | "APPROVED" | "PROCESSING" | "PAID" | "CLOSED";

const TAB_STATUSES: Record<PayoutTab, PayoutStatus[]> = {
  OPEN: ["REQUESTED", "APPROVED", "PROCESSING"],
  REQUESTED: ["REQUESTED"],
  APPROVED: ["APPROVED"],
  PROCESSING: ["PROCESSING"],
  PAID: ["PAID"],
  CLOSED: ["REJECTED", "FAILED"],
};

const TAB_LABEL: Record<PayoutTab, string> = {
  OPEN: "รอดำเนินการ",
  REQUESTED: "คำขอใหม่",
  APPROVED: "อนุมัติแล้ว",
  PROCESSING: "กำลังโอน",
  PAID: "จ่ายแล้ว",
  CLOSED: "ปฏิเสธ / ล้มเหลว",
};

/** แท็บที่โชว์ตัวเลขข้างชื่อ — แท็บปิดแล้วไม่ต้องนับ */
const COUNTED_TABS = new Set<PayoutTab>(["OPEN", "REQUESTED", "APPROVED", "PROCESSING"]);

/**
 * หน้า "ถอนเงินผู้ขาย" — อนุมัติแล้วโอนให้ผู้ขาย ยอดถูกจองตั้งแต่ตอนขอถอน
 * และตัดจาก wallet จริงเมื่อยืนยันว่าโอนแล้วเท่านั้น
 *
 * ดึงทุกสถานะครั้งเดียวแล้วกรองแท็บฝั่งหน้า — สลับแท็บไม่ต้องรอโหลด และตัวเลขบนแท็บมาจากชุดเดียวกัน
 * อ้างจาก Figma node 1913:3144
 */
export function AdminPayoutsContent() {
  const [tab, setTab] = useState<PayoutTab>("OPEN");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const queue = usePayoutQueue();
  const summary = usePayoutSummary();
  const counts = summary.data;
  const all = queue.data ?? [];

  const inTab = (payout: AdminPayout, target: PayoutTab) => TAB_STATUSES[target].includes(payout.status);
  // ปิดแล้วดูใหม่สุดก่อน ยังเปิดอยู่ทำเก่าสุดก่อน (backend ส่งมาเก่าสุดก่อน)
  const ordered = tab === "PAID" || tab === "CLOSED" ? [...all].reverse() : all;
  const payouts = ordered.filter(
    (payout) =>
      inTab(payout, tab) &&
      matchesSearch(search, `PO-${payout.id}`, payout.seller.username, payout.seller.displayName),
  );
  const selected = payouts.find((payout) => payout.id === selectedId) ?? null;

  const changeTab = (next: PayoutTab) => {
    setTab(next);
    setSelectedId(null);
  };

  const exportCsv = () =>
    downloadCsv(`payouts-${tab.toLowerCase()}.csv`, [
      ["payout_id", "status", "seller", "amount", "bank", "account", "reference", "requested_at", "paid_at"],
      ...payouts.map((p) => [
        p.id,
        p.status,
        p.seller.username,
        p.amount,
        p.account?.bankName ?? null,
        p.account?.accountNumber ?? null,
        p.transferReference,
        p.requestedAt,
        p.paidAt,
      ]),
    ]);

  return (
    <div className="flex flex-col gap-6">
      <FinancePageHeader
        title="ถอนเงินผู้ขาย"
        description="อนุมัติและโอนเงินให้ผู้ขาย · ยอดถูกจองตั้งแต่ตอนขอถอน และตัดจาก wallet จริงเมื่อยืนยันว่าโอนแล้วเท่านั้น"
        onExport={exportCsv}
        exportDisabled={payouts.length === 0}
      />

      <FinanceStatStrip
        isLoading={summary.isPending}
        isError={summary.isError}
        stats={[
          {
            label: "คำขอใหม่ (REQUESTED)",
            value: String(counts?.requested ?? 0),
            dotClass: "bg-[#b45309]",
            emphasized: true,
          },
          {
            label: "จ่ายแล้วเดือนนี้",
            value: formatBahtShort(counts?.paidAmountThisMonth ?? 0),
            dotClass: "bg-[#12805c]",
          },
          {
            label: "ปฏิเสธ / โอนไม่สำเร็จเดือนนี้",
            value: String(counts?.closedThisMonth ?? 0),
            dotClass: "bg-[#d0342c]",
          },
          { label: "อนุมัติแล้ว + กำลังโอน", value: String(counts?.inProgress ?? 0), dotClass: "bg-[#9aa5ad]" },
        ]}
      />

      <FinanceTabs<PayoutTab>
        tabs={(Object.keys(TAB_LABEL) as PayoutTab[]).map((value) => ({
          value,
          label: COUNTED_TABS.has(value)
            ? `${TAB_LABEL[value]} (${all.filter((payout) => inTab(payout, value)).length})`
            : TAB_LABEL[value],
        }))}
        active={tab}
        onChange={changeTab}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="ค้นหา PO / ชื่อร้าน"
      />

      <div className="flex flex-col items-start gap-6 lg:flex-row">
        <div className="flex w-full flex-col gap-3 lg:w-[420px] lg:shrink-0">
          <QueryBoundary
            query={queue}
            loading={<SellerQueueSkeleton />}
            errorTitle="โหลดคำขอถอนเงินไม่สำเร็จ"
            errorMessage="ตรวจสอบการเชื่อมต่อแล้วลองใหม่"
            isEmpty={() => payouts.length === 0}
            empty={
              <EmptyState
                icon={Inbox}
                title={search ? "ไม่พบรายการที่ค้นหา" : `ไม่มีรายการใน "${TAB_LABEL[tab]}"`}
                description={search ? "ลองค้นด้วยเลข PO หรือชื่อร้าน" : "คำขอถอนเงินของผู้ขายจะขึ้นที่นี่"}
              />
            }
          >
            {() => (
              <>
                <FinanceQueueHeader
                  title={`${TAB_LABEL[tab]} (${payouts.length})`}
                  sortLabel={tab === "PAID" || tab === "CLOSED" ? "เรียงตาม: ใหม่สุด" : "เรียงตาม: เก่าสุด"}
                />
                <ul className="flex flex-col gap-3">
                  {payouts.map((payout) => {
                    const meta = PAYOUT_STATUS_META[payout.status];
                    return (
                      <li key={payout.id}>
                        <FinanceQueueCard
                          party={payout.seller}
                          title={payout.seller.username}
                          subtitle={`PO-${payout.id} · ขอถอนเมื่อ ${formatAgo(payout.requestedAt)}`}
                          amount={formatBahtShort(payout.amount)}
                          badges={[{ label: meta.label, className: `rounded-full text-[11px] ${meta.badgeClass}` }]}
                          active={payout.id === selected?.id}
                          onSelect={() => setSelectedId(payout.id)}
                        />
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </QueryBoundary>
        </div>

        {selected ? (
          <PayoutDetail
            key={selected.id}
            payout={selected}
            onMoved={(status) => {
              if (!TAB_STATUSES[tab].includes(status)) {
                const target = (Object.keys(TAB_STATUSES) as PayoutTab[]).find(
                  (candidate) => candidate !== "OPEN" && TAB_STATUSES[candidate].includes(status),
                );
                if (target) {
                  setTab(target);
                }
              }
            }}
          />
        ) : (
          <FinanceDetailPlaceholder>เลือกคำขอถอนเงินจากคิวทางซ้ายเพื่อตรวจและโอน</FinanceDetailPlaceholder>
        )}
      </div>
    </div>
  );
}
