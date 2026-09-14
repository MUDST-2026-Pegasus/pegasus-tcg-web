import { useState } from "react";

import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";

import type {
  ProductFilterId,
  ProductRow,
  ProductsData,
} from "../products.types";

import { DeleteProductDialog } from "./DeleteProductDialog";
import { ProductBulkBar } from "./ProductBulkBar";
import { ProductFilterBar } from "./ProductFilterBar";
import { ProductTable } from "./ProductTable";

type ProductsContentProps = {
  data: ProductsData;
};

export function ProductsContent({ data }: ProductsContentProps) {
  const [rows, setRows] = useState<ProductRow[]>(data.rows);
  const [activeFilterId, setActiveFilterId] = useState<ProductFilterId>("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<ProductRow | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const activeFilter =
    data.filters.find((filter) => filter.id === activeFilterId) ??
    data.filters[0];

  const visibleRows =
    activeFilterId === "all"
      ? rows
      : rows.filter((row) => row.status === activeFilterId);

  function handleRequestDelete(row: ProductRow) {
    setDeleteTarget(row);
    setIsDeleteOpen(true);
  }

  /**
   * ยังไม่มี endpoint ลบ/ปิดการขาย — ตอนนี้แก้แค่รายการในหน้าจอ
   * วันที่ต่อ API ให้ยิงคำขอก่อน สำเร็จแล้วค่อยอัปเดตแถวแบบเดียวกันนี้
   */
  function handleConfirmDelete() {
    if (!deleteTarget) return;
    setRows((current) => current.filter((row) => row.id !== deleteTarget.id));
    setSelectedIds((current) =>
      current.filter((selectedId) => selectedId !== deleteTarget.id),
    );
    setIsDeleteOpen(false);
  }

  /** ปิดการขาย = ผู้ซื้อไม่เห็นประกาศ แต่ยังเก็บสินค้าไว้ — ตอนนี้ใช้สถานะ "ฉบับร่าง" แทน */
  function handleUnpublish() {
    if (!deleteTarget) return;
    const draftLabel =
      data.filters.find((filter) => filter.id === "draft")?.label ?? "";
    setRows((current) =>
      current.map((row) =>
        row.id === deleteTarget.id
          ? { ...row, status: "draft", statusLabel: draftLabel }
          : row,
      ),
    );
    setIsDeleteOpen(false);
  }

  /** ล้างการเลือกด้วยเมื่อสลับตัวกรอง กันสับสนว่ามีของที่เลือกไว้แต่มองไม่เห็น */
  function handleFilterChange(id: ProductFilterId) {
    setActiveFilterId(id);
    setSelectedIds([]);
  }

  function handleToggleRow(id: string) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((selectedId) => selectedId !== id)
        : [...current, id],
    );
  }

  function handleToggleAll() {
    setSelectedIds((current) =>
      current.length === visibleRows.length
        ? []
        : visibleRows.map((row) => row.id),
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-zinc-950">{data.title}</h1>
          <p className="text-xs text-gray-500">{data.subtitle}</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="rounded-md px-2.5">
            {data.actions.importLabel}
          </Button>
          <Button
            size="sm"
            className="rounded-md px-2.5"
            render={<Link to="/seller/products/new" />}
            nativeButton={false}
          >
            {data.actions.createLabel}
          </Button>
        </div>
      </div>

      <ProductFilterBar
        filters={data.filters}
        activeFilterId={activeFilterId}
        onFilterChange={handleFilterChange}
        toolbar={data.toolbar}
      />

      {selectedIds.length > 0 ? (
        <ProductBulkBar
          selectedCount={selectedIds.length}
          actions={data.bulkActions}
          onClear={() => setSelectedIds([])}
        />
      ) : null}

      <ProductTable
        table={data.table}
        pagination={data.pagination}
        rows={visibleRows}
        totalCount={activeFilter.count}
        selectedIds={selectedIds}
        onToggleRow={handleToggleRow}
        onToggleAll={handleToggleAll}
        onDeleteRow={handleRequestDelete}
      />

      <DeleteProductDialog
        {...data.deleteDialog}
        product={deleteTarget}
        unit={data.table.stockUnit}
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onUnpublish={handleUnpublish}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
