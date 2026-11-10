import { DataTable, type DataTableColumn } from "@/components/common";
import { CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Payout } from "@/features/finance/finance.types";
import { formatThaiDateTime, money, payoutDetail, payoutStatuses, PAYOUT_MINIMUM } from "../payout.format";
import { PayoutStatusBadge } from "./PayoutStatusBadge";
import { useTranslate } from "@/lib/i18n";

type Props = {
  payouts: Payout[] | null;
  filter: string;
  onFilterChange: (filter: string) => void;
  onSelect: (payout: Payout) => void;
};

export function PayoutHistory({ payouts, filter, onFilterChange, onSelect }: Props) {
  const { t } = useTranslate("seller");
  const statusOptions = [
    { value: "ALL", label: t("payout.history.filterAll", "สถานะ: ทั้งหมด") },
    ...Object.entries(payoutStatuses).map(([value, status]) => ({ value, label: status.label })),
  ];
  if (!payouts) {
    return <p className="p-8 text-center text-sm text-muted-foreground">{t("payout.history.loadFailed", "ยังโหลดรายการคำขอถอนเงินไม่ได้")}</p>;
  }

  const paidTotal = payouts
    .filter((payout) => payout.status === "PAID")
    .reduce((sum, payout) => sum + Number(payout.amount), 0);
  const history = filter === "ALL" ? payouts : payouts.filter((payout) => payout.status === filter);

  const columns: DataTableColumn<Payout>[] = [
    { id: "date", header: t("payout.history.columns.date", "วันที่ขอ"), meta: { headClassName: "px-5 py-3", cellClassName: "px-5 py-4" }, cell: ({ row }) => formatThaiDateTime(row.original.requestedAt) },
    { id: "id", header: t("payout.history.columns.id", "เลขที่"), cell: ({ row }) => `#${row.original.id}` },
    { id: "amount", header: t("payout.detail.amount", "จำนวนเงิน"), meta: { cellClassName: "font-semibold" }, cell: ({ row }) => money(row.original.amount) },
    { id: "status", header: t("payout.history.columns.status", "สถานะ"), cell: ({ row }) => <PayoutStatusBadge status={row.original.status} /> },
    {
      id: "detail",
      header: t("payout.history.columns.detail", "รายละเอียด"),
      cell: ({ row: { original: payout } }) => (
        <span className={payout.status === "REJECTED" || payout.status === "FAILED" ? "text-red-700" : ""}>{payoutDetail(payout)}</span>
      ),
    },
    {
      id: "actions",
      header: () => <span className="sr-only">{t("payout.history.viewDetail", "ดูรายละเอียด")}</span>,
      meta: { headClassName: "pr-5", cellClassName: "pr-5" },
      // ปล่อยให้คลิกไหลไปที่แถว ซึ่งเปิดรายละเอียดอยู่แล้ว
      cell: () => <button type="button" className="text-teal-700 hover:underline">{t("payout.history.viewDetailLink", "ดูรายละเอียด ›")}</button>,
    },
  ];

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <div>
          <h2 className="font-semibold">{t("payout.tabs.payouts", "คำขอถอนเงิน")}</h2>
          <p className="text-xs text-muted-foreground">{t("payout.history.summary", "{count} คำขอ · โอนสำเร็จแล้วรวม {total}", { count: payouts.length, total: money(paidTotal) })}</p>
        </div>
        <Select items={statusOptions} value={filter} onValueChange={(next) => {
          if (next !== null) onFilterChange(next);
        }}>
          <SelectTrigger aria-label={t("payout.history.filterLabel", "สถานะคำขอ")} className="h-9 min-w-40 rounded-lg border-input bg-background text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            <SelectGroup>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      {history.length ? (
        <div className="overflow-x-auto">
          <DataTable
            columns={columns}
            data={history}
            getRowId={(payout) => String(payout.id)}
            tableClassName="min-w-[740px] text-left"
            headerRowClassName="bg-muted text-xs text-muted-foreground"
            rowClassName={() => "hover:bg-slate-50"}
            onRowClick={onSelect}
          />
        </div>
      ) : (
        <CardContent className="py-12 text-center">
          <p className="font-semibold">{t("payout.history.empty", "ยังไม่มีคำขอถอนเงิน")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t("payout.history.emptyHint", "เมื่อมียอดถอนได้อย่างน้อย {min} คุณสามารถส่งคำขอถอนเงินได้ที่ปุ่มด้านบน", { min: money(PAYOUT_MINIMUM) })}</p>
        </CardContent>
      )}
    </>
  );
}
