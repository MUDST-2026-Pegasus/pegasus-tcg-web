import { DataTable, type DataTableColumn } from "@/components/common";
import { Link } from "react-router-dom";
import { House, MoreVertical } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

import {
  conditionDetail,
  discountCapLabel,
  discountLabel,
  formatPeriod,
  formatPromoDate,
  isUsageFull,
  limitLabel,
  minSpendLabel,
  periodHint,
  promotionSubtitle,
  type ScopeNames,
  usagePercent,
} from "../promotions.format";
import type { AdminPromotion } from "../promotions.types";
import { PromotionOwnerTag, PromotionStatusPill } from "./PromotionBadges";
import { intlLocale, useTranslate } from "@/lib/i18n";

export type PromotionRowAction = "copy" | "redemptions" | "pause" | "resume" | "delete";

type PromotionTableProps = {
  promotions: AdminPromotion[];
  /** ชื่อเกม/หมวด สำหรับคอลัมน์เงื่อนไข */
  scopeNames: ScopeNames;
  now: number;
  onAction: (action: PromotionRowAction, promotion: AdminPromotion) => void;
};

const HEAD_CLASS = "h-10 px-3 text-xs font-medium text-muted-foreground";
const CELL_CLASS = "px-3 py-2.5 align-middle text-[13px] whitespace-normal";
const SUB_CLASS = "block truncate text-xs text-muted-foreground";
/** คอลัมน์เมนูติดขวา จอแคบเลื่อนตารางแล้วยังกดเมนูได้ */
const MENU_CLASS = "sticky right-0 w-[52px] bg-card px-2 text-right";

/** ตาราง Figma PRM-A1 — 900px พอดีการ์ดที่จอ 1280 แคบกว่านั้นเลื่อนตาราง */
export function PromotionTable({ promotions, scopeNames, now, onAction }: PromotionTableProps) {
  const { t } = useTranslate("promotions");
  const columns: DataTableColumn<AdminPromotion>[] = [
    {
      id: "col0",
      header: t("admin.promotionTable.header", "โค้ด / แคมเปญ"),
      meta: { headClassName: cn(HEAD_CLASS, "w-[22%]"), cellClassName: CELL_CLASS },
      cell: ({ row: { original: promotion } }) => {
        return (
          <>
        <div className="flex min-w-0 items-center gap-2">
          <strong className="truncate text-sm tracking-wide">{promotion.code}</strong>
          <PromotionOwnerTag owner={promotion.ownerType} />
          {promotion.featuredOnHome ? (
            <House className="size-3.5 shrink-0 text-primary" aria-label={t("admin.promotionTable.ariaLabel", "แสดงบนหน้าแรก")} />
          ) : null}
        </div>
        <span className={SUB_CLASS} title={promotionSubtitle(promotion)}>
          {promotionSubtitle(promotion)}
        </span>
          </>
        );
      },
    },
    {
      id: "col1",
      header: t("admin.promotionTable.header2", "ส่วนลด"),
      meta: { headClassName: cn(HEAD_CLASS, "w-[15%]"), cellClassName: CELL_CLASS },
      cell: ({ row: { original: promotion } }) => {
        return (
          <>
        <span className="block text-sm font-semibold">{discountLabel(promotion)}</span>
        <span className={SUB_CLASS}>{discountCapLabel(promotion)}</span>
          </>
        );
      },
    },
    {
      id: "col2",
      header: t("admin.promotionTable.header3", "เงื่อนไข"),
      meta: { headClassName: cn(HEAD_CLASS, "w-[16%]"), cellClassName: CELL_CLASS },
      cell: ({ row: { original: promotion } }) => {
        return (
          <>
        <span className="block">{minSpendLabel(promotion.minSpend)}</span>
        <span className={SUB_CLASS}>{conditionDetail(promotion, scopeNames)}</span>
          </>
        );
      },
    },
    {
      id: "col3",
      header: t("admin.promotionTable.header4", "ใช้ไปแล้ว"),
      meta: { headClassName: cn(HEAD_CLASS, "w-[15%]"), cellClassName: CELL_CLASS },
      cell: ({ row: { original: promotion } }) => {
        const full = isUsageFull(promotion);
        return (
          <>
        <span className="block">
          {promotion.usedCount.toLocaleString(intlLocale())} / {limitLabel(promotion.usageLimitTotal)}
        </span>
        <Progress
          aria-hidden
          value={promotion.usageLimitTotal ? usagePercent(promotion) : 0}
          className={cn(
            "my-1 w-24 max-w-full gap-0 [&_[data-slot=progress-track]]:h-1.5",
            full && "[&_[data-slot=progress-indicator]]:bg-destructive",
          )}
        />
        {promotion.claimable ? (
          <span className={SUB_CLASS}>
            {t("admin.promotionTable.span", "เก็บแล้ว")} {promotion.claimedCount.toLocaleString(intlLocale())} / {limitLabel(promotion.claimLimit)}
          </span>
        ) : null}
          </>
        );
      },
    },
    {
      id: "col4",
      header: t("admin.promotionTable.header5", "ระยะเวลา"),
      meta: { headClassName: cn(HEAD_CLASS, "w-[18%]"), cellClassName: CELL_CLASS },
      cell: ({ row: { original: promotion } }) => {
        return (
          <>
        <span
          className="block truncate"
          title={`${formatPromoDate(promotion.startsAt)} – ${formatPromoDate(promotion.endsAt)}`}
        >
          {formatPeriod(promotion.startsAt, promotion.endsAt)}
        </span>
        <span className={SUB_CLASS}>{periodHint(promotion, now)}</span>
          </>
        );
      },
    },
    {
      id: "col5",
      header: t("admin.promotionTable.header6", "สถานะ"),
      meta: { headClassName: cn(HEAD_CLASS, "w-[14%]"), cellClassName: CELL_CLASS },
      cell: ({ row: { original: promotion } }) => {
        return (
          <>
        <PromotionStatusPill status={promotion.status} />
          </>
        );
      },
    },
    {
      id: "col6",
      header: () => <span className="sr-only">{t("admin.promotionTable.span2", "จัดการ")}</span>,
      meta: { headClassName: cn(HEAD_CLASS, MENU_CLASS, "bg-muted"), cellClassName: cn(CELL_CLASS, MENU_CLASS) },
      cell: ({ row: { original: promotion } }) => {
        const isPlatform = promotion.ownerType === "PLATFORM";
        const paused = promotion.status === "PAUSED";
        return (
          <>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="ghost" size="icon-sm" aria-label={t("admin.promotionTable.ariaLabel2", "จัดการ {code}", { code: promotion.code })} />}
          >
            <MoreVertical className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={4} className="w-40 min-w-40">
            {isPlatform ? (
              <DropdownMenuItem render={<Link to={`/admin/promotions/${promotion.id}/edit`} />}>{t("admin.promotionTable.dropdownMenuItem", "แก้ไข")}</DropdownMenuItem>
            ) : null}
            <DropdownMenuItem onClick={() => onAction("redemptions", promotion)}>{t("admin.promotionTable.dropdownMenuItem2", "ดูการใช้โค้ด")}</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAction("copy", promotion)}>{t("admin.promotionTable.dropdownMenuItem3", "คัดลอกโค้ด")}</DropdownMenuItem>
            <DropdownMenuItem
              className={paused ? undefined : "text-[#b45309] data-highlighted:text-[#b45309]"}
              onClick={() => onAction(paused ? "resume" : "pause", promotion)}
            >
              {paused ? t("admin.promotionTable.dropdownMenuItem4", "เปิดใช้อีกครั้ง") : t("admin.promotionTable.dropdownMenuItem5", "หยุดชั่วคราว")}
            </DropdownMenuItem>
            {isPlatform ? (
              <DropdownMenuItem variant="destructive" onClick={() => onAction("delete", promotion)}>
                {t("admin.promotionTable.dropdownMenuItem6", "ลบ")}
              </DropdownMenuItem>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
          </>
        );
      },
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={promotions}
      getRowId={(promotion) => String(promotion.id)}
      tableClassName="min-w-[900px] table-fixed"
      headerRowClassName="bg-muted hover:bg-muted"
      rowClassName={() => "h-[60px]"}
    />
  );
}
