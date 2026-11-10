import { DataTable, type DataTableColumn } from "@/components/common";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { formatCount } from "../catalog.format";
import { formatReportBaht, STOCK_STATUS_BADGE } from "../weekly-report.format";
import type { WeeklyReport } from "../weekly-report.types";

const HEAD = "h-[45px] px-4 text-xs font-medium text-muted-foreground";
const CELL = "px-4 py-3.5 text-sm text-foreground";

/** แถวละเกมและประเภทสินค้าตาม `breakdownByGameAndType` แถวท้ายคือ `totals` ที่ backend รวมให้ */
export function WeeklyReportTable({ report }: { report: WeeklyReport }) {
  const { breakdownByGameAndType: rows, totals } = report;

  const bold = <T extends string | number>(value: T) => <span className="font-bold">{value}</span>;
  const meta = { headClassName: HEAD, cellClassName: CELL };
  const columns: DataTableColumn<(typeof rows)[number]>[] = [
    { id: "game", header: "หมวดหมู่เกม", meta, cell: ({ row }) => row.original.game, footer: () => bold("รวมทั้งหมด") },
    { id: "type", header: "ประเภทสินค้า", meta, cell: ({ row }) => row.original.productTypeLabel, footer: () => bold("-") },
    { id: "initial", header: "สต็อกต้นสัปดาห์", meta, cell: ({ row }) => formatCount(row.original.initialStock), footer: () => bold(formatCount(totals.initialStock)) },
    { id: "sold", header: "ขายออกสัปดาห์นี้", meta, cell: ({ row }) => formatCount(row.original.soldCount), footer: () => bold(formatCount(totals.soldCount)) },
    { id: "remaining", header: "สต็อกคงเหลือ", meta, cell: ({ row }) => formatCount(row.original.remainingStock), footer: () => bold(formatCount(totals.remainingStock)) },
    { id: "gmv", header: "ยอดขายรวม", meta, cell: ({ row }) => formatReportBaht(row.original.gmv), footer: () => bold(formatReportBaht(totals.gmv)) },
    // ไม่ใส่ % ท้ายชื่อ: กำไรหักต้นทุนและค่าคอมจริงต่อออเดอร์ ไม่ใช่อัตราคงที่
    { id: "profit", header: "กำไรสุทธิ", meta, cell: ({ row }) => formatReportBaht(row.original.netProfit), footer: () => bold(formatReportBaht(totals.netProfit)) },
    {
      id: "status",
      header: "สถานะสต็อก",
      meta,
      cell: ({ row }) => (
        <Badge className={cn("h-[22px] rounded-full px-2 text-xs", STOCK_STATUS_BADGE[row.original.status])}>{row.original.statusLabel}</Badge>
      ),
      footer: () => bold("-"),
    },
  ];

  return (
    <Card className="gap-0 overflow-hidden rounded-xl border border-border p-0 shadow-none ring-0">
      <p className="px-6 py-5 text-lg font-semibold text-card-foreground">
        ตารางสรุปสต็อกและกำไรแยกรายเกมและประเภทสินค้า
      </p>
      <DataTable
        columns={columns}
        data={rows}
        getRowId={(row) => `${row.gameSlug}-${row.productType}`}
        headerRowClassName="bg-muted/50 hover:bg-muted/50"
        footerRowClassName="bg-muted font-bold hover:bg-muted"
      />
    </Card>
  );
}
