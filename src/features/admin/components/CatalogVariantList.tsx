import { useState } from "react";

import { Layers, Pencil } from "lucide-react";

import { EmptyState } from "@/components/common";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

import { variantLabel } from "../catalog.format";
import type { CatalogProduct, CatalogVariant } from "../catalog.types";

import { VariantFormDialog } from "./VariantFormDialog";

type CatalogVariantListProps = {
  product: CatalogProduct;
  /** มาจาก `ProductDetail` — รวมตัวที่ปิดใช้งานแล้ว */
  variants: CatalogVariant[];
};

/**
 * แท็บ variant ของหน้าต่างแก้ไขสินค้า — ประกาศขายชี้มาที่ variant ไม่ใช่ที่สินค้า
 * สินค้าที่ยังไม่มี variant เลยจึงยังลงขายไม่ได้
 *
 * ไม่มีปุ่มลบ: backend ไม่มีการลบ variant (ประกาศและคำสั่งซื้อชี้อยู่) เลิกขายให้ปิดใช้งาน
 */
export function CatalogVariantList({
  product,
  variants,
}: CatalogVariantListProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CatalogVariant | undefined>();

  function openDialog(variant?: CatalogVariant) {
    setEditing(variant);
    setIsDialogOpen(true);
  }

  return (
    <div className="flex flex-col gap-4 px-6 pb-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          ภาษา + finish + edition + หมายเหตุการพิมพ์ ห้ามซ้ำกันในสินค้าเดียว
        </p>
        <Button
          size="sm"
          className="rounded-md px-2.5"
          onClick={() => openDialog()}
        >
          + เพิ่ม variant
        </Button>
      </div>

      {variants.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="ยังไม่มี variant"
          description="เพิ่มอย่างน้อยหนึ่ง variant ผู้ขายถึงจะเลือกการ์ดนี้ไปลงขายได้"
          className="min-h-60"
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Variant</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>บาร์โค้ด</TableHead>
                <TableHead className="w-24">สถานะ</TableHead>
                <TableHead className="w-12">
                  <span className="sr-only">แก้ไข</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {variants.map((variant) => (
                <TableRow
                  key={variant.id}
                  className={cn(!variant.active && "text-muted-foreground")}
                >
                  <TableCell className="font-medium">
                    {variantLabel(variant)}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {variant.sku}
                  </TableCell>
                  <TableCell className="text-xs">
                    {variant.barcode ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={variant.active ? "outline" : "secondary"}
                      className="rounded-full"
                    >
                      {variant.active ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`แก้ไข ${variantLabel(variant)}`}
                      onClick={() => openDialog(variant)}
                    >
                      <Pencil />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <VariantFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        product={product}
        variant={editing}
      />
    </div>
  );
}
