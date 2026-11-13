import { useEffect, useState } from "react";

import { ChevronDown, ChevronUp, ExternalLink, Store } from "lucide-react";
import { Link } from "react-router-dom";

import { EmptyState, QueryBoundary, DataTable, type DataTableColumn } from "@/components/common";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { LISTING_STATUS_BADGE } from "@/features/seller/products/products.format";
import { cn } from "@/lib/utils";

import {
  LISTING_STATUS_FILTERS,
  LISTING_STATUS_LABEL,
  closedShopLabel,
  hasPublicPage,
  listingConditionLabel,
  shopInitials,
} from "../card-listings.format";
import { CARD_LISTINGS_FIRST_PAGE } from "../catalog.filters";
import { formatBaht, formatCount, variantLabel } from "../catalog.format";
import { useCardListings } from "../catalog.queries";
import type {
  AdminCardListing,
  AdminCardListingSummary,
  CatalogVariant,
  ListingStatus,
} from "../catalog.types";
import { formatThaiDate } from "../users.format";

import { CatalogPagination } from "./CatalogPagination";
import { ListingBlockDialog } from "./ListingBlockDialog";
import { useTranslate } from "@/lib/i18n";

const ALL = "all";
const SEARCH_DELAY_MS = 350;

type CatalogListingsTabProps = {
  productId: number;
  /** บอกใน dialog ว่ากำลังระงับการ์ดใบไหน */
  productName: string;
  /** มาจาก `ProductDetail` — ใช้ทำชื่อ variant และตัวกรอง */
  variants: CatalogVariant[];
};

type BlockTarget = { listing: AdminCardListing; action: "block" | "unblock" };

/**
 * แท็บ "ร้านที่ขาย" — การ์ดใบนี้มีร้านไหนขาย เหลือเท่าไหร่ และระงับการขายรายประกาศ
 * ตัวกรองอยู่ในแท็บ ไม่อยู่ใน URL เพราะหายไปพร้อมหน้าต่างอยู่แล้ว
 */
export function CatalogListingsTab({
  productId,
  productName,
  variants,
}: CatalogListingsTabProps) {
  const { t } = useTranslate("admin");
  const [searchText, setSearchText] = useState("");
  const [search, setSearch] = useState("");
  const [variantId, setVariantId] = useState<number | null>(null);
  const [status, setStatus] = useState<ListingStatus | null>(null);
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<number | null>(null);
  const [blockTarget, setBlockTarget] = useState<BlockTarget | null>(null);

  // พิมพ์ค้างไว้ครู่หนึ่งค่อยค้น ไม่ยิงทุกตัวอักษร
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchText.trim());
      setPage(1);
    }, SEARCH_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [searchText]);

  const listings = useCardListings(productId, {
    ...CARD_LISTINGS_FIRST_PAGE,
    q: search || undefined,
    variantId: variantId ?? undefined,
    status: status ?? undefined,
    page: page - 1,
  });

  const hasFilters = search !== "" || variantId !== null || status !== null;
  const variantName = (id: number) => {
    const variant = variants.find((candidate) => candidate.id === id);
    return variant ? variantLabel(variant) : "—";
  };

  function clearFilters() {
    setSearchText("");
    setSearch("");
    setVariantId(null);
    setStatus(null);
    setPage(1);
  }

  const variantOptions = [
    { value: ALL, label: t("catalog.listings.filters.variantAll", "Variant: ทั้งหมด") },
    ...variants.map((variant) => ({
      value: String(variant.id),
      label: variantLabel(variant),
    })),
  ];
  const statusOptions = [
    { value: ALL, label: t("catalog.filters.statusAll", "สถานะ: ทั้งหมด") },
    ...LISTING_STATUS_FILTERS.map((value) => ({
      value,
      label: LISTING_STATUS_LABEL[value],
    })),
  ];

  const listingColumns: DataTableColumn<AdminCardListing>[] = [
    {
      id: "col0",
      header: t("catalog.listings.col.shop", "ร้าน"),
      cell: ({ row: { original: listing } }) => {
          const { seller } = listing;
          const closedShop = closedShopLabel(listing);
          return (
          <>
        <div className="flex items-center gap-2">
          <Avatar className="size-8 shrink-0">
            {seller.avatarUrl && <AvatarImage src={seller.avatarUrl} alt="" />}
            <AvatarFallback className="text-xs">
              {shopInitials(seller.username)}
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-[13px] font-semibold">
              {seller.username}
            </span>
            <span
              className={cn(
                "truncate text-[11px]",
                closedShop ? "text-rose-700" : "text-muted-foreground",
              )}
            >
              {closedShop ?? seller.displayName ?? "—"}
            </span>
          </div>
        </div>
          </>
          );
      },
    },
    {
      id: "col1",
      header: t("catalog.listings.col.variant", "Variant / สภาพ"),
      cell: ({ row: { original: listing } }) => {
          const variantLabel = variantName(listing.catalogVariantId);
          return (
          <>
        <div className="flex flex-col">
          <span className="text-xs font-medium whitespace-normal">
            {variantLabel}
          </span>
          <span className="text-[11px] text-muted-foreground">
            {listingConditionLabel(listing)}
          </span>
        </div>
          </>
          );
      },
    },
    {
      id: "col2",
      header: t("catalog.listings.col.price", "ราคา"), meta: { headClassName: "text-right", cellClassName: "text-right" },
      cell: ({ row: { original: listing } }) => {
          
          return (
          <>
        <div className="flex flex-col items-end">
          <span className="text-[13px] font-semibold">
            {formatBaht(listing.salePrice ?? listing.price)}
          </span>
          <span className="text-[11px] text-muted-foreground">
            {listing.salePrice !== null
              ? t("catalog.listings.saleFrom", "ลดจาก {price}", { price: formatBaht(listing.price) })
              : pricingModeLabel(listing, t)}
          </span>
        </div>
          </>
          );
      },
    },
    {
      id: "col3",
      header: t("catalog.listings.col.remaining", "เหลือ"), meta: { headClassName: "text-right", cellClassName: "text-right" },
      cell: ({ row: { original: listing } }) => {
          
          return (
          <>
        <div className="flex flex-col items-end">
          <span
            className={cn(
              "text-[13px] font-semibold",
              listing.quantityAvailable === 0 && "text-[#d0342c]",
            )}
          >
            {t("catalog.listings.cards", "{count} ใบ", { count: formatCount(listing.quantityAvailable) })}
          </span>
          {listing.quantityReserved > 0 ? (
            <span className="text-[11px] text-muted-foreground">
              {t("catalog.listings.reserved", "จอง {count}", { count: formatCount(listing.quantityReserved) })}
            </span>
          ) : null}
        </div>
          </>
          );
      },
    },
    {
      id: "col4",
      header: t("catalog.filters.status", "สถานะ"), meta: { headClassName: "text-right", cellClassName: "text-right" },
      cell: ({ row: { original: listing } }) => {
          
          return (
          <>
        <Badge
          className={cn(
            "h-5 rounded-full px-2 text-xs",
            LISTING_STATUS_BADGE[listing.status],
          )}
        >
          {LISTING_STATUS_LABEL[listing.status]}
        </Badge>
          </>
          );
      },
    },
    {
      id: "toggle",
      header: () => <span className="sr-only">{t("catalog.listings.col.details", "รายละเอียด")}</span>,
      meta: { headClassName: "w-10" },
      cell: ({ row: { original: listing } }) => (
        <>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-expanded={openId === listing.id}
          aria-label={t("catalog.listings.detailsOf", "รายละเอียดประกาศ #{id}", { id: listing.id })}
          onClick={(event) => {
            event.stopPropagation();
            setOpenId(openId === listing.id ? null : listing.id);
          }}
        >
          {openId === listing.id ? <ChevronUp /> : <ChevronDown />}
        </Button>
        </>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-3.5 px-6 pb-6">
      {listings.data ? <ListingSummary summary={listings.data.summary} /> : null}

      <div className="flex flex-wrap items-center gap-2">
        <Input
          type="search"
          aria-label={t("catalog.listings.search", "ค้นหาร้านหรือเลขประกาศ")}
          placeholder={t("catalog.listings.searchPlaceholder", "ค้นหาชื่อร้าน, @username, เลขประกาศ...")}
          className="min-w-48 flex-1"
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
        />
        <FilterSelect
          label={t("catalog.listings.variant", "เวอร์ชัน")}
          value={variantId === null ? ALL : String(variantId)}
          options={variantOptions}
          onChange={(value) => {
            setVariantId(value === ALL ? null : Number(value));
            setPage(1);
          }}
        />
        <FilterSelect
          label={t("catalog.filters.status", "สถานะ")}
          value={status ?? ALL}
          options={statusOptions}
          onChange={(value) => {
            setStatus(value === ALL ? null : (value as ListingStatus));
            setPage(1);
          }}
        />
      </div>

      <QueryBoundary
        query={listings}
        loading={<ListingsSkeleton />}
        errorTitle={t("catalog.listings.loadFailed", "โหลดรายการร้านไม่สำเร็จ")}
        isEmpty={(data) => data.listings.items.length === 0}
        empty={
          hasFilters ? (
            <EmptyState
              title={t("catalog.listings.noMatchTitle", "ไม่พบประกาศตามตัวกรอง")}
              description={t("catalog.listings.noMatchDescription", "ลองเปลี่ยนคำค้นหรือสถานะ")}
              className="min-h-48"
            >
              <Button variant="link" onClick={clearFilters}>
                {t("catalog.filters.clear", "ล้างตัวกรอง")}
              </Button>
            </EmptyState>
          ) : (
            <EmptyState
              icon={Store}
              title={t("catalog.listings.emptyTitle", "ยังไม่มีร้านขายการ์ดใบนี้")}
              description={t("catalog.listings.emptyDescription", "ตอนนี้ยังไม่มีประกาศจากผู้ขาย")}
              className="min-h-48"
            />
          )
        }
      >
        {(data) => (
          <>
            <div
              aria-busy={listings.isFetching || undefined}
              className={cn(
                "overflow-hidden rounded-lg border border-border transition-opacity",
                listings.isPlaceholderData && "opacity-60",
              )}
            >
              <DataTable
                columns={listingColumns}
                data={data.listings.items}
                getRowId={(listing) => String(listing.id)}
                tableClassName="min-w-[580px]"
                headerRowClassName="bg-muted hover:bg-muted"
                rowClassName={(listing) => cn(listing.status === "BLOCKED" && "bg-rose-50 hover:bg-rose-100/70")}
                onRowClick={(listing) => setOpenId(openId === listing.id ? null : listing.id)}
                expandedCellClassName="bg-muted/40 p-4 whitespace-normal"
                renderExpandedRow={(listing) =>
                  openId === listing.id ? (
                    <ListingDetail listing={listing} onAction={(action) => setBlockTarget({ listing, action })} />
                  ) : null
                }
              />
            </div>

            <p className="text-xs text-muted-foreground">
              {t("catalog.listings.countSorted", "{count} ประกาศ · เรียง: พร้อมขายก่อน แล้วจำนวนที่เหลือมาก → น้อย", { count: formatCount(data.listings.totalItems) })}
            </p>
            {data.listings.totalPages > 1 ? (
              <CatalogPagination
                page={page}
                totalPages={data.listings.totalPages}
                disabled={listings.isFetching}
                onPageChange={setPage}
              />
            ) : null}
          </>
        )}
      </QueryBoundary>

      {blockTarget ? (
        <ListingBlockDialog
          key={`${blockTarget.listing.id}-${blockTarget.action}`}
          productId={productId}
          cardLabel={`${productName} · ${variantName(blockTarget.listing.catalogVariantId)}`}
          listing={blockTarget.listing}
          action={blockTarget.action}
          onClose={() => setBlockTarget(null)}
        />
      ) : null}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <Select
      items={options}
      value={value}
      onValueChange={(next) => {
        if (next !== null) onChange(String(next));
      }}
    >
      <SelectTrigger aria-label={label} className="w-full sm:w-36">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

function ListingSummary({ summary }: { summary: AdminCardListingSummary }) {
  const { t } = useTranslate("admin");
  const closed =
    summary.pausedQuantity + summary.blockedQuantity + summary.closedShopQuantity;
  const closedParts = [
    summary.pausedQuantity > 0 && t("catalog.listings.summary.paused", "พัก {count}", { count: formatCount(summary.pausedQuantity) }),
    summary.blockedQuantity > 0 && t("catalog.listings.summary.blocked", "ระงับ {count}", { count: formatCount(summary.blockedQuantity) }),
    summary.closedShopQuantity > 0 &&
      t("catalog.listings.summary.closedShop", "ร้านปิด {count}", { count: formatCount(summary.closedShopQuantity) }),
  ].filter(Boolean);

  return (
    <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      <SummaryTile
        label={t("catalog.listings.summary.shops", "ร้านที่ขาย")}
        value={t("catalog.listings.summary.shopCount", "{count} ร้าน", { count: formatCount(summary.shopCount) })}
        note={t("catalog.listings.summary.listingCount", "{count} ประกาศ", { count: formatCount(summary.listingCount) })}
      />
      <SummaryTile
        label={t("catalog.listings.summary.available", "พร้อมขาย")}
        value={t("catalog.listings.cards", "{count} ใบ", { count: formatCount(summary.availableQuantity) })}
        note={t("catalog.listings.summary.availableNote", "ซื้อได้ตอนนี้ · {count} ร้าน", { count: formatCount(summary.availableShops) })}
        className="text-[#12805c]"
      />
      <SummaryTile
        label={t("catalog.listings.summary.reserved", "ติดจอง")}
        value={t("catalog.listings.cards", "{count} ใบ", { count: formatCount(summary.reservedQuantity) })}
        note={t("catalog.listings.summary.reservedNote", "ในออเดอร์ที่ยังไม่จบ")}
      />
      <SummaryTile
        label={t("catalog.listings.summary.closed", "ไม่เปิดขาย")}
        value={t("catalog.listings.cards", "{count} ใบ", { count: formatCount(closed) })}
        note={closedParts.join(" · ") || t("catalog.listings.summary.none", "ไม่มี")}
        className={closed > 0 ? "text-rose-700" : undefined}
      />
    </dl>
  );
}

function SummaryTile({
  label,
  value,
  note,
  className,
}: {
  label: string;
  value: string;
  note: string;
  className?: string;
}) {
  return (
    <div className="flex flex-col gap-0.5 rounded-lg border border-border px-3 py-2.5">
      <dt className="text-[11px] font-medium text-muted-foreground">{label}</dt>
      <dd className={cn("text-xl font-bold text-foreground", className)}>
        {value}
      </dd>
      <dd className="text-[11px] text-muted-foreground">{note}</dd>
    </div>
  );
}

function pricingModeLabel(listing: AdminCardListing, translate: ReturnType<typeof useTranslate<"admin">>["t"]): string {
  return listing.pricingMode === "AUTO_MEDIAN" ? translate("catalog.listings.pricing.auto", "ราคาอัตโนมัติ") : translate("catalog.listings.pricing.manual", "ตั้งเอง");
}

function ListingDetail({
  listing,
  onAction,
}: {
  listing: AdminCardListing;
  onAction: (action: "block" | "unblock") => void;
}) {
  const { t } = useTranslate("admin");
  const { seller, block } = listing;
  const rating =
    seller.ratingAvg === null
      ? t("catalog.listings.detail.noRating", "ยังไม่มีคะแนน")
      : `★ ${seller.ratingAvg.toFixed(1)} (${formatCount(seller.ratingCount)})`;
  const shopState = closedShopLabel(listing)
    ? closedShopLabel(listing)
    : seller.status === "VERIFIED"
      ? t("catalog.listings.detail.verified", "ยืนยันแล้ว")
      : t("catalog.listings.detail.unverified", "ยังไม่ยืนยัน");

  return (
    <div className="flex flex-col gap-3">
      {block ? (
        <div className="flex flex-col gap-1 rounded-lg border border-rose-200 bg-rose-50 p-3">
          <p className="text-xs font-semibold text-rose-700">
            {t("catalog.listings.detail.blockedBy", "ระงับโดย {name}", { name: block.blockedByUsername ?? t("catalog.listings.detail.admin", "แอดมิน") })} ·{" "}
            {formatThaiDate(block.blockedAt)}
          </p>
          <p className="text-[13px] break-words text-foreground">
            {block.reason}
          </p>
        </div>
      ) : null}

      <dl className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
        <DetailItem label={t("catalog.listings.detail.id", "เลขประกาศ")} value={`#${listing.id}`} />
        {block?.fromStatus ? (
          <DetailItem
            label={t("catalog.listings.detail.fromStatus", "สถานะก่อนระงับ")}
            value={LISTING_STATUS_LABEL[block.fromStatus]}
          />
        ) : (
          <DetailItem label={t("catalog.listings.detail.lot", "ล็อตของร้าน")} value={listing.lotLabel ?? "—"} />
        )}
        <DetailItem
          label={t("catalog.listings.detail.stock", "สต็อก")}
          value={t("catalog.listings.detail.stockValue", "ทั้งหมด {total} · พร้อมขาย {available} · จอง {reserved}", { total: formatCount(listing.quantityTotal), available: formatCount(listing.quantityAvailable), reserved: formatCount(listing.quantityReserved) })}
        />
        <DetailItem
          label={t("catalog.listings.col.price", "ราคา")}
          value={
            listing.salePrice !== null
              ? `${t("catalog.listings.detail.salePrice", "{price} · ลดเหลือ {sale}", { price: formatBaht(listing.price), sale: formatBaht(listing.salePrice) })}${listing.saleEndsAt ? ` ${t("catalog.listings.detail.saleUntil", "ถึง {date}", { date: formatThaiDate(listing.saleEndsAt) })}` : ""}`
              : `${formatBaht(listing.price)} · ${pricingModeLabel(listing, t)}`
          }
        />
        <DetailItem
          label={t("catalog.listings.detail.createdAt", "ลงขายเมื่อ")}
          value={listing.publishedAt ? formatThaiDate(listing.publishedAt) : "—"}
        />
        <DetailItem label={t("catalog.listings.detail.updatedAt", "แก้ไขล่าสุด")} value={formatThaiDate(listing.updatedAt)} />
        <DetailItem label={t("catalog.listings.detail.publicNote", "หมายเหตุถึงผู้ซื้อ")} value={listing.publicNote ?? "—"} />
        <DetailItem label={t("catalog.listings.col.shop", "ร้าน")} value={`${shopState} · ${rating}`} />
      </dl>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-3.5">
          {hasPublicPage(listing.status) ? (
            <DetailLink to={`/listings/${listing.id}`}>{t("catalog.listings.detail.listingPage", "หน้าประกาศ")}</DetailLink>
          ) : null}
          <DetailLink to={`/u/${seller.username}`}>{t("catalog.listings.detail.shopPage", "หน้าร้าน")}</DetailLink>
          <DetailLink to={`/admin/users?user=${seller.userId}`}>
            {t("catalog.listings.detail.sellerInfo", "ข้อมูลผู้ขาย")}
          </DetailLink>
        </div>
        {listing.status === "BLOCKED" ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAction("unblock")}
          >
            {t("catalog.listings.unblock", "ปลดการระงับ")}
          </Button>
        ) : listing.status !== "DELISTED" ? (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onAction("block")}
          >
            {t("catalog.listings.block", "ระงับการขาย")}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col">
      <dt className="text-[11px] text-muted-foreground">{label}</dt>
      <dd className="text-xs font-medium break-words text-foreground">{value}</dd>
    </div>
  );
}

function DetailLink({ to, children }: { to: string; children: string }) {
  return (
    <Link
      to={to}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
    >
      {children}
      <ExternalLink className="size-3" />
    </Link>
  );
}

function ListingsSkeleton() {
  return (
    <div className="flex flex-col gap-2.5 rounded-lg border border-border p-3">
      {[0, 1, 2].map((row) => (
        <div key={row} className="flex items-center gap-2.5">
          <Skeleton className="size-8 rounded-full" />
          <Skeleton className="h-4 flex-1" />
        </div>
      ))}
    </div>
  );
}

// @tolgee-key {"key": "catalog.listings.pricing.auto", "ns": "admin", "defaultValue": "ราคาอัตโนมัติ"}
// @tolgee-key {"key": "catalog.listings.pricing.manual", "ns": "admin", "defaultValue": "ตั้งเอง"}
