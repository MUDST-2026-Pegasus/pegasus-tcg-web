import { DataTable, type DataTableColumn } from "@/components/common";
import { Button } from "@/components/ui/button";
import type { Payout, Wallet } from "@/features/finance/finance.types";
import { formatThaiDateTime, money, walletEntryLabel } from "../payout.format";
import { useTranslate } from "@/lib/i18n";

type Props = {
  wallet: Wallet | null;
  payouts: Payout[];
  page: number;
  pageSize: number;
  isFetching: boolean;
  onPageChange: (page: number) => void;
  onSelect: (payout: Payout) => void;
};

export function WalletLedger({ wallet, payouts, page, pageSize, isFetching, onPageChange, onSelect }: Props) {
  const { t } = useTranslate("seller");
  if (!wallet) {
    return <p className="p-8 text-center text-sm text-muted-foreground">{t("payout.ledger.loadFailed", "ยังโหลดรายการเคลื่อนไหวกระเป๋าไม่ได้")}</p>;
  }

  const { items, totalItems } = wallet.entries;
  const start = totalItems ? page * pageSize + 1 : 0;
  const end = Math.min((page + 1) * pageSize, totalItems);

  const columns: DataTableColumn<(typeof items)[number]>[] = [
    { id: "date", header: t("payout.ledger.columns.date", "วันที่"), meta: { headClassName: "px-5 py-3", cellClassName: "px-5 py-4" }, cell: ({ row }) => formatThaiDateTime(row.original.createdAt) },
    { id: "type", header: t("payout.ledger.columns.type", "รายการ"), meta: { cellClassName: "font-medium" }, cell: ({ row }) => walletEntryLabel(row.original.type) },
    {
      id: "reference",
      header: t("payout.ledger.columns.reference", "อ้างอิง"),
      cell: ({ row: { original: entry } }) => {
        const linked = entry.referenceType === "PAYOUT" ? payouts.find((payout) => payout.id === entry.referenceId) : null;
        if (linked) {
          return (
            <button type="button" className="text-teal-700 hover:underline" onClick={() => onSelect(linked)}>
              {t("payout.detail.title", "คำขอถอน #{id}", { id: linked.id })}
            </button>
          );
        }
        return entry.referenceId ? `${entry.referenceType ?? t("payout.ledger.columns.type", "รายการ")} #${entry.referenceId}` : "—";
      },
    },
    {
      id: "amount",
      header: t("payout.ledger.columns.amount", "จำนวน"),
      meta: { headClassName: "text-right", cellClassName: "text-right" },
      cell: ({ row: { original: entry } }) => (
        <span className={`font-semibold ${entry.direction === "CREDIT" ? "text-emerald-700" : "text-destructive"}`}>
          {entry.direction === "CREDIT" ? "+" : "−"}{money(entry.amount)}
        </span>
      ),
    },
    { id: "balance", header: t("payout.ledger.columns.balance", "คงเหลือ"), meta: { headClassName: "pr-5 text-right", cellClassName: "pr-5 text-right text-muted-foreground" }, cell: ({ row }) => money(row.original.balanceAfter) },
  ];

  return (
    <>
      <div className="px-5 py-4">
        <h2 className="font-semibold">{t("payout.tabs.wallet", "รายการเคลื่อนไหวกระเป๋า")}</h2>
        <p className="text-xs text-muted-foreground">{t("payout.ledger.subtitle", "ทุกการเปลี่ยนแปลงยอดในกระเป๋า เรียงล่าสุดก่อน · ยอดที่ขอถอนจะขึ้นที่นี่เมื่อโอนสำเร็จเท่านั้น")}</p>
      </div>
      <div className="overflow-x-auto">
        <DataTable
          columns={columns}
          data={items}
          getRowId={(entry) => String(entry.id)}
          tableClassName="min-w-[700px] text-left"
          headerRowClassName="bg-muted text-xs text-muted-foreground"
          emptyMessage={t("payout.ledger.empty", "ยังไม่มีรายการเคลื่อนไหว")}
        />
      </div>
      <div className="flex items-center justify-between border-t px-5 py-3 text-xs text-muted-foreground">
        <p aria-live="polite">{isFetching ? t("payout.ledger.loading", "กำลังโหลดรายการ...") : t("payout.ledger.range", "แสดง {start}–{end} จาก {total} รายการ", { start, end, total: totalItems })}</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={isFetching || page === 0} onClick={() => onPageChange(page - 1)}>{t("actions.previous", "ก่อนหน้า", { ns: "common" })}</Button>
          <Button variant="outline" size="sm" disabled={isFetching || (page + 1) * pageSize >= totalItems} onClick={() => onPageChange(page + 1)}>{t("actions.next", "ถัดไป", { ns: "common" })}</Button>
        </div>
      </div>
    </>
  );
}
