import { translate, useLanguage } from "@/lib/language";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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

export type SaleRowAction = "pause" | "resume" | "end" | "delete";

const HEADERS: Array<{ label: string; width: string }> = [
  { get label() { return translate("แคมเปญ", "Campaign"); }, width: "w-[21%]" },
  { get label() { return translate("ประเภท", "Type"); }, width: "w-[11%]" },
  { get label() { return translate("ส่วนลด", "Discount"); }, width: "w-[12%]" },
  { get label() { return translate("ขอบเขต", "Scope"); }, width: "w-[15%]" },
  { label: "งบ / ขายแล้ว", width: "w-[14%]" },
  { get label() { return translate("ระยะเวลา", "Duration"); }, width: "w-[13%]" },
  { get label() { return translate("สถานะ", "Status"); }, width: "w-[10%]" },
];

const HEAD_CLASS = "h-10 px-3 text-xs font-medium text-muted-foreground";
const CELL_CLASS = "px-3 py-2.5 align-middle text-[13px] whitespace-normal";
const MAIN_CLASS = "block truncate text-[13px] font-semibold";
const SUB_CLASS = "block truncate text-[11px] text-muted-foreground";
const MENU_CLASS = "sticky right-0 w-[48px] bg-card px-2 text-right";

/** Figma "PRM / Status Pill" ของแคมเปญลดราคา */
export function SaleStatusPill({ status }: { status: SaleStatus }) {
  useLanguage();
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
  useLanguage();
  return (
    <Table className="min-w-[940px] table-fixed">
      <TableHeader>
        <TableRow className="bg-muted hover:bg-muted">
          {HEADERS.map((head) => (
            <TableHead key={head.label} className={cn(HEAD_CLASS, head.width)}>
              {head.label}
            </TableHead>
          ))}
          <TableHead className={cn(HEAD_CLASS, MENU_CLASS, "bg-muted")}>
            <span className="sr-only">{translate("จัดการ", "Manage")}</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sales.map((sale) => (
          <SaleRow key={sale.id} sale={sale} scopeNames={scopeNames} now={now} onAction={onAction} />
        ))}
      </TableBody>
    </Table>
  );
}

function SaleRow({
  sale,
  scopeNames,
  now,
  onAction,
}: {
  sale: AdminSale;
  scopeNames: SaleScopeNames;
  now: number;
  onAction: (action: SaleRowAction, sale: AdminSale) => void;
}) {
  useLanguage();
  const isPlatform = sale.ownerType === "PLATFORM";
  const badge = saleTypeBadge(sale);
  const percent = budgetPercent(sale);
  const finished = isFinished(sale.status);
  const paused = sale.status === "PAUSED";
  const budgetOut = sale.status === "BUDGET_EXHAUSTED" || sale.status === "SOLD_OUT" || (percent ?? 0) >= 100;

  return (
    <TableRow className="h-[60px]">
      <TableCell className={CELL_CLASS}>
        <div className="flex min-w-0 items-center gap-1.5">
          <strong className="truncate text-[13px] font-bold">{sale.name}</strong>
          <PromotionOwnerTag owner={sale.ownerType} />
        </div>
        <span className={SUB_CLASS} title={saleSubtitle(sale)}>
          {saleSubtitle(sale)}
        </span>
      </TableCell>
      <TableCell className={CELL_CLASS}>
        <SaleBadge type={badge.type} label={badge.label} />
      </TableCell>
      <TableCell className={CELL_CLASS}>
        <span className={MAIN_CLASS}>{saleDiscountLabel(sale)}</span>
        <span className={SUB_CLASS}>{saleDiscountDetail(sale)}</span>
      </TableCell>
      <TableCell className={CELL_CLASS}>
        <span className={MAIN_CLASS} title={saleScopeLabel(sale, scopeNames)}>
          {saleScopeLabel(sale, scopeNames)}
        </span>
        <span className={SUB_CLASS} title={saleScopeDetail(sale)}>
          {saleScopeDetail(sale)}
        </span>
      </TableCell>
      <TableCell className={CELL_CLASS}>
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
            ? `เข้าร่วม ${sale.listingCount.toLocaleString("th-TH")} listing`
            : sale.status === "SOLD_OUT"
              ? "ขายหมดทุก listing"
              : sale.status === "BUDGET_EXHAUSTED"
                ? "จบเพราะงบหมด"
                : `ขายแล้ว ${sale.soldUnits.toLocaleString("th-TH")} ชิ้น`}
        </span>
      </TableCell>
      <TableCell className={CELL_CLASS}>
        <span className={MAIN_CLASS}>{salePeriod(sale)}</span>
        <span className={SUB_CLASS} title={salePeriodHint(sale, now)}>
          {salePeriodHint(sale, now)}
        </span>
      </TableCell>
      <TableCell className={CELL_CLASS}>
        <SaleStatusPill status={sale.status} />
      </TableCell>
      <TableCell className={cn(CELL_CLASS, MENU_CLASS)}>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`จัดการ ${sale.name}`} />}>
            <MoreVertical className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={4} className="w-44 min-w-44">
            {isPlatform && !finished ? (
              <DropdownMenuItem render={<Link to={`/admin/sales/${sale.id}/edit`} />}>{translate("แก้ไข", "Edit")}</DropdownMenuItem>
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
                {paused ? translate("เปิดอีกครั้ง", "Reopen") : isPlatform ? translate("หยุดชั่วคราว", "Paused") : "หยุดการลดราคาของร้าน"}
              </DropdownMenuItem>
            ) : null}
            {!finished && sale.status !== "SCHEDULED" ? (
              <DropdownMenuItem onClick={() => onAction("end", sale)}>จบทันที</DropdownMenuItem>
            ) : null}
            {isPlatform ? (
              <DropdownMenuItem variant="destructive" onClick={() => onAction("delete", sale)}>
                {translate("ลบ", "Delete")}</DropdownMenuItem>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}
