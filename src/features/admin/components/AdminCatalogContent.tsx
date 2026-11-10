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
  readProductTab,
  readProductTarget,
  toProductQuery,
  writeFilters,
  writeProductTarget,
  type CatalogFilters,
  type FilterChanges,
  type ProductTab,
  type ProductTarget,
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
import type {
  AdminSaleStatus,
  Game,
  ProductSort,
  ProductType,
} from "../catalog.types";

import { CatalogFilterPanel } from "./CatalogFilterPanel";
import { CatalogPagination } from "./CatalogPagination";
import { CatalogProductGrid } from "./CatalogProductGrid";
import { CatalogProductSheet } from "./CatalogProductSheet";
import {
  CatalogFilterPanelSkeleton,
  CatalogGridSkeleton,
} from "./CatalogSkeleton";
import { CatalogToolbar, type CatalogToolbarSelect } from "./CatalogToolbar";
import { useTranslate } from "@/lib/i18n";

const ALL = "all";

type UpdateFilters = (
  changes: FilterChanges,
  options?: { replace?: boolean },
) => void;

type OpenProduct = (
  target: ProductTarget | null,
  tab?: ProductTab,
  options?: { replace?: boolean },
) => void;

/**
 * หน้า "จัดการแคตตาล็อก" — ฐานข้อมูลการ์ดกลางที่ผู้ขายเลือกไปลงขาย
 * ตัวกรองทั้งหมดอยู่ใน URL (`catalog.filters.ts`) และกรอง/แบ่งหน้าที่ backend
 * หน้าต่างเพิ่ม/แก้สินค้าก็เปิดจาก URL (`?product=new`, `?product=<id>`)
 */
export function AdminCatalogContent() {
  const { t } = useTranslate("admin");
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = readFilters(searchParams);
  const target = readProductTarget(searchParams);
  const tab = readProductTab(searchParams);
  const games = useAdminGames();

  const updateFilters: UpdateFilters = (changes, options) =>
    setSearchParams((current) => writeFilters(current, changes), options);

  const openProduct: OpenProduct = (next, nextTab, options) =>
    setSearchParams(
      (current) => writeProductTarget(current, next, nextTab),
      options,
    );

  return (
    <div className="flex flex-col gap-6">
      {/* หัวหน้า: ชื่อหน้า + ปุ่มการทำงาน */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-[26px] leading-tight font-bold tracking-[-0.5px] text-foreground">
            {t("catalog.page.title", "จัดการแคตตาล็อก")}
          </h1>
          <p className="text-[13px] text-muted-foreground">
            {t("catalog.page.subtitle", "ฐานข้อมูลการ์ดกลางของแพลตฟอร์ม · ผู้ขายเลือกการ์ดจากที่นี่เพื่อลงขาย")}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* backend ยังไม่มี endpoint นำเข้า ปิดไว้พร้อมบอกเหตุผล */}
          <Tooltip>
            <TooltipTrigger render={<span className="inline-flex" />}>
              <Button variant="outline" className="rounded-md px-2.5" disabled>
                {t("catalog.page.importCsv", "นำเข้า CSV")}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("catalog.page.importUnavailable", "ยังนำเข้าจากไฟล์ไม่ได้ในตอนนี้")}</TooltipContent>
          </Tooltip>
          <Button
            className="rounded-md px-2.5"
            disabled={!games.data?.length}
            onClick={() => openProduct("new")}
          >
            {t("catalog.page.addProduct", "+ เพิ่มการ์ดใหม่")}
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
        errorTitle={t("cardAttributes.games.loadFailed", "โหลดรายชื่อเกมไม่สำเร็จ")}
        isEmpty={(list) => list.length === 0}
        empty={
          <EmptyState
            title={t("cardAttributes.games.emptyTitle", "ยังไม่มีเกมในระบบ")}
            description={t("catalog.page.noGamesDescription", "แคตตาล็อกแบ่งตามเกม ต้องมีเกมก่อนถึงจะเพิ่มการ์ดได้")}
          />
        }
      >
        {(list) => (
          <CatalogWorkspace
            games={list}
            filters={filters}
            onFiltersChange={updateFilters}
            target={target}
            tab={tab}
            onOpenProduct={openProduct}
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
  target,
  tab,
  onOpenProduct,
}: {
  games: Game[];
  filters: CatalogFilters;
  onFiltersChange: UpdateFilters;
  target: ProductTarget | null;
  tab: ProductTab;
  onOpenProduct: OpenProduct;
}) {
  const { t } = useTranslate("admin");
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
      label: t("catalog.filters.category", "หมวดหมู่"),
      value: filters.categoryId === null ? ALL : String(filters.categoryId),
      options: [
        { value: ALL, label: t("catalog.filters.categoryAll", "หมวดหมู่: ทั้งหมด") },
        ...(categories.data ?? []).map((category) => ({
          value: String(category.id),
          label: category.active
            ? category.name
            : t("catalog.filters.closedItem", "{name} (ปิดแล้ว)", { name: category.name }),
        })),
      ],
      onValueChange: (value) =>
        onFiltersChange({ categoryId: value === ALL ? null : Number(value) }),
    },
    {
      id: "product-type",
      label: t("catalog.filters.type", "ชนิดของสินค้า"),
      value: filters.productType ?? ALL,
      options: [
        { value: ALL, label: t("catalog.filters.typeAll", "ชนิดของสินค้า: ทั้งหมด") },
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
      label: t("catalog.filters.status", "สถานะ"),
      value: filters.activeOnly ? "active" : ALL,
      options: [
        { value: ALL, label: t("catalog.filters.statusAll", "สถานะ: ทั้งหมด") },
        { value: "active", label: t("catalog.filters.activeOnly", "เฉพาะที่เปิดใช้งาน") },
      ],
      onValueChange: (value) =>
        onFiltersChange({ activeOnly: value === "active" }),
    },
    {
      id: "sale-status",
      label: t("catalog.filters.saleStatus", "สถานะการขาย"),
      value: filters.saleStatus ?? ALL,
      options: [
        { value: ALL, label: t("catalog.filters.saleStatusAll", "สถานะการขาย: ทั้งหมด") },
        { value: "HAS_SELLER", label: t("catalog.filters.hasSeller", "มีร้านขาย") },
        { value: "NO_SELLER", label: t("catalog.filters.noSeller", "ไม่มีร้านขาย") },
        { value: "HAS_BLOCKED", label: t("catalog.filters.hasBlocked", "มีประกาศถูกระงับ") },
      ],
      onValueChange: (value) =>
        onFiltersChange({
          saleStatus: value === ALL ? null : (value as AdminSaleStatus),
        }),
    },
    {
      id: "sort",
      label: t("catalog.filters.sort", "เรียงตาม"),
      value: filters.sort,
      options: PRODUCT_SORTS.map((sort) => ({
        value: sort,
        label: t("catalog.filters.sortItem", "เรียงตาม: {sort}", { sort: PRODUCT_SORT_LABEL[sort] }),
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
          resultLabel={resultLabel(products.data, filters.page, t)}
          search={filters.q}
          onSearchChange={(q) => onFiltersChange({ q })}
          selects={selects}
        />

        <QueryBoundary
          query={products}
          loading={<CatalogGridSkeleton />}
          errorTitle={t("catalog.products.loadFailed", "โหลดสินค้าในแคตตาล็อกไม่สำเร็จ")}
          isEmpty={(page) => page.items.length === 0}
          empty={
            hasNarrowingFilters(filters) ? (
              <EmptyState
                icon={PackageSearch}
                title={t("catalog.products.noMatchTitle", "ไม่พบสินค้าที่ตรงกับตัวกรอง")}
                description={t("catalog.products.noMatchDescription", "ลองคำค้นอื่น หรือล้างตัวกรองแล้วดูทั้งหมดของเกมนี้")}
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
                  {t("catalog.filters.clear", "ล้างตัวกรอง")}
                </Button>
              </EmptyState>
            ) : (
              <EmptyState
                title={t("catalog.products.emptyTitle", "เกมนี้ยังไม่มีสินค้าในแคตตาล็อก")}
                description={t("catalog.products.emptyDescription", "เพิ่มการ์ดใบแรกแล้วผู้ขายจะเลือกไปลงขายได้")}
              >
                <Button
                  size="sm"
                  className="rounded-md px-2.5"
                  onClick={() => onOpenProduct("new")}
                >
                  {t("catalog.page.addProduct", "+ เพิ่มการ์ดใหม่")}
                </Button>
              </EmptyState>
            )
          }
        >
          {(page) => (
            <>
              <CatalogProductGrid
                products={page.items}
                isFetching={products.isPlaceholderData}
                onSelect={(product) => onOpenProduct(product.id)}
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

      <CatalogProductSheet
        target={target}
        tab={tab}
        onTabChange={(next) =>
          target !== null && onOpenProduct(target, next, { replace: true })
        }
        games={games}
        defaultGameId={gameId}
        // แทนที่ `?product=new` ไม่ให้กด back แล้วกลับไปเจอฟอร์มเปล่า
        // และพาไปแท็บ variant ต่อ เพราะสินค้าที่ไม่มี variant ยังลงขายไม่ได้
        onCreated={(product) =>
          onOpenProduct(product.id, "variants", { replace: true })
        }
        onClose={() => onOpenProduct(null)}
      />
    </div>
  );
}

/** "แสดง 25–48 จาก 8,420 รายการ" */
function resultLabel(
  data: { items: unknown[]; totalItems: number } | undefined,
  page: number,
  translate: ReturnType<typeof useTranslate<"admin">>["t"],
): string {
  if (data === undefined) {
    return translate("catalog.products.searching", "กำลังค้นหา…");
  }
  if (data.totalItems === 0) {
    return translate("catalog.products.none", "ไม่พบสินค้า");
  }
  const from = (page - 1) * CATALOG_PAGE_SIZE + 1;
  const to = from + data.items.length - 1;
  return translate("catalog.products.range", "แสดง {from}–{to} จาก {total} รายการ", { from: formatCount(from), to: formatCount(to), total: formatCount(data.totalItems) });
}

// @tolgee-key {"key": "catalog.products.searching", "ns": "admin", "defaultValue": "กำลังค้นหา…"}
// @tolgee-key {"key": "catalog.products.none", "ns": "admin", "defaultValue": "ไม่พบสินค้า"}
// @tolgee-key {"key": "catalog.products.range", "ns": "admin", "defaultValue": "แสดง {from}–{to} จาก {total} รายการ"}
