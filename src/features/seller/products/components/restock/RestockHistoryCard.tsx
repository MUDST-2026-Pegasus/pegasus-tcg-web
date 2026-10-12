import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatBaht } from "@/features/seller/shared/seller.format";
import { cn } from "@/lib/utils";

import type { RestockCalculation } from "../../restock.calc";
import { formatThaiDate } from "../../restock.calc";
import type { RestockData, RestockDraft, RestockLot } from "../../restock.types";

const HEAD_CLASS = "h-auto px-3 py-2.5 text-xs font-medium text-gray-500";
const CELL_CLASS = "px-3 py-3 text-xs";

type RestockHistoryCardProps = RestockData["history"] & {
  unit: string;
  sourceOptions: RestockData["form"]["sourceOptions"];
  draft: RestockDraft;
  result: RestockCalculation;
};

/**
 * ประวัติการรับเข้า — แถวบนสุดพื้นเทาคือล็อตที่กำลังกรอก (ยังไม่บันทึก)
 * โชว์ก็ต่อเมื่อกรอกครบ ตัวเลขสรุปใต้หัวตารางนับแถวนี้รวมด้วย
 */
export function RestockHistoryCard({
  title,
  exportLabel,
  soldCount,
  columns,
  newBadgeLabel,
  emptyLabel,
  lots,
  unit,
  sourceOptions,
  draft,
  result,
}: RestockHistoryCardProps) {
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

  const rows = pendingLot ? [pendingLot, ...lots] : lots;
  const receivedCount = rows.reduce((sum, lot) => sum + lot.quantity, 0);

  return (
    <Card className="w-full gap-0 rounded-xl border border-border p-0 shadow-none ring-0">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-4 pb-3.5">
        <div className="flex flex-col gap-[3px]">
          <h2 className="text-base font-semibold text-zinc-950">{title}</h2>
          <p className="text-xs text-gray-500">
            {rows.length} ล็อต · รับเข้าสะสม {receivedCount} {unit} · ขายไปแล้ว{" "}
            {soldCount} {unit}
          </p>
        </div>

        <Button variant="outline" size="sm" className="rounded-md px-2.5">
          {exportLabel}
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="border-y border-gray-100 bg-neutral-50 hover:bg-neutral-50">
            <TableHead className={cn(HEAD_CLASS, "pl-5")}>
              {columns.receivedAt}
            </TableHead>
            <TableHead className={HEAD_CLASS}>{columns.quantity}</TableHead>
            <TableHead className={HEAD_CLASS}>{columns.unitCost}</TableHead>
            <TableHead className={HEAD_CLASS}>{columns.totalCost}</TableHead>
            <TableHead className={HEAD_CLASS}>{columns.source}</TableHead>
            <TableHead className={cn(HEAD_CLASS, "pr-5")}>
              {columns.averageCostAfter}
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody className="[&_tr]:border-gray-100">
          {rows.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell
                colSpan={6}
                className="py-6 text-center text-xs text-gray-400"
              >
                {emptyLabel}
              </TableCell>
            </TableRow>
          ) : null}

          {rows.map((lot) => {
            const isPending = lot === pendingLot;

            return (
              <TableRow
                key={lot.id}
                className={cn(isPending && "bg-gray-50 hover:bg-gray-50")}
              >
                <TableCell className={cn(CELL_CLASS, "pl-5 text-gray-700")}>
                  <div className="flex items-center gap-2">
                    {formatThaiDate(lot.receivedAt)}
                    {isPending ? (
                      <Badge className="h-5 rounded-[5px] bg-emerald-50 px-2 text-xs text-teal-600">
                        {newBadgeLabel}
                      </Badge>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell
                  className={cn(CELL_CLASS, "font-medium text-emerald-700")}
                >
                  +{lot.quantity} {unit}
                </TableCell>
                <TableCell className={cn(CELL_CLASS, "text-gray-700")}>
                  {formatBaht(lot.unitCost)}
                </TableCell>
                <TableCell className={cn(CELL_CLASS, "font-medium text-zinc-950")}>
                  {formatBaht(lot.totalCost)}
                </TableCell>
                <TableCell className={cn(CELL_CLASS, "text-gray-500")}>
                  {lot.sourceLabel}
                </TableCell>
                <TableCell
                  className={cn(CELL_CLASS, "pr-5 font-semibold text-zinc-950")}
                >
                  {formatBaht(lot.averageCostAfter)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}
