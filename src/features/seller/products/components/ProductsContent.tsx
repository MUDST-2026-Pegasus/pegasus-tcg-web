import { useEffect, useState } from "react";

import { PackageSearch } from "lucide-react";
import { useSearchParams } from "react-router-dom";

import { EmptyState, QueryBoundary } from "@/components/common";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { CreateListingButton } from "@/features/seller/shared/CreateListingButton";
import { usePublishPermission } from "@/features/seller/shared/seller.queries";

import { LISTING_STATUS_LABEL, listingErrorMessage } from "../products.format";
import {
  LISTING_STATUSES,
  useChangeListingStatus,
  useDeleteListing,
  useListingCounts,
  useMyListings,
} from "../products.queries";
import { canMoveTo } from "../products.rules";
import type { ListingStatus, SellerListingSummary } from "../products.types";

import { DeleteProductDialog } from "./DeleteProductDialog";
import { ProductBulkBar } from "./ProductBulkBar";
import { ProductFilterBar } from "./ProductFilterBar";
import { ProductPagination } from "./ProductPagination";
import { ProductTable } from "./ProductTable";
import { ProductTableSkeleton } from "./ProductTableSkeleton";

const PAGE_SIZE = 20;

const BULK_ACTIONS = [
  { id: "edit-price", label: "แก้ไขราคาพร้อมกัน" },
  { id: "restock", label: "เติมสต็อก" },
  { id: "unpublish", label: "ปิดการขาย" },
];

function readStatus(value: string | null): ListingStatus | undefined {
  return LISTING_STATUSES.find((status) => status === value);
}

/** หน้าใน URL เริ่มที่ 1 ให้คนอ่านรู้เรื่อง — backend เริ่มที่ 0 */
function readPage(value: string | null): number {
  const page = Number(value);
  return Number.isSafeInteger(page) && page >= 1 ? page : 1;
}

/**
 * หน้าจัดการสินค้า — ตัวกรองสถานะกับเลขหน้าอยู่ใน URL (`?status=ACTIVE&page=2`)
 * แชร์ลิงก์หรือกด back แล้วได้หน้าเดิม และทุกอย่างกรอง/แบ่งหน้าที่ backend
 */
export function ProductsContent() {
  const [searchParams, setSearchParams] = useSearchParams();
  const status = readStatus(searchParams.get("status"));
  const page = readPage(searchParams.get("page"));

  const listings = useMyListings({ status, page: page - 1, size: PAGE_SIZE });
  const counts = useListingCounts();
  const { canPublish } = usePublishPermission();
  const changeStatus = useChangeListingStatus();
  const deleteListing = useDeleteListing();

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<SellerListingSummary | null>(
    null,
  );
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const rows = listings.data?.items ?? [];
  const totalPages = listings.data?.totalPages ?? 0;

  // ลบแถวสุดท้ายของหน้าสุดท้ายแล้วหน้านั้นหายไป — ถอยกลับไปหน้าสุดท้ายที่ยังมีของ
  useEffect(() => {
    if (!listings.isPlaceholderData && totalPages > 0 && page > totalPages) {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);
          next.set("page", String(totalPages));
          return next;
        },
        { replace: true },
      );
    }
  }, [listings.isPlaceholderData, page, totalPages, setSearchParams]);

  function updateParams(changes: {
    status?: ListingStatus | null;
    page?: number;
  }) {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      if (changes.status !== undefined) {
        if (changes.status === null) next.delete("status");
        else next.set("status", changes.status);
        next.delete("page");
      }
      if (changes.page !== undefined) {
        if (changes.page <= 1) next.delete("page");
        else next.set("page", String(changes.page));
      }
      return next;
    });
    // ล้างการเลือกเมื่อเปลี่ยนตัวกรองหรือหน้า กันสับสนว่ามีของที่เลือกไว้แต่มองไม่เห็น
    setSelectedIds([]);
  }

  function handleRequestDelete(row: SellerListingSummary) {
    setDeleteTarget(row);
    setIsDeleteOpen(true);
  }

  function handleConfirmDelete() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    deleteListing.mutate(target.id, {
      onSuccess: () => {
        setSelectedIds((current) => current.filter((id) => id !== target.id));
        setIsDeleteOpen(false);
        toast.add({ type: "success", title: "ลบประกาศแล้ว" });
      },
      onError: (error) =>
        toast.add({
          type: "error",
          title: "ลบประกาศไม่สำเร็จ",
          description: listingErrorMessage(error, "ลองใหม่อีกครั้ง"),
        }),
    });
  }

  /** พักการขาย = ผู้ซื้อไม่เห็นประกาศ แต่ของยังอยู่ครบ เปิดขายต่อได้ทุกเมื่อ */
  function handleUnpublish() {
    if (!deleteTarget) return;
    changeStatus.mutate(
      { id: deleteTarget.id, status: "PAUSED" },
      {
        onSuccess: () => {
          setIsDeleteOpen(false);
          toast.add({ type: "success", title: "พักการขายแล้ว" });
        },
        onError: (error) =>
          toast.add({
            type: "error",
            title: "พักการขายไม่สำเร็จ",
            description: listingErrorMessage(error, "ลองใหม่อีกครั้ง"),
          }),
      },
    );
  }

  function handleToggleRow(id: number) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((selectedId) => selectedId !== id)
        : [...current, id],
    );
  }

  function handleToggleAll() {
    setSelectedIds((current) =>
      current.length === rows.length ? [] : rows.map((row) => row.id),
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-zinc-950">จัดการสินค้า</h1>
          <p className="text-xs text-gray-500">
            {counts.isPending
              ? "กำลังนับประกาศ…"
              : `ประกาศทั้งหมด ${counts.total} รายการ · พร้อมขาย ${counts.counts.ACTIVE} · หมดสต็อก ${counts.counts.SOLD_OUT} · ฉบับร่าง ${counts.counts.DRAFT}`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="rounded-md px-2.5">
            นำเข้า CSV
          </Button>
          <CreateListingButton label="+ ลงขายสินค้าใหม่" />
        </div>
      </div>

      <ProductFilterBar
        counts={counts}
        activeStatus={status}
        onStatusChange={(next) => updateParams({ status: next ?? null })}
      />

      {selectedIds.length > 0 ? (
        <ProductBulkBar
          selectedCount={selectedIds.length}
          actions={BULK_ACTIONS}
          onClear={() => setSelectedIds([])}
        />
      ) : null}

      <QueryBoundary
        query={listings}
        loading={<ProductTableSkeleton />}
        errorTitle="โหลดรายการสินค้าไม่สำเร็จ"
        isEmpty={(page) => page.items.length === 0}
        empty={
          status ? (
            <EmptyState
              icon={PackageSearch}
              title={`ไม่มีประกาศที่${LISTING_STATUS_LABEL[status]}`}
              description="ลองเลือกสถานะอื่น หรือดูทั้งหมด"
            >
              <Button
                variant="outline"
                size="sm"
                className="rounded-md px-2.5"
                onClick={() => updateParams({ status: null })}
              >
                ดูทั้งหมด
              </Button>
            </EmptyState>
          ) : (
            <EmptyState
              title="ยังไม่มีประกาศขาย"
              description="ลงขายการ์ดใบแรกแล้วประกาศจะขึ้นที่นี่"
            >
              <CreateListingButton label="+ ลงขายสินค้าใหม่" />
            </EmptyState>
          )
        }
      >
        {(data) => (
          <ProductTable
            rows={data.items}
            selectedIds={selectedIds}
            onToggleRow={handleToggleRow}
            onToggleAll={handleToggleAll}
            onDeleteRow={handleRequestDelete}
            readOnly={!canPublish}
            isFetching={listings.isPlaceholderData}
            footer={
              <ProductPagination
                page={page}
                totalPages={data.totalPages}
                totalItems={data.totalItems}
                pageSize={PAGE_SIZE}
                rowsOnPage={data.items.length}
                disabled={listings.isPlaceholderData}
                onPageChange={(next) => updateParams({ page: next })}
              />
            }
          />
        )}
      </QueryBoundary>

      <DeleteProductDialog
        listing={deleteTarget}
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onUnpublish={
          deleteTarget && canMoveTo(deleteTarget, "PAUSED")
            ? handleUnpublish
            : undefined
        }
        onConfirm={handleConfirmDelete}
        isPending={deleteListing.isPending || changeStatus.isPending}
      />
    </div>
  );
}
