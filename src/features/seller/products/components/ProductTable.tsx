import { useState, type ReactNode } from "react";

import { Ellipsis, ImageIcon, PackagePlus, Pencil, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

import { listingMeta } from "../products.format";
import { isLowStock } from "../products.rules";
import type { SellerListingSummary } from "../products.types";

import { ListingPriceCell } from "./ListingPriceCell";
import { ListingStatusCell } from "./ListingStatusCell";

const HEAD_CLASS = "h-auto py-2.5 text-xs font-medium text-gray-500";

/**
 * รูปแรกของประกาศ ถ้าไม่มีใช้รูปทางการจากแคตตาล็อก
 * ทั้งคู่เป็น presigned URL อายุสั้น — โหลดไม่ขึ้น (หมดอายุ) ให้กลับไปใช้กรอบว่างแทนรูปแตก
 */
export function ListingThumb({ listing }: { listing: SellerListingSummary }) {
  const src = listing.primaryPhotoUrl ?? listing.card.officialImageUrl;
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (src && src !== failedSrc) {
    return (
      <img
        src={src}
        alt=""
        onError={() => setFailedSrc(src)}
        className="size-10 shrink-0 rounded-md bg-gray-100 object-cover"
      />
    );
  }
  return (
    <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-gray-100">
      <ImageIcon aria-hidden="true" className="size-4 text-gray-400" />
    </div>
  );
}

type ProductTableProps = {
  rows: SellerListingSummary[];
  selectedIds: number[];
  onToggleRow: (id: number) => void;
  onToggleAll: () => void;
  onDeleteRow: (row: SellerListingSummary) => void;
  /** ร้านยังแก้ประกาศไม่ได้ (`canPublish = false`) — ปุ่มที่เขียนข้อมูลถูกปิด */
  readOnly: boolean;
  /** กำลังดึงหน้าใหม่ แถวที่เห็นเป็นของเดิม — จางลงให้รู้ว่ากำลังโหลด */
  isFetching: boolean;
  /** แถบแบ่งหน้าท้ายตาราง */
  footer: ReactNode;
};

/**
 * ตารางประกาศขาย
 *
 * หมายเหตุ: ในดีไซน์ตารางเป็น flex กำหนดความกว้างคอลัมน์ตายตัว และทุกแถว
 * พื้นหลังเทาอ่อนเท่ากันหมด ที่นี่ใช้ <table> จริงเพื่อให้ screen reader
 * อ่านหัวคอลัมน์ได้ และให้พื้นเทาอ่อนเฉพาะแถวที่ถูกเลือก — แถวที่ไม่ได้เลือก
 * เป็นพื้นขาวคั่นด้วยเส้น ตรงกับที่ดีไซน์ตั้งใจสื่อเรื่องสถานะการเลือก
 *
 * คอลัมน์ "ขายแล้ว" ในดีไซน์ไม่มีที่มาใน `SellerListingSummaryResponse` จึงแสดง
 * "ติดจอง" (`quantityReserved`) แทน ซึ่งเป็นตัวที่บอกว่าลบประกาศได้หรือยัง
 * ส่วน "ต้นทุนเฉลี่ย" รอ SLR-04 ต่อกับคลัง ระหว่างนี้เป็น "—"
 */
export function ProductTable({
  rows,
  selectedIds,
  onToggleRow,
  onToggleAll,
  onDeleteRow,
  readOnly,
  isFetching,
  footer,
}: ProductTableProps) {
  const allSelected = rows.length > 0 && selectedIds.length === rows.length;

  return (
    <Card className="w-full gap-0 rounded-xl border border-border p-0 shadow-none ring-0">
      <Table
        aria-busy={isFetching}
        className={cn("transition-opacity", isFetching && "opacity-60")}
      >
        <TableHeader>
          <TableRow className="border-y border-gray-100 bg-neutral-50 hover:bg-neutral-50">
            <TableHead className={cn(HEAD_CLASS, "w-8 pl-5")}>
              <Checkbox
                checked={allSelected}
                onCheckedChange={onToggleAll}
                aria-label="เลือกสินค้าทั้งหมดในหน้านี้"
                className="size-3.5"
              />
            </TableHead>
            <TableHead className={cn(HEAD_CLASS, "w-72")}>สินค้า</TableHead>
            <TableHead className={cn(HEAD_CLASS, "w-32")}>ราคาขาย</TableHead>
            <TableHead className={cn(HEAD_CLASS, "w-28")}>
              ต้นทุนเฉลี่ย
            </TableHead>
            <TableHead className={cn(HEAD_CLASS, "w-28")}>พร้อมขาย</TableHead>
            <TableHead className={cn(HEAD_CLASS, "w-20")}>ติดจอง</TableHead>
            <TableHead className={cn(HEAD_CLASS, "w-32")}>สถานะ</TableHead>
            {/* คอลัมน์ปุ่มท้ายแถวไม่มีหัวตารางในดีไซน์ */}
            <TableHead className={cn(HEAD_CLASS, "pr-5")}>
              <span className="sr-only">ตัวเลือกเพิ่มเติม</span>
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody className="[&_tr]:border-gray-100">
          {rows.map((row) => {
            const isSelected = selectedIds.includes(row.id);
            const name = row.card.productName;
            const lowStock = isLowStock(row);

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
                    aria-label={`เลือกสินค้า: ${name}`}
                    className="size-3.5"
                  />
                </TableCell>

                <TableCell className="py-3">
                  <div className="flex items-center gap-3">
                    <ListingThumb listing={row} />
                    <div className="flex min-w-0 flex-col gap-[3px]">
                      <p className="truncate text-xs font-medium text-zinc-950">
                        {name}
                      </p>
                      <p className="truncate text-[10px] text-gray-400">
                        {listingMeta(row)}
                      </p>
                    </div>
                  </div>
                </TableCell>

                <TableCell className="py-3">
                  <ListingPriceCell listing={row} readOnly={readOnly} />
                </TableCell>

                <TableCell className="py-3 text-xs text-gray-400">—</TableCell>

                <TableCell className="py-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-xs font-semibold",
                        row.quantityAvailable === 0
                          ? "text-[#d0342c]"
                          : lowStock
                            ? "text-[#b45309]"
                            : "text-zinc-950",
                      )}
                    >
                      {row.quantityAvailable}
                    </span>
                    <span className="text-[10px] text-gray-400">ใบ</span>
                    {lowStock ? (
                      <span className="text-[10px] font-medium text-[#b45309]">
                        ใกล้หมด
                      </span>
                    ) : null}
                  </div>
                </TableCell>

                <TableCell
                  className={cn(
                    "py-3 text-xs",
                    row.quantityReserved > 0
                      ? "text-gray-700"
                      : "text-gray-400",
                  )}
                >
                  {row.quantityReserved}
                </TableCell>

                <TableCell className="py-3">
                  <ListingStatusCell listing={row} readOnly={readOnly} />
                </TableCell>

                <TableCell className="py-2 pr-5">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`แก้ไขสินค้า: ${name}`}
                      className="rounded-md text-slate-500"
                      render={<Link to={`/seller/products/${row.id}/edit`} />}
                      nativeButton={false}
                    >
                      <Pencil className="size-6" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`ตัวเลือกเพิ่มเติม: ${name}`}
                            className="rounded-md text-slate-500"
                          />
                        }
                      >
                        <Ellipsis className="size-6" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-auto rounded-xl"
                      >
                        <DropdownMenuItem
                          render={
                            <Link to={`/seller/products/${row.id}/restock`} />
                          }
                          className="rounded-lg text-xs"
                        >
                          <PackagePlus />
                          เติมสต็อก
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          disabled={readOnly}
                          onClick={() => onDeleteRow(row)}
                          className="rounded-lg text-xs"
                        >
                          <Trash2 />
                          ลบสินค้า
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {footer}
    </Card>
  );
}
