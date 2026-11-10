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
import { useTranslate, translate } from "@/lib/i18n";

type RefundTab = Extract<RefundStatus, "APPROVED" | "PROCESSING" | "PROCESSED"> | "ALL";

const QUEUE_TITLE: Record<RefundTab, string> = {
  get APPROVED() {
    return translate("admin", "refunds.queue.approved", "คิวพร้อมโอน");
  },
  get PROCESSING() {
    return translate("admin", "refunds.queue.processing", "กำลังโอน");
  },
  get PROCESSED() {
    return translate("admin", "refunds.queue.processed", "โอนแล้ว");
  },
  get ALL() {
    return translate("admin", "refunds.queue.all", "ทั้งหมด");
  },
};

/**
 * หน้า "คืนเงินผู้ซื้อ" — รายการคืนเงินที่ระบบสร้างจากการยกเลิกหรือคืนสินค้า
 * admin โอนเข้าบัญชีที่ผู้ซื้อระบุนอกระบบ แล้วกลับมายืนยันด้วยเลขอ้างอิง
 * อ้างจาก Figma node 1913:2813
 */
export function AdminRefundsContent() {
  const { t } = useTranslate("admin");
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
        label: t("refunds.failedAttempts", "โอนพลาด {count} ครั้ง", { count: refund.failedAttempts }),
        className: "bg-[#fbe9e8] text-[#d0342c]",
      });
    }
    if (!refund.accountNumber && refund.status === "APPROVED" && refund.method === "BANK_TRANSFER") {
      badges.push({ label: t("refunds.noAccount", "ยังไม่ระบุบัญชี"), className: "bg-[#fdf0dd] text-[#b45309]" });
    }
    return badges;
  };

  const sourceText = (refund: AdminRefund) =>
    refund.returnRequestId !== null
      ? refund.resolution === "PARTIAL_REFUND"
        ? t("refunds.source.partial", "คืนสินค้าบางส่วน")
        : t("refunds.source.full", "คืนสินค้าเต็มจำนวน")
      : t("refunds.source.cancel", "ยกเลิกคำสั่งซื้อ");

  return (
    <div className="flex flex-col gap-6">
      <FinancePageHeader
        title={t("refunds.title", "คืนเงินผู้ซื้อ")}
        description={t("refunds.description", "รายการคืนเงินที่ระบบสร้างจากการยกเลิกคำสั่งซื้อและการคืนสินค้า · admin โอนคืนเข้าบัญชีที่ผู้ซื้อระบุ")}
        onExport={exportCsv}
        exportDisabled={refunds.length === 0}
      />

      <div className="flex items-start gap-2.5 rounded-xl bg-[#e8f1fc] px-4 py-3 text-xs text-[#0058bc]">
        <Info className="mt-px size-4 shrink-0" />
        <p>
          {t("refunds.notice", "ไม่มีปุ่มขอคืนเงินโดยตรง — ระบบสร้างรายการคืนเงินให้เองเมื่อ (1) คำสั่งซื้อที่ชำระแล้วถูกยกเลิก หรือ (2) ผู้ขายอนุมัติการคืนสินค้า · ผู้ซื้อต้องระบุบัญชีรับเงินก่อน admin จะเริ่มโอนได้")}
        </p>
      </div>

      <FinanceStatStrip
        isLoading={summary.isPending}
        isError={summary.isError}
        stats={[
          { label: t("refunds.stats.ready", "พร้อมโอน"), value: String(counts?.ready ?? 0), dotClass: "bg-[#b45309]", emphasized: true },
          { label: t("refunds.stats.processing", "กำลังโอน"), value: String(counts?.processing ?? 0), dotClass: "bg-[#12805c]" },
          {
            label: t("refunds.stats.failed", "โอนไม่สำเร็จ · รอผู้ซื้อแก้บัญชี"),
            value: String(counts?.failedAwaitingBuyer ?? 0),
            dotClass: "bg-[#d0342c]",
          },
          {
            label: t("refunds.stats.processedThisMonth", "โอนแล้วเดือนนี้"),
            value: `${counts?.processedThisMonth ?? 0} · ${formatBahtShort(counts?.processedAmountThisMonth ?? 0)}`,
            dotClass: "bg-[#9aa5ad]",
          },
        ]}
      />

      <FinanceTabs<RefundTab>
        tabs={[
          { value: "APPROVED", label: t("refunds.tabs.ready", "พร้อมโอน ({count})", { count: counts?.ready ?? 0 }) },
          { value: "PROCESSING", label: t("refunds.tabs.processing", "กำลังโอน ({count})", { count: counts?.processing ?? 0 }) },
          { value: "PROCESSED", label: t("refunds.queue.processed", "โอนแล้ว") },
          { value: "ALL", label: t("refunds.queue.all", "ทั้งหมด") },
        ]}
        active={tab}
        onChange={changeTab}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder={t("refunds.searchPlaceholder", "ค้นหา RF / ORD / ชื่อผู้ซื้อ")}
      />

      <div className="flex flex-col items-start gap-6 lg:flex-row">
        <div className="flex w-full flex-col gap-3 lg:w-[420px] lg:shrink-0">
          <QueryBoundary
            query={queue}
            loading={<SellerQueueSkeleton />}
            errorTitle={t("refunds.loadFailed", "โหลดรายการคืนเงินไม่สำเร็จ")}
            errorMessage={t("finance.checkConnection", "ตรวจสอบการเชื่อมต่อแล้วลองใหม่")}
            isEmpty={() => refunds.length === 0}
            empty={
              <EmptyState
                icon={Inbox}
                title={search ? t("finance.noSearchMatch", "ไม่พบรายการที่ค้นหา") : t("refunds.emptyQueue", "ไม่มีรายการใน \"{queue}\"", { queue: QUEUE_TITLE[tab] })}
                description={search ? t("refunds.searchHint", "ลองค้นด้วยเลข RF, เลขคำสั่งซื้อ หรือชื่อผู้ซื้อ") : t("refunds.emptyDescription", "รายการคืนเงินจะขึ้นที่นี่เมื่อระบบสร้างให้")}
              />
            }
          >
            {() => (
              <>
                <FinanceQueueHeader
                  title={`${QUEUE_TITLE[tab]} (${refunds.length})`}
                  sortLabel={tab === "ALL" ? t("finance.sortNewest", "เรียงตาม: ใหม่สุด") : t("finance.sortOldest", "เรียงตาม: เก่าสุด")}
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
          <FinanceDetailPlaceholder>{t("refunds.placeholder", "เลือกรายการคืนเงินจากคิวทางซ้ายเพื่อดูบัญชีและโอนคืน")}</FinanceDetailPlaceholder>
        )}
      </div>
    </div>
  );
}

// @tolgee-key {"key": "refunds.queue.approved", "ns": "admin", "defaultValue": "คิวพร้อมโอน"}
// @tolgee-key {"key": "refunds.queue.processing", "ns": "admin", "defaultValue": "กำลังโอน"}
// @tolgee-key {"key": "refunds.queue.processed", "ns": "admin", "defaultValue": "โอนแล้ว"}
// @tolgee-key {"key": "refunds.queue.all", "ns": "admin", "defaultValue": "ทั้งหมด"}
