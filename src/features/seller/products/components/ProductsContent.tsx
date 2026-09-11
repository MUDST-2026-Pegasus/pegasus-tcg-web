import { useState } from "react";

import { Button } from "@/components/ui/button";

import type { ProductFilterId, ProductsData } from "../products.types";

import { ProductBulkBar } from "./ProductBulkBar";
import { ProductFilterBar } from "./ProductFilterBar";
import { ProductTable } from "./ProductTable";

type ProductsContentProps = {
  data: ProductsData;
};

export function ProductsContent({ data }: ProductsContentProps) {
  const [activeFilterId, setActiveFilterId] = useState<ProductFilterId>("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const activeFilter =
    data.filters.find((filter) => filter.id === activeFilterId) ??
    data.filters[0];

  const visibleRows =
    activeFilterId === "all"
      ? data.rows
      : data.rows.filter((row) => row.status === activeFilterId);

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
          <Button size="sm" className="rounded-md px-2.5">
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
      />
    </div>
  );
}
