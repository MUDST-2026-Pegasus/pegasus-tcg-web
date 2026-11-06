import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

import { formatBaht, formatCount } from "../catalog.format";
import { formatShare, productTypeLabel, STOCK_STATUS_BADGE } from "../weekly-report.format";
import type { WeeklyReport } from "../weekly-report.types";

const HEAD = "h-[45px] px-4 text-xs font-medium text-muted-foreground";
const CELL = "px-4 py-3.5 text-sm text-foreground";

/** ตารางแถวละเกมตาม `breakdownTable` แถวท้ายคือ `totals` ที่ backend รวมให้ */
export function WeeklyReportTable({ report }: { report: WeeklyReport }) {
  const { breakdownTable: rows, totals, meta } = report;

  return (
    <Card className="gap-0 overflow-hidden rounded-xl border border-border p-0 shadow-none ring-0">
      <p className="px-6 py-5 text-lg font-semibold text-card-foreground">
        ตารางสรุปสต็อกและกำไรแยกรายเกมและประเภทสินค้า
      </p>
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className={HEAD}>หมวดหมู่เกม</TableHead>
            <TableHead className={HEAD}>ประเภทสินค้า</TableHead>
            <TableHead className={HEAD}>สต็อกต้นสัปดาห์</TableHead>
            <TableHead className={HEAD}>ขายออกสัปดาห์นี้</TableHead>
            <TableHead className={HEAD}>สต็อกคงเหลือ</TableHead>
            <TableHead className={HEAD}>ยอดขายรวม</TableHead>
            <TableHead className={HEAD}>
              กำไรสุทธิ ({formatShare(meta.commissionRatePercent)})
            </TableHead>
            <TableHead className={HEAD}>สถานะสต็อก</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.gameSlug}>
              <TableCell className={CELL}>{row.game}</TableCell>
              <TableCell className={CELL}>{productTypeLabel(row)}</TableCell>
              <TableCell className={CELL}>{formatCount(row.initialStock)}</TableCell>
              <TableCell className={CELL}>{formatCount(row.soldCount)}</TableCell>
              <TableCell className={CELL}>
                {formatCount(row.remainingStock)}
                {row.singleCards > 0 && row.sealedBoxes > 0 ? (
                  <span className="block text-[11px] text-muted-foreground">
                    การ์ดเดี่ยว {formatCount(row.singleCards)} / กล่องสุ่ม {formatCount(row.sealedBoxes)}
                  </span>
                ) : null}
              </TableCell>
              <TableCell className={CELL}>{formatBaht(row.gmv)}</TableCell>
              <TableCell className={CELL}>{formatBaht(row.netProfit)}</TableCell>
              <TableCell className={CELL}>
                <Badge className={cn("h-[22px] rounded-full px-2 text-xs", STOCK_STATUS_BADGE[row.status])}>
                  {row.statusLabel}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow className="bg-muted font-bold hover:bg-muted">
            <TableCell className={cn(CELL, "font-bold")}>รวมทั้งหมด</TableCell>
            <TableCell className={cn(CELL, "font-bold")}>-</TableCell>
            <TableCell className={cn(CELL, "font-bold")}>{formatCount(totals.initialStock)}</TableCell>
            <TableCell className={cn(CELL, "font-bold")}>{formatCount(totals.soldCount)}</TableCell>
            <TableCell className={cn(CELL, "font-bold")}>{formatCount(totals.remainingStock)}</TableCell>
            <TableCell className={cn(CELL, "font-bold")}>{formatBaht(totals.gmv)}</TableCell>
            <TableCell className={cn(CELL, "font-bold")}>{formatBaht(totals.netProfit)}</TableCell>
            <TableCell className={cn(CELL, "font-bold")}>-</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </Card>
  );
}
