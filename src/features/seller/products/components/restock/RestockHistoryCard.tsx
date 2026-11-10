import { DataTable, type DataTableColumn } from "@/components/common";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatBaht } from "@/features/seller/shared/seller.format";
import { cn } from "@/lib/utils";

import { toRestockLot } from "../../restock.api";
import type { RestockCalculation } from "../../restock.calc";
import { formatThaiDate } from "../../restock.calc";
import { useStockIns } from "../../restock.queries";
import type { RestockData, RestockDraft, RestockLot } from "../../restock.types";
import { useTranslate } from "@/lib/i18n";

const HEAD_CLASS = "h-auto px-3 py-2.5 text-xs font-medium text-gray-500";
const CELL_CLASS = "px-3 py-3 text-xs";

type RestockHistoryCardProps = RestockData["history"] & {
  market: RestockData["market"];
  unit: string;
  sourceOptions: RestockData["form"]["sourceOptions"];
  draft: RestockDraft;
  result: RestockCalculation;
};

/**
 * ประวัติการรับเข้า — แถวบนสุดพื้นเทาคือล็อตที่กำลังกรอก (ยังไม่บันทึก)
 * โชว์ก็ต่อเมื่อกรอกครบ ตัวเลขสรุปใต้หัวตารางนับแถวนี้รวมด้วย
 * ล็อตที่บันทึกแล้วโหลดเองจาก `useStockIns` โหลดไม่ขึ้นก็ไม่กระทบฟอร์มรับเข้า
 */
export function RestockHistoryCard({
  title,
  exportLabel,
  columns: labels,
  newBadgeLabel,
  emptyLabel,
  errorLabel,
  loadMoreLabel,
  market,
  unit,
  sourceOptions,
  draft,
  result,
}: RestockHistoryCardProps) {
  const { t } = useTranslate("seller");
  const pendingLot: RestockLot | null = result.isValid
    ? {
        id: "pending",
        receivedAt: draft.receivedAt,
        quantity: result.quantity,
        unitCost: result.unitCost,
        totalCost: result.totalCost,
        sourceLabel:
          sourceOptions.find((option) => option.value === draft.source)
            ?.label ?? "",
        averageCostAfter: result.newAverageCost,
      }
    : null;

  const stockIns = useStockIns(market.variantId, market.condition);
  const firstPage = stockIns.data?.pages[0];
  const lots = stockIns.data?.pages.flatMap((page) => page.lots.items.map(toRestockLot)) ?? [];

  const rows = pendingLot ? [pendingLot, ...lots] : lots;
  const pendingQuantity = pendingLot?.quantity ?? 0;
  const lotCount = (firstPage?.lots.totalItems ?? 0) + (pendingLot ? 1 : 0);
  const receivedCount = (firstPage?.receivedTotal ?? 0) + pendingQuantity;
  const soldCount = firstPage?.soldTotal ?? 0;

  const errorNotice = (
    <div role="alert" className="flex flex-col items-center gap-2 text-xs text-gray-500">
      {errorLabel}
      <Button variant="outline" size="sm" className="rounded-md px-2.5" onClick={() => void stockIns.refetch()}>
        {t("restock.retry", "ลองอีกครั้ง")}
      </Button>
    </div>
  );

  const tableColumns: DataTableColumn<RestockLot>[] = [
    {
      id: "receivedAt",
      header: labels.receivedAt,
      meta: { headClassName: cn(HEAD_CLASS, "pl-5"), cellClassName: cn(CELL_CLASS, "pl-5 text-gray-700") },
      cell: ({ row: { original: lot } }) => (
        <div className="flex items-center gap-2">
          {formatThaiDate(lot.receivedAt)}
          {lot === pendingLot ? <Badge className="h-5 rounded-[5px] bg-emerald-50 px-2 text-xs text-teal-600">{newBadgeLabel}</Badge> : null}
        </div>
      ),
    },
    { id: "quantity", header: labels.quantity, meta: { headClassName: HEAD_CLASS, cellClassName: cn(CELL_CLASS, "font-medium text-emerald-700") }, cell: ({ row }) => `+${row.original.quantity} ${unit}` },
    { id: "unitCost", header: labels.unitCost, meta: { headClassName: HEAD_CLASS, cellClassName: cn(CELL_CLASS, "text-gray-700") }, cell: ({ row }) => formatBaht(row.original.unitCost) },
    { id: "totalCost", header: labels.totalCost, meta: { headClassName: HEAD_CLASS, cellClassName: cn(CELL_CLASS, "font-medium text-foreground") }, cell: ({ row }) => formatBaht(row.original.totalCost) },
    { id: "source", header: labels.source, meta: { headClassName: HEAD_CLASS, cellClassName: cn(CELL_CLASS, "text-gray-500") }, cell: ({ row }) => row.original.sourceLabel },
    {
      id: "average",
      header: labels.averageCostAfter,
      meta: { headClassName: cn(HEAD_CLASS, "pr-5"), cellClassName: cn(CELL_CLASS, "pr-5 font-semibold text-foreground") },
      cell: ({ row }) => (row.original.averageCostAfter === null ? "—" : formatBaht(row.original.averageCostAfter)),
    },
  ];

  return (
    <Card className="w-full gap-0 rounded-xl border border-border p-0 shadow-none ring-0">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-4 pb-3.5">
        <div className="flex flex-col gap-[3px]">
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          <p className="text-xs text-gray-500">
            {t("restock.history.summary", "{lots} ล็อต · รับเข้าสะสม {received} {unit} · ขายไปแล้ว {sold} {unit}", { lots: lotCount, received: receivedCount, sold: soldCount, unit })}
          </p>
        </div>

        <Button variant="outline" size="sm" className="rounded-md px-2.5">
          {exportLabel}
        </Button>
      </div>

      <DataTable
        columns={tableColumns}
        data={rows}
        getRowId={(lot) => String(lot.id)}
        isLoading={stockIns.isPending}
        emptyMessage={stockIns.isError ? errorNotice : <span className="text-xs text-gray-400">{emptyLabel}</span>}
        headerRowClassName="border-y border-muted bg-neutral-50 hover:bg-neutral-50"
        bodyClassName="[&_tr]:border-muted"
        rowClassName={(lot) => cn(lot === pendingLot && "bg-gray-50 hover:bg-gray-50")}
      />
      {/* มีล็อตที่กำลังกรอกอยู่ ตารางไม่ว่าง แต่ประวัติยังโหลดไม่ขึ้น */}
      {stockIns.isError && rows.length > 0 ? <div className="border-t border-muted py-6 text-center">{errorNotice}</div> : null}

      {stockIns.hasNextPage ? (
        <div className="flex justify-center border-t border-muted px-5 py-3">
          <Button
            variant="outline"
            size="sm"
            className="rounded-md px-2.5"
            disabled={stockIns.isFetchingNextPage}
            onClick={() => void stockIns.fetchNextPage()}
          >
            {loadMoreLabel}
          </Button>
        </div>
      ) : null}
    </Card>
  );
}
