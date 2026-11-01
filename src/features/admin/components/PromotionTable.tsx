import { Link } from "react-router-dom";
import { House, MoreVertical } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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

export type PromotionRowAction = "copy" | "redemptions" | "pause" | "resume" | "delete";

type PromotionTableProps = {
  promotions: AdminPromotion[];
  /** ชื่อเกม/หมวด สำหรับคอลัมน์เงื่อนไข */
  scopeNames: ScopeNames;
  now: number;
  onAction: (action: PromotionRowAction, promotion: AdminPromotion) => void;
};

const HEADERS: Array<{ label: string; width: string }> = [
  { label: "โค้ด / แคมเปญ", width: "w-[22%]" },
  { label: "ส่วนลด", width: "w-[15%]" },
  { label: "เงื่อนไข", width: "w-[16%]" },
  { label: "ใช้ไปแล้ว", width: "w-[15%]" },
  { label: "ระยะเวลา", width: "w-[18%]" },
  { label: "สถานะ", width: "w-[14%]" },
];

const HEAD_CLASS = "h-10 px-3 text-xs font-medium text-muted-foreground";
const CELL_CLASS = "px-3 py-2.5 align-middle text-[13px] whitespace-normal";
const SUB_CLASS = "block truncate text-xs text-muted-foreground";
/** คอลัมน์เมนูติดขวา จอแคบเลื่อนตารางแล้วยังกดเมนูได้ */
const MENU_CLASS = "sticky right-0 w-[52px] bg-card px-2 text-right";

/** ตาราง Figma PRM-A1 — 900px พอดีการ์ดที่จอ 1280 แคบกว่านั้นเลื่อนตาราง */
export function PromotionTable({ promotions, scopeNames, now, onAction }: PromotionTableProps) {
  return (
    <Table className="min-w-[900px] table-fixed">
      <TableHeader>
        <TableRow className="bg-muted hover:bg-muted">
          {HEADERS.map((head) => (
            <TableHead key={head.label} className={cn(HEAD_CLASS, head.width)}>
              {head.label}
            </TableHead>
          ))}
          <TableHead className={cn(HEAD_CLASS, MENU_CLASS, "bg-muted")}>
            <span className="sr-only">จัดการ</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {promotions.map((promotion) => (
          <PromotionRow
            key={promotion.id}
            promotion={promotion}
            scopeNames={scopeNames}
            now={now}
            onAction={onAction}
          />
        ))}
      </TableBody>
    </Table>
  );
}

function PromotionRow({
  promotion,
  scopeNames,
  now,
  onAction,
}: {
  promotion: AdminPromotion;
  scopeNames: ScopeNames;
  now: number;
  onAction: PromotionTableProps["onAction"];
}) {
  const isPlatform = promotion.ownerType === "PLATFORM";
  const paused = promotion.status === "PAUSED";
  const full = isUsageFull(promotion);

  return (
    <TableRow className="h-[60px]">
      <TableCell className={CELL_CLASS}>
        <div className="flex min-w-0 items-center gap-2">
          <strong className="truncate text-sm tracking-wide">{promotion.code}</strong>
          <PromotionOwnerTag owner={promotion.ownerType} />
          {promotion.featuredOnHome ? (
            <House className="size-3.5 shrink-0 text-primary" aria-label="แสดงบนหน้าแรก" />
          ) : null}
        </div>
        <span className={SUB_CLASS} title={promotionSubtitle(promotion)}>
          {promotionSubtitle(promotion)}
        </span>
      </TableCell>
      <TableCell className={CELL_CLASS}>
        <span className="block text-sm font-semibold">{discountLabel(promotion)}</span>
        <span className={SUB_CLASS}>{discountCapLabel(promotion)}</span>
      </TableCell>
      <TableCell className={CELL_CLASS}>
        <span className="block">{minSpendLabel(promotion.minSpend)}</span>
        <span className={SUB_CLASS}>{conditionDetail(promotion, scopeNames)}</span>
      </TableCell>
      <TableCell className={CELL_CLASS}>
        <span className="block">
          {promotion.usedCount.toLocaleString("th-TH")} / {limitLabel(promotion.usageLimitTotal)}
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
            เก็บแล้ว {promotion.claimedCount.toLocaleString("th-TH")} / {limitLabel(promotion.claimLimit)}
          </span>
        ) : null}
      </TableCell>
      <TableCell className={CELL_CLASS}>
        <span
          className="block truncate"
          title={`${formatPromoDate(promotion.startsAt)} – ${formatPromoDate(promotion.endsAt)}`}
        >
          {formatPeriod(promotion.startsAt, promotion.endsAt)}
        </span>
        <span className={SUB_CLASS}>{periodHint(promotion, now)}</span>
      </TableCell>
      <TableCell className={CELL_CLASS}>
        <PromotionStatusPill status={promotion.status} />
      </TableCell>
      <TableCell className={cn(CELL_CLASS, MENU_CLASS)}>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="ghost" size="icon-sm" aria-label={`จัดการ ${promotion.code}`} />}
          >
            <MoreVertical className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={4} className="w-40 min-w-40">
            {isPlatform ? (
              <DropdownMenuItem render={<Link to={`/admin/promotions/${promotion.id}/edit`} />}>แก้ไข</DropdownMenuItem>
            ) : null}
            <DropdownMenuItem onClick={() => onAction("redemptions", promotion)}>ดูการใช้โค้ด</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAction("copy", promotion)}>คัดลอกโค้ด</DropdownMenuItem>
            <DropdownMenuItem
              className={paused ? undefined : "text-[#b45309] data-highlighted:text-[#b45309]"}
              onClick={() => onAction(paused ? "resume" : "pause", promotion)}
            >
              {paused ? "เปิดใช้อีกครั้ง" : "หยุดชั่วคราว"}
            </DropdownMenuItem>
            {isPlatform ? (
              <DropdownMenuItem variant="destructive" onClick={() => onAction("delete", promotion)}>
                ลบ
              </DropdownMenuItem>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}
