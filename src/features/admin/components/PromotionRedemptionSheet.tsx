import { Link } from "react-router-dom";

import { EmptyState, ErrorState, DataTable, type DataTableColumn } from "@/components/common";
import { TableSkeleton } from "@/components/common/PageSkeletons";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";

import {
  discountCapLabel,
  discountLabel,
  formatBaht,
  formatPeriod,
  limitLabel,
  maskBuyer,
  minSpendLabel,
} from "../promotions.format";
import { PromotionPagination } from "@/features/promotions/PromotionPagination";

import { usePromotion, useRedemptions } from "../promotions.queries";
import { PromotionStatusPill, RedemptionStatusPill } from "./PromotionBadges";
import { intlLocale, translate, useTranslate } from "@/lib/i18n";

// @tolgee-key {"key":"admin.promotionRedemptionSheet.header","ns":"promotions","defaultValue":"คำสั่งซื้อ"}
// @tolgee-key {"key":"admin.promotionRedemptionSheet.header2","ns":"promotions","defaultValue":"ผู้ซื้อ"}
// @tolgee-key {"key":"admin.promotionRedemptionSheet.header3","ns":"promotions","defaultValue":"ส่วนลด"}
// @tolgee-key {"key":"admin.promotionRedemptionSheet.header4","ns":"promotions","defaultValue":"สถานะ"}

type PromotionRedemptionSheetProps = {
  /** 0 = ปิด */
  promotionId: number;
  page: number;
  onPageChange: (page: number) => void;
  onClose: () => void;
};

type RedemptionEntry = NonNullable<ReturnType<typeof useRedemptions>["data"]>["items"][number];

const REDEMPTION_COLUMNS: DataTableColumn<RedemptionEntry>[] = [
  {
    id: "order",
    get header() { return translate("promotions", "admin.promotionRedemptionSheet.header", "คำสั่งซื้อ"); },
    meta: { headClassName: "h-9 px-0 text-muted-foreground", cellClassName: "px-0" },
    cell: ({ row: { original: entry } }) => (
      <Link className="text-primary underline-offset-2 hover:underline" to={`/admin/orders?q=${encodeURIComponent(entry.orderNumber)}`}>
        {entry.orderNumber}
      </Link>
    ),
  },
  { id: "buyer", get header() { return translate("promotions", "admin.promotionRedemptionSheet.header2", "ผู้ซื้อ"); }, meta: { headClassName: "h-9 text-muted-foreground" }, cell: ({ row }) => maskBuyer(row.original.buyer) },
  { id: "amount", get header() { return translate("promotions", "admin.promotionRedemptionSheet.header3", "ส่วนลด"); }, meta: { headClassName: "h-9 text-muted-foreground" }, cell: ({ row }) => formatBaht(row.original.amount) },
  { id: "status", get header() { return translate("promotions", "admin.promotionRedemptionSheet.header4", "สถานะ"); }, meta: { headClassName: "h-9 text-muted-foreground" }, cell: ({ row }) => <RedemptionStatusPill status={row.original.status} /> },
];

/** Sheet การใช้โค้ด (Figma PRM-A3 D) — เปิดจาก `?promo=ID` reload แล้วยังอยู่ */
export function PromotionRedemptionSheet({ promotionId, page, onPageChange, onClose }: PromotionRedemptionSheetProps) {
  const { t } = useTranslate("promotions");
  const promotion = usePromotion(promotionId);
  const redemptions = useRedemptions(promotionId, page);
  const data = promotion.data;
  const cap = data ? discountCapLabel(data) : "—";
  const totalPages = redemptions.data?.totalPages ?? 0;

  return (
    <Sheet open={promotionId > 0} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="gap-0 overflow-y-auto data-[side=right]:w-full data-[side=right]:sm:max-w-[560px]">
        <SheetHeader className="gap-2 px-6 pt-6 pr-14">
          <div className="flex flex-wrap items-center gap-3">
            <SheetTitle className="text-2xl font-black tracking-wide">{data?.code ?? t("admin.promotionRedemptionSheet.sheetTitle", "การใช้โค้ด")}</SheetTitle>
            {data ? <PromotionStatusPill status={data.status} /> : null}
          </div>
          {data ? (
            <SheetDescription className="text-xs">
              {discountLabel(data)}
              {cap !== "—" ? ` ${cap}` : ""} · {minSpendLabel(data.minSpend)} · {formatPeriod(data.startsAt, data.endsAt)}
              {data.createdBy ? t("admin.promotionRedemptionSheet.sheetDescription", " · สร้างโดย {value}", { value: maskBuyer(data.createdBy) }) : ""}
            </SheetDescription>
          ) : null}
        </SheetHeader>

        {data ? (
          <div className="grid grid-cols-1 gap-3 px-6 pt-4 sm:grid-cols-3">
            <Metric
              label={t("admin.promotionRedemptionSheet.label", "ใช้ไปแล้ว")}
              value={`${data.usedCount.toLocaleString(intlLocale())} / ${limitLabel(data.usageLimitTotal)}`}
              caption={data.claimable ? t("admin.promotionRedemptionSheet.caption", "เก็บแล้ว {value} / {value2}", { value: data.claimedCount.toLocaleString(intlLocale()), value2: limitLabel(data.claimLimit) }) : undefined}
            />
            <Metric
              label={data.ownerType === "PLATFORM" ? t("admin.promotionRedemptionSheet.label2", "ส่วนลดที่ Pegasus ออก") : t("admin.promotionRedemptionSheet.label3", "ส่วนลดที่ร้านออก")}
              value={formatBaht(data.discountTotal)}
              caption={data.reservedOrders ? t("admin.promotionRedemptionSheet.caption2", "รอชำระอีก {value} ออเดอร์", { value: data.reservedOrders.toLocaleString(intlLocale()) }) : undefined}
            />
            <Metric label={t("admin.promotionRedemptionSheet.label4", "ยอดขายจากโค้ดนี้")} value={formatBaht(data.salesTotal)} />
          </div>
        ) : null}

        <div className="px-6 pt-5 pb-6">
          {redemptions.isPending ? <TableSkeleton rows={4} columns={4} className="rounded-md" /> : null}
          {redemptions.isError && !redemptions.data ? (
            <ErrorState
              error={redemptions.error}
              title={t("admin.promotionRedemptionSheet.title", "โหลดการใช้โค้ดไม่สำเร็จ")}
              onRetry={() => void redemptions.refetch()}
              className="min-h-40"
            />
          ) : null}
          {redemptions.data?.items.length === 0 ? (
            <EmptyState title={t("admin.promotionRedemptionSheet.title2", "ยังไม่มีการใช้โค้ด")} className="min-h-40" />
          ) : null}
          {redemptions.data && redemptions.data.items.length > 0 ? (
            <DataTable columns={REDEMPTION_COLUMNS} data={redemptions.data.items} getRowId={(entry) => String(entry.id)} tableClassName="text-xs" />
          ) : null}
          <PromotionPagination
            page={page}
            totalPages={totalPages}
            onPageChange={onPageChange}
            label={t("admin.promotionRedemptionSheet.label5", "หน้าการใช้โค้ด")}
            className="mt-4"
          />
          <p className="mt-4 text-[11px] leading-4 text-muted-foreground">
            {t("admin.promotionRedemptionSheet.p", "จองไว้ = สร้างออเดอร์แล้วรอชำระ · คืนสิทธิ์ = ออเดอร์หมดเวลาชำระ/ยกเลิกก่อนจ่าย (สิทธิ์กลับเข้าโควตา)")}
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Metric({ label, value, caption }: { label: string; value: string; caption?: string }) {
  return (
    <div className="min-w-0 rounded-lg bg-muted px-3 py-2.5">
      <span className="block text-[11px] text-muted-foreground">{label}</span>
      <strong className="mt-1 block truncate text-lg">{value}</strong>
      {caption ? <span className="block text-[11px] text-muted-foreground">{caption}</span> : null}
    </div>
  );
}
