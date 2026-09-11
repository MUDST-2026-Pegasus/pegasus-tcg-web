import { Ellipsis, ImageIcon, Pencil } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

import type {
  ProductRow,
  ProductStatus,
  ProductsData,
} from "../products.types";

const STATUS_BADGE: Record<ProductStatus, string> = {
  active: "bg-[#e3f4ec] text-[#12805c]",
  low_stock: "bg-[#fdf0dd] text-[#b45309]",
  out_of_stock: "bg-[#fbe9e8] text-[#d0342c]",
  draft: "bg-[#eef1f2] text-[#6b7280]",
};

const HEAD_CLASS = "h-auto py-2.5 text-xs font-medium text-gray-500";

type ProductTableProps = {
  table: ProductsData["table"];
  pagination: ProductsData["pagination"];
  rows: ProductRow[];
  /** จำนวนสินค้าทั้งหมดของตัวกรองที่เลือกอยู่ ใช้โชว์ในบรรทัดสรุปท้ายตาราง */
  totalCount: number;
  selectedIds: string[];
  onToggleRow: (id: string) => void;
  onToggleAll: () => void;
};

/**
 * ตารางสินค้า
 *
 * หมายเหตุ: ในดีไซน์ตารางเป็น flex กำหนดความกว้างคอลัมน์ตายตัว และทุกแถว
 * พื้นหลังเทาอ่อนเท่ากันหมด ที่นี่ใช้ <table> จริงเพื่อให้ screen reader
 * อ่านหัวคอลัมน์ได้ และให้พื้นเทาอ่อนเฉพาะแถวที่ถูกเลือก — แถวที่ไม่ได้เลือก
 * เป็นพื้นขาวคั่นด้วยเส้น ตรงกับที่ดีไซน์ตั้งใจสื่อเรื่องสถานะการเลือก
 */
export function ProductTable({
  table,
  pagination,
  rows,
  totalCount,
  selectedIds,
  onToggleRow,
  onToggleAll,
}: ProductTableProps) {
  const allSelected = rows.length > 0 && selectedIds.length === rows.length;

  return (
    <Card className="w-full gap-0 rounded-xl border border-border p-0 shadow-none ring-0">
      <Table>
        <TableHeader>
          <TableRow className="border-y border-gray-100 bg-neutral-50 hover:bg-neutral-50">
            <TableHead className={cn(HEAD_CLASS, "w-8 pl-5")}>
              <Checkbox
                checked={allSelected}
                onCheckedChange={onToggleAll}
                aria-label={table.selectAllLabel}
                className="size-3.5"
              />
            </TableHead>
            <TableHead className={cn(HEAD_CLASS, "w-72")}>
              {table.columns.product}
            </TableHead>
            <TableHead className={cn(HEAD_CLASS, "w-32")}>
              {table.columns.price}
            </TableHead>
            <TableHead className={cn(HEAD_CLASS, "w-32")}>
              {table.columns.cost}
            </TableHead>
            <TableHead className={cn(HEAD_CLASS, "w-24")}>
              {table.columns.stock}
            </TableHead>
            <TableHead className={cn(HEAD_CLASS, "w-20")}>
              {table.columns.sold}
            </TableHead>
            <TableHead className={cn(HEAD_CLASS, "w-28")}>
              {table.columns.status}
            </TableHead>
            {/* คอลัมน์ปุ่มท้ายแถวไม่มีหัวตารางในดีไซน์ */}
            <TableHead className={cn(HEAD_CLASS, "pr-5")}>
              <span className="sr-only">{table.columns.actions}</span>
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody className="[&_tr]:border-gray-100">
          {rows.map((row) => {
            const isSelected = selectedIds.includes(row.id);

            return (
              <TableRow
                key={row.id}
                data-state={isSelected ? "selected" : undefined}
                className={cn(isSelected && "bg-gray-50")}
              >
                <TableCell className="py-3 pl-5">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => onToggleRow(row.id)}
                    aria-label={`${table.selectRowLabel}: ${row.name}`}
                    className="size-3.5"
                  />
                </TableCell>

                <TableCell className="py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-gray-100">
                      <ImageIcon
                        aria-hidden="true"
                        className="size-4 text-gray-400"
                      />
                    </div>
                    <div className="flex min-w-0 flex-col gap-[3px]">
                      <p className="truncate text-xs font-medium text-zinc-950">
                        {row.name}
                      </p>
                      <p className="truncate text-[10px] text-gray-400">
                        {row.meta}
                      </p>
                    </div>
                  </div>
                </TableCell>

                <TableCell className="py-3 text-xs font-semibold text-zinc-950">
                  {row.price}
                </TableCell>

                <TableCell className="py-3 text-xs text-gray-500">
                  {row.cost}
                </TableCell>

                <TableCell className="py-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-xs font-semibold",
                        row.stock === 0 ? "text-[#d0342c]" : "text-zinc-950",
                      )}
                    >
                      {row.stock}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {table.stockUnit}
                    </span>
                  </div>
                </TableCell>

                <TableCell className="py-3 text-xs text-gray-700">
                  {row.sold}
                </TableCell>

                <TableCell className="py-3">
                  <Badge
                    className={cn(
                      "h-5 rounded-full px-2 text-xs",
                      STATUS_BADGE[row.status],
                    )}
                  >
                    {row.statusLabel}
                  </Badge>
                </TableCell>

                <TableCell className="py-2 pr-5">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`${table.editLabel}: ${row.name}`}
                      className="rounded-md text-slate-500"
                    >
                      <Pencil className="size-6" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`${table.moreLabel}: ${row.name}`}
                      className="rounded-md text-slate-500"
                    >
                      <Ellipsis className="size-6" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <div className="flex items-center justify-between gap-4 border-t border-gray-100 px-5 py-3.5">
        <p className="text-xs text-gray-500">
          แสดง 1–{rows.length} จาก {totalCount} รายการ
        </p>

        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="sm" className="rounded-md px-2.5">
            {pagination.previousLabel}
          </Button>

          {pagination.pages.map((page) => (
            <span
              key={page}
              aria-current={page === pagination.currentPage ? "page" : undefined}
              className={cn(
                "flex size-7 items-center justify-center rounded-md text-xs font-medium",
                page === pagination.currentPage
                  ? "bg-teal-600 text-white"
                  : "border border-zinc-200 bg-white text-gray-700",
              )}
            >
              {page}
            </span>
          ))}

          <Button variant="outline" size="sm" className="rounded-md px-2.5">
            {pagination.nextLabel}
          </Button>
        </div>
      </div>
    </Card>
  );
}
