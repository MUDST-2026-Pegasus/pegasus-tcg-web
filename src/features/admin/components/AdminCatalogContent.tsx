import { useEffect } from "react";

import { PackageSearch } from "lucide-react";
import { useSearchParams } from "react-router-dom";

import { EmptyState, QueryBoundary } from "@/components/common";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import {
  CATALOG_PAGE_SIZE,
  hasNarrowingFilters,
  readFilters,
  toProductQuery,
  writeFilters,
  type CatalogFilters,
  type FilterChanges,
} from "../catalog.filters";
import {
  formatCount,
  PRODUCT_SORT_LABEL,
  PRODUCT_SORTS,
  PRODUCT_TYPE_LABEL,
  PRODUCT_TYPES,
} from "../catalog.format";
import {
  useAdminGames,
  useAdminProducts,
  useCardSets,
  useCatalogCounts,
  useCategories,
} from "../catalog.queries";
import type { Game, ProductSort, ProductType } from "../catalog.types";

import { CatalogFilterPanel } from "./CatalogFilterPanel";
import { CatalogPagination } from "./CatalogPagination";
import { CatalogProductGrid } from "./CatalogProductGrid";
import {
  CatalogFilterPanelSkeleton,
  CatalogGridSkeleton,
} from "./CatalogSkeleton";
import { CatalogToolbar, type CatalogToolbarSelect } from "./CatalogToolbar";

const ALL = "all";

type UpdateFilters = (
  changes: FilterChanges,
  options?: { replace?: boolean },
) => void;

/**
 * หน้า "จัดการแคตตาล็อก" — ฐานข้อมูลการ์ดกลางที่ผู้ขายเลือกไปลงขาย
 * ตัวกรองทั้งหมดอยู่ใน URL (`catalog.filters.ts`) และกรอง/แบ่งหน้าที่ backend
 */
export function AdminCatalogContent() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = readFilters(searchParams);
  const games = useAdminGames();

  const updateFilters: UpdateFilters = (changes, options) =>
    setSearchParams((current) => writeFilters(current, changes), options);

  return (
    <div className="flex flex-col gap-6">
      {/* หัวหน้า: ชื่อหน้า + ปุ่มการทำงาน */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-[26px] leading-tight font-bold tracking-[-0.5px] text-foreground">
            จัดการแคตตาล็อก
          </h1>
          <p className="text-[13px] text-muted-foreground">
            ฐานข้อมูลการ์ดกลางของแพลตฟอร์ม · ผู้ขายเลือกการ์ดจากที่นี่เพื่อลงขาย
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* backend ยังไม่มี endpoint นำเข้า ปิดไว้พร้อมบอกเหตุผล */}
          <Tooltip>
            <TooltipTrigger render={<span className="inline-flex" />}>
              <Button variant="outline" className="rounded-md px-2.5" disabled>
                นำเข้า CSV
              </Button>
            </TooltipTrigger>
            <TooltipContent>ยังนำเข้าจากไฟล์ไม่ได้ในตอนนี้</TooltipContent>
          </Tooltip>
          <Button className="rounded-md px-2.5" disabled={!games.data?.length}>
            + เพิ่มการ์ดใหม่
          </Button>
        </div>
      </div>

      <QueryBoundary
        query={games}
        loading={
          <div className="flex flex-col items-start gap-6 lg:flex-row">
            <CatalogFilterPanelSkeleton />
            <div className="min-w-0 flex-1">
              <CatalogGridSkeleton />
            </div>
          </div>
        }
        errorTitle="โหลดรายชื่อเกมไม่สำเร็จ"
        isEmpty={(list) => list.length === 0}
        empty={
          <EmptyState
            title="ยังไม่มีเกมในระบบ"
            description="แคตตาล็อกแบ่งตามเกม ต้องมีเกมก่อนถึงจะเพิ่มการ์ดได้"
          />
        }
      >
        {(list) => (
          <CatalogWorkspace
            games={list}
            filters={filters}
            onFiltersChange={updateFilters}
          />
        )}
      </QueryBoundary>
    </div>
  );
}

function CatalogWorkspace({
  games,
  filters,
  onFiltersChange,
}: {
  games: Game[];
  filters: CatalogFilters;
  onFiltersChange: UpdateFilters;
}) {
  // URL ไม่ได้ระบุเกม หรือระบุเกมที่ไม่มีอยู่ → เกมแรกตามลำดับที่ backend เรียงมา
  const gameId = games.some((game) => game.id === filters.gameId)
    ? (filters.gameId as number)
    : games[0].id;

  const counts = useCatalogCounts(games.map((game) => game.id));
  const cardSets = useCardSets(gameId);
  const categories = useCategories(gameId);
  const products = useAdminProducts(toProductQuery(filters, gameId));

  const lastPage = Math.max(products.data?.totalPages ?? 1, 1);
  const hasPage = products.data !== undefined && !products.isPlaceholderData;

  // เปิดลิงก์เก่าที่เลขหน้าเกิน หรือของหายจนหน้าสุดท้ายว่าง — ถอยไปหน้าสุดท้ายที่มีจริง
  useEffect(() => {
    if (hasPage && filters.page > lastPage) {
      onFiltersChange({ page: lastPage }, { replace: true });
    }
  }, [hasPage, filters.page, lastPage, onFiltersChange]);

  const selects: CatalogToolbarSelect[] = [
    {
      id: "category",
      label: "หมวดหมู่",
      value: filters.categoryId === null ? ALL : String(filters.categoryId),
      options: [
        { value: ALL, label: "หมวดหมู่: ทั้งหมด" },
        ...(categories.data ?? []).map((category) => ({
          value: String(category.id),
          label: category.active
            ? category.name
            : `${category.name} (ปิดแล้ว)`,
        })),
      ],
      onValueChange: (value) =>
        onFiltersChange({ categoryId: value === ALL ? null : Number(value) }),
    },
    {
      id: "product-type",
      label: "ชนิดของสินค้า",
      value: filters.productType ?? ALL,
      options: [
        { value: ALL, label: "ชนิดของสินค้า: ทั้งหมด" },
        ...PRODUCT_TYPES.map((type) => ({
          value: type,
          label: PRODUCT_TYPE_LABEL[type],
        })),
      ],
      onValueChange: (value) =>
        onFiltersChange({
          productType: value === ALL ? null : (value as ProductType),
        }),
    },
    {
      id: "status",
      label: "สถานะ",
      value: filters.activeOnly ? "active" : ALL,
      options: [
        { value: ALL, label: "สถานะ: ทั้งหมด" },
        { value: "active", label: "เฉพาะที่เปิดใช้งาน" },
      ],
      onValueChange: (value) =>
        onFiltersChange({ activeOnly: value === "active" }),
    },
    {
      id: "sort",
      label: "เรียงตาม",
      value: filters.sort,
      options: PRODUCT_SORTS.map((sort) => ({
        value: sort,
        label: `เรียงตาม: ${PRODUCT_SORT_LABEL[sort]}`,
      })),
      onValueChange: (value) =>
        onFiltersChange({ sort: value as ProductSort }),
    },
  ];

  return (
    <div className="flex flex-col items-start gap-6 lg:flex-row">
      <CatalogFilterPanel
        games={games}
        activeGameId={gameId}
        onGameChange={(next) => onFiltersChange({ gameId: next })}
        counts={counts}
        cardSets={cardSets}
        activeSetId={filters.cardSetId}
        onSetChange={(next) => onFiltersChange({ cardSetId: next })}
      />

      <div className="flex w-full min-w-0 flex-1 flex-col gap-4">
        <CatalogToolbar
          resultLabel={resultLabel(products.data, filters.page)}
          search={filters.q}
          onSearchChange={(q) => onFiltersChange({ q })}
          selects={selects}
        />

        <QueryBoundary
          query={products}
          loading={<CatalogGridSkeleton />}
          errorTitle="โหลดสินค้าในแคตตาล็อกไม่สำเร็จ"
          isEmpty={(page) => page.items.length === 0}
          empty={
            hasNarrowingFilters(filters) ? (
              <EmptyState
                icon={PackageSearch}
                title="ไม่พบสินค้าที่ตรงกับตัวกรอง"
                description="ลองคำค้นอื่น หรือล้างตัวกรองแล้วดูทั้งหมดของเกมนี้"
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-md px-2.5"
                  onClick={() =>
                    onFiltersChange({
                      cardSetId: null,
                      categoryId: null,
                      productType: null,
                      activeOnly: false,
                      q: "",
                    })
                  }
                >
                  ล้างตัวกรอง
                </Button>
              </EmptyState>
            ) : (
              <EmptyState
                title="เกมนี้ยังไม่มีสินค้าในแคตตาล็อก"
                description="เพิ่มการ์ดใบแรกแล้วผู้ขายจะเลือกไปลงขายได้"
              />
            )
          }
        >
          {(page) => (
            <>
              <CatalogProductGrid
                products={page.items}
                isFetching={products.isPlaceholderData}
              />
              <CatalogPagination
                page={filters.page}
                totalPages={page.totalPages}
                disabled={products.isPlaceholderData}
                onPageChange={(next) => onFiltersChange({ page: next })}
              />
            </>
          )}
        </QueryBoundary>
      </div>
    </div>
  );
}

/** "แสดง 25–48 จาก 8,420 รายการ" */
function resultLabel(
  data: { items: unknown[]; totalItems: number } | undefined,
  page: number,
): string {
  if (data === undefined) {
    return "กำลังค้นหา…";
  }
  if (data.totalItems === 0) {
    return "ไม่พบสินค้า";
  }
  const from = (page - 1) * CATALOG_PAGE_SIZE + 1;
  const to = from + data.items.length - 1;
  return `แสดง ${formatCount(from)}–${formatCount(to)} จาก ${formatCount(data.totalItems)} รายการ`;
}
