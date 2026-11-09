import { DataTable, type DataTableColumn } from "@/components/common";
import { Link } from "react-router-dom";
import { MoreVertical } from "lucide-react";

import { SaleBadge } from "@/components/sale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

import { formatBaht } from "../promotions.format";
import {
  SALE_STATUS_LABEL,
  SALE_STATUS_STYLE,
  type SaleScopeNames,
  budgetPercent,
  isFinished,
  saleDiscountDetail,
  saleDiscountLabel,
  salePeriod,
  salePeriodHint,
  saleScopeDetail,
  saleScopeLabel,
  saleSubtitle,
  saleTypeBadge,
} from "../sales.format";
import type { AdminSale, SaleStatus } from "../sales.types";
import { PromotionOwnerTag } from "./PromotionBadges";
import { intlLocale } from "@/lib/i18n";

export type SaleRowAction = "pause" | "resume" | "end" | "delete";

const HEAD_CLASS = "h-10 px-3 text-xs font-medium text-muted-foreground";
const CELL_CLASS = "px-3 py-2.5 align-middle text-[13px] whitespace-normal";
const MAIN_CLASS = "block truncate text-[13px] font-semibold";
const SUB_CLASS = "block truncate text-[11px] text-muted-foreground";
const MENU_CLASS = "sticky right-0 w-[48px] bg-card px-2 text-right";

/** Figma "PRM / Status Pill" ของแคมเปญลดราคา */
export function SaleStatusPill({ status }: { status: SaleStatus }) {
  return (
    <Badge className={cn("h-5 gap-1.5 rounded-full px-2 text-xs font-medium", SALE_STATUS_STYLE[status])}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {SALE_STATUS_LABEL[status]}
    </Badge>
  );
}

/** ตาราง Figma SAL-A1 ("SAL / Admin Sale Row") — จอแคบเลื่อนตาราง */
export function SaleTable({
  sales,
  scopeNames,
  now,
  onAction,
}: {
  sales: AdminSale[];
  scopeNames: SaleScopeNames;
  now: number;
  onAction: (action: SaleRowAction, sale: AdminSale) => void;
}) {
  const columns: DataTableColumn<AdminSale>[] = [
    {
      id: "col0",
      header: "แคมเปญ",
      meta: { headClassName: cn(HEAD_CLASS, "w-[21%]"), cellClassName: CELL_CLASS },
      cell: ({ row: { original: sale } }) => {
        return (
          <>
        <div className="flex min-w-0 items-center gap-1.5">
          <strong className="truncate text-[13px] font-bold">{sale.name}</strong>
          <PromotionOwnerTag owner={sale.ownerType} />
        </div>
        <span className={SUB_CLASS} title={saleSubtitle(sale)}>
          {saleSubtitle(sale)}
        </span>
          </>
        );
      },
    },
    {
      id: "col1",
      header: "ประเภท",
      meta: { headClassName: cn(HEAD_CLASS, "w-[11%]"), cellClassName: CELL_CLASS },
      cell: ({ row: { original: sale } }) => {
        const badge = saleTypeBadge(sale);
        return (
          <>
        <SaleBadge type={badge.type} label={badge.label} />
          </>
        );
      },
    },
    {
      id: "col2",
      header: "ส่วนลด",
      meta: { headClassName: cn(HEAD_CLASS, "w-[12%]"), cellClassName: CELL_CLASS },
      cell: ({ row: { original: sale } }) => {
        return (
          <>
        <span className={MAIN_CLASS}>{saleDiscountLabel(sale)}</span>
        <span className={SUB_CLASS}>{saleDiscountDetail(sale)}</span>
          </>
        );
      },
    },
    {
      id: "col3",
      header: "ขอบเขต",
      meta: { headClassName: cn(HEAD_CLASS, "w-[15%]"), cellClassName: CELL_CLASS },
      cell: ({ row: { original: sale } }) => {
        return (
          <>
        <span className={MAIN_CLASS} title={saleScopeLabel(sale, scopeNames)}>
          {saleScopeLabel(sale, scopeNames)}
        </span>
        <span className={SUB_CLASS} title={saleScopeDetail(sale)}>
          {saleScopeDetail(sale)}
        </span>
          </>
        );
      },
    },
    {
      id: "col4",
      header: "งบ / ขายแล้ว",
      meta: { headClassName: cn(HEAD_CLASS, "w-[14%]"), cellClassName: CELL_CLASS },
      cell: ({ row: { original: sale } }) => {
        const percent = budgetPercent(sale);
        const budgetOut = sale.status === "BUDGET_EXHAUSTED" || sale.status === "SOLD_OUT" || (budgetPercent(sale) ?? 0) >= 100;
        return (
          <>
        {sale.budgetCap != null ? (
          <>
            <span className="block truncate text-xs font-semibold">
              {formatBaht(sale.subsidyReserved)} / {formatBaht(sale.budgetCap)}
            </span>
            <div className="my-1 h-[5px] w-[110px] max-w-full overflow-hidden rounded-[3px] bg-[#eef1f2]" aria-hidden>
              <div
                className={cn("h-full rounded-[3px]", budgetOut ? "bg-[#dc2626]" : "bg-[#0069a8]")}
                style={{ width: `${percent ?? 0}%` }}
              />
            </div>
          </>
        ) : (
          <span className="block text-xs font-semibold">— (ไม่มีงบ)</span>
        )}
        <span className={SUB_CLASS}>
          {sale.status === "SCHEDULED"
            ? `เข้าร่วม ${sale.listingCount.toLocaleString(intlLocale())} listing`
            : sale.status === "SOLD_OUT"
              ? "ขายหมดทุก listing"
              : sale.status === "BUDGET_EXHAUSTED"
                ? "จบเพราะงบหมด"
                : `ขายแล้ว ${sale.soldUnits.toLocaleString(intlLocale())} ชิ้น`}
        </span>
          </>
        );
      },
    },
    {
      id: "col5",
      header: "ระยะเวลา",
      meta: { headClassName: cn(HEAD_CLASS, "w-[13%]"), cellClassName: CELL_CLASS },
      cell: ({ row: { original: sale } }) => {
        return (
          <>
        <span className={MAIN_CLASS}>{salePeriod(sale)}</span>
        <span className={SUB_CLASS} title={salePeriodHint(sale, now)}>
          {salePeriodHint(sale, now)}
        </span>
          </>
        );
      },
    },
    {
      id: "col6",
      header: "สถานะ",
      meta: { headClassName: cn(HEAD_CLASS, "w-[10%]"), cellClassName: CELL_CLASS },
      cell: ({ row: { original: sale } }) => {
        return (
          <>
        <SaleStatusPill status={sale.status} />
          </>
        );
      },
    },
    {
      id: "col7",
      header: () => <span className="sr-only">จัดการ</span>,
      meta: { headClassName: cn(HEAD_CLASS, MENU_CLASS, "bg-muted"), cellClassName: cn(CELL_CLASS, MENU_CLASS) },
      cell: ({ row: { original: sale } }) => {
        const isPlatform = sale.ownerType === "PLATFORM";
        const finished = isFinished(sale.status);
        const paused = sale.status === "PAUSED";
        return (
          <>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`จัดการ ${sale.name}`} />}>
            <MoreVertical className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={4} className="w-44 min-w-44">
            {isPlatform && !finished ? (
              <DropdownMenuItem render={<Link to={`/admin/sales/${sale.id}/edit`} />}>แก้ไข</DropdownMenuItem>
            ) : null}
            {isPlatform && sale.slug ? (
              <DropdownMenuItem render={<Link to={`/sale/${sale.slug}`} target="_blank" rel="noreferrer" />}>
                ดูหน้าแคมเปญ
              </DropdownMenuItem>
            ) : null}
            {!finished ? (
              <DropdownMenuItem
                className={paused ? undefined : "text-[#b45309] data-highlighted:text-[#b45309]"}
                onClick={() => onAction(paused ? "resume" : "pause", sale)}
              >
                {paused ? "เปิดอีกครั้ง" : isPlatform ? "หยุดชั่วคราว" : "หยุดการลดราคาของร้าน"}
              </DropdownMenuItem>
            ) : null}
            {!finished && sale.status !== "SCHEDULED" ? (
              <DropdownMenuItem onClick={() => onAction("end", sale)}>จบทันที</DropdownMenuItem>
            ) : null}
            {isPlatform ? (
              <DropdownMenuItem variant="destructive" onClick={() => onAction("delete", sale)}>
                ลบ
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
      data={sales}
      getRowId={(sale) => String(sale.id)}
      tableClassName="min-w-[940px] table-fixed"
      headerRowClassName="bg-muted hover:bg-muted"
      rowClassName={() => "h-[60px]"}
    />
  );
}
