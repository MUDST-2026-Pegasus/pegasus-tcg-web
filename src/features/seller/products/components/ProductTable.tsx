import { DataTable, type DataTableColumn } from "@/components/common";
import { useState, type ComponentProps, type ReactNode } from "react";

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
import { cn } from "@/lib/utils";

import { listingMeta } from "../products.format";
import { isLowStock } from "../products.rules";
import type { SellerListingSummary } from "../products.types";

import { ListingPriceCell } from "./ListingPriceCell";
import { ListingStatusCell } from "./ListingStatusCell";
import { useTranslate } from "@/lib/i18n";

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
        className="size-10 shrink-0 rounded-md bg-secondary object-cover"
      />
    );
  }
  return (
    <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-secondary">
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
  const { t } = useTranslate("seller");
  const allSelected = rows.length > 0 && selectedIds.length === rows.length;

  const columns: DataTableColumn<SellerListingSummary>[] = [
    {
      id: "select",
      header: () => (
        <Checkbox checked={allSelected} onCheckedChange={onToggleAll} aria-label={t("products.table.selectAll", "เลือกสินค้าทั้งหมดในหน้านี้")} className="size-3.5" />
      ),
      meta: { headClassName: cn(HEAD_CLASS, "w-8 pl-5"), cellClassName: "py-3 pl-5" },
      cell: ({ row: { original: row } }) => (
        <Checkbox
          checked={selectedIds.includes(row.id)}
          onCheckedChange={() => onToggleRow(row.id)}
          aria-label={t("products.table.select", "เลือกสินค้า: {name}", { name: row.card.productName })}
          className="size-3.5"
        />
      ),
    },
    {
      id: "product",
      header: t("products.table.product", "สินค้า"),
      meta: { headClassName: cn(HEAD_CLASS, "w-72"), cellClassName: "py-3" },
      cell: ({ row: { original: row } }) => (
        <div className="flex items-center gap-3">
          <ListingThumb listing={row} />
          <div className="flex min-w-0 flex-col gap-[3px]">
            <p className="truncate text-xs font-medium text-foreground">{row.card.productName}</p>
            <p className="truncate text-[10px] text-gray-400">{listingMeta(row)}</p>
          </div>
        </div>
      ),
    },
    {
      id: "price",
      header: t("products.table.price", "ราคาขาย"),
      meta: { headClassName: cn(HEAD_CLASS, "w-32"), cellClassName: "py-3" },
      cell: ({ row }) => <ListingPriceCell listing={row.original} readOnly={readOnly} />,
    },
    { id: "cost", header: t("products.table.averageCost", "ต้นทุนเฉลี่ย"), meta: { headClassName: cn(HEAD_CLASS, "w-28"), cellClassName: "py-3 text-xs text-gray-400" }, cell: () => "—" },
    {
      id: "available",
      header: t("products.table.available", "พร้อมขาย"),
      meta: { headClassName: cn(HEAD_CLASS, "w-28"), cellClassName: "py-3" },
      cell: ({ row: { original: row } }) => {
        const lowStock = isLowStock(row);
        return (
          <div className="flex items-center gap-2">
            <span className={cn("text-xs font-semibold", row.quantityAvailable === 0 ? "text-[#d0342c]" : lowStock ? "text-[#b45309]" : "text-foreground")}>
              {row.quantityAvailable}
            </span>
            <span className="text-[10px] text-gray-400">{t("products.unit.card", "ใบ")}</span>
            {lowStock ? <span className="text-[10px] font-medium text-[#b45309]">{t("products.table.lowStock", "ใกล้หมด")}</span> : null}
          </div>
        );
      },
    },
    {
      id: "reserved",
      header: t("products.table.reserved", "ติดจอง"),
      meta: { headClassName: cn(HEAD_CLASS, "w-20"), cellClassName: "py-3 text-xs" },
      cell: ({ row: { original: row } }) => <span className={row.quantityReserved > 0 ? "text-gray-700" : "text-gray-400"}>{row.quantityReserved}</span>,
    },
    {
      id: "status",
      header: t("products.table.status", "สถานะ"),
      meta: { headClassName: cn(HEAD_CLASS, "w-32"), cellClassName: "py-3" },
      cell: ({ row }) => <ListingStatusCell listing={row.original} readOnly={readOnly} />,
    },
    {
      // คอลัมน์ปุ่มท้ายแถวไม่มีหัวตารางในดีไซน์
      id: "actions",
      header: () => <span className="sr-only">{t("products.table.more", "ตัวเลือกเพิ่มเติม")}</span>,
      meta: { headClassName: cn(HEAD_CLASS, "pr-5"), cellClassName: "py-2 pr-5" },
      cell: ({ row: { original: row } }) => {
        const name = row.card.productName;
        return (
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={t("products.table.edit", "แก้ไขสินค้า: {name}", { name })}
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
                            aria-label={t("products.table.moreFor", "ตัวเลือกเพิ่มเติม: {name}", { name })}
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
                          {t("products.actions.restock", "เติมสต็อก")}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          disabled={readOnly}
                          onClick={() => onDeleteRow(row)}
                          className="rounded-lg text-xs"
                        >
                          <Trash2 />
                          {t("products.actions.delete", "ลบสินค้า")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
        );
      },
    },
  ];

  return (
    <Card className="w-full gap-0 rounded-xl border border-border p-0 shadow-none ring-0">
      <DataTable
        columns={columns}
        data={rows}
        getRowId={(row) => String(row.id)}
        aria-busy={isFetching}
        tableClassName={cn("transition-opacity", isFetching && "opacity-60")}
        headerRowClassName="border-y border-muted bg-neutral-50 hover:bg-neutral-50"
        bodyClassName="[&_tr]:border-muted"
        rowClassName={(row) => cn(selectedIds.includes(row.id) && "bg-gray-50")}
        rowProps={(row) => ({ "data-state": selectedIds.includes(row.id) ? "selected" : undefined } as ComponentProps<"tr">)}
      />

      {footer}
    </Card>
  );
}
