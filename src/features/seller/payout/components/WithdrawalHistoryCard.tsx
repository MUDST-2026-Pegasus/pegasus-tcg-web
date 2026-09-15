import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

import type { PayoutData, WithdrawalStatus } from "../payout.types";

const STATUS_BADGE: Record<WithdrawalStatus, string> = {
  success: "bg-green-100 text-emerald-700",
  processing: "bg-amber-100 text-amber-700",
  cancelled: "bg-rose-100 text-red-600",
};

const HEAD_CLASS = "h-auto px-0 py-2.5 text-xs font-medium text-gray-500";
const CELL_CLASS = "px-0 py-3 text-xs";

type WithdrawalHistoryCardProps = PayoutData["history"];

/**
 * ประวัติการถอนเงิน
 *
 * หมายเหตุ: ในดีไซน์ทุกแถวมีลิงก์ "ดูสลิป" รวมถึงแถวที่ยกเลิก
 * ที่นี่โชว์เฉพาะแถวที่โอนสำเร็จ เพราะรายการที่ยกเลิก/ยังไม่โอนไม่มีสลิปให้ดู
 */
export function WithdrawalHistoryCard({
  title,
  subtitle,
  yearPlaceholder,
  yearOptions,
  exportLabel,
  columns,
  viewSlipLabel,
  rows,
}: WithdrawalHistoryCardProps) {
  return (
    <Card className="w-full gap-0 rounded-xl border border-border p-0 shadow-none ring-0">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-4 pb-3.5">
        <div className="flex flex-col gap-[3px]">
          <h2 className="text-base font-semibold text-zinc-950">{title}</h2>
          <p className="text-xs text-gray-500">{subtitle}</p>
        </div>

        <div className="flex items-center gap-2">
          <Select
            items={Object.fromEntries(
              yearOptions.map((option) => [option.value, option.label]),
            )}
            defaultValue={yearOptions[0]?.value}
          >
            <SelectTrigger
              size="sm"
              aria-label={yearPlaceholder}
              className="w-48 rounded-lg border-input bg-background pr-2 pl-2.5 text-sm"
            >
              <SelectValue placeholder={yearPlaceholder} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {yearOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" className="rounded-md px-2.5">
            {exportLabel}
          </Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="border-y border-gray-100 bg-neutral-50 hover:bg-neutral-50">
            <TableHead className={cn(HEAD_CLASS, "w-45 pl-5")}>
              {columns.requestedAt}
            </TableHead>
            <TableHead className={cn(HEAD_CLASS, "w-44")}>
              {columns.id}
            </TableHead>
            <TableHead className={cn(HEAD_CLASS, "w-40")}>
              {columns.amount}
            </TableHead>
            <TableHead className={cn(HEAD_CLASS, "w-60")}>
              {columns.destination}
            </TableHead>
            <TableHead className={cn(HEAD_CLASS, "w-36")}>
              {columns.status}
            </TableHead>
            {/* คอลัมน์ลิงก์สลิปท้ายแถวไม่มีหัวตารางในดีไซน์ */}
            <TableHead className={cn(HEAD_CLASS, "pr-5")}>
              <span className="sr-only">{columns.actions}</span>
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody className="[&_tr]:border-gray-100">
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell className={cn(CELL_CLASS, "pl-5 text-gray-700")}>
                {row.requestedAt}
              </TableCell>

              <TableCell className={cn(CELL_CLASS, "text-gray-500")}>
                {row.id}
              </TableCell>

              <TableCell className={cn(CELL_CLASS, "font-semibold text-zinc-950")}>
                {row.amount}
              </TableCell>

              <TableCell className={cn(CELL_CLASS, "text-gray-500")}>
                {row.destination}
              </TableCell>

              <TableCell className={CELL_CLASS}>
                <Badge
                  className={cn(
                    "h-5 rounded-full px-2 text-xs",
                    STATUS_BADGE[row.status],
                  )}
                >
                  {row.statusLabel}
                </Badge>
              </TableCell>

              <TableCell className={cn(CELL_CLASS, "pr-5 text-right")}>
                {row.status === "success" ? (
                  <Button
                    variant="link"
                    size="xs"
                    aria-label={`${viewSlipLabel} ${row.id}`}
                    className="h-auto px-0 text-xs font-medium text-teal-600"
                  >
                    {viewSlipLabel}
                  </Button>
                ) : null}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
