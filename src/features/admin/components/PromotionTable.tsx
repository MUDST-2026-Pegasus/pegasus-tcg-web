import { Link } from "react-router-dom";
import { House, MoreVertical } from "lucide-react";

import { Button } from "@/components/ui/button";
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

const HEADERS = ["โค้ด / แคมเปญ", "ส่วนลด", "เงื่อนไข", "ใช้ไปแล้ว", "ระยะเวลา", "สถานะ"];

/** ตาราง Figma PRM-A1 — คอลัมน์เมนูติดขวาเสมอ จอแคบเลื่อนตารางแล้วยังกดเมนูได้ */
export function PromotionTable({ promotions, scopeNames, now, onAction }: PromotionTableProps) {
  return (
    <div className="promotion-table-scroll">
      <table className="promotion-table">
        <thead>
          <tr>
            {HEADERS.map((head) => (
              <th key={head} scope="col">
                {head}
              </th>
            ))}
            <th scope="col">
              <span className="sr-only">จัดการ</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {promotions.map((promotion) => (
            <PromotionRow
              key={promotion.id}
              promotion={promotion}
              scopeNames={scopeNames}
              now={now}
              onAction={onAction}
            />
          ))}
        </tbody>
      </table>
    </div>
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
    <tr>
      <td>
        <div className="flex min-w-0 items-center gap-2">
          <strong className="truncate text-sm tracking-wide">{promotion.code}</strong>
          <PromotionOwnerTag owner={promotion.ownerType} />
          {promotion.featuredOnHome ? (
            <House className="size-3.5 shrink-0 text-primary" aria-label="แสดงบนหน้าแรก" />
          ) : null}
        </div>
        <span className="promotion-cell-sub" title={promotionSubtitle(promotion)}>
          {promotionSubtitle(promotion)}
        </span>
      </td>
      <td>
        <span className="text-sm font-semibold">{discountLabel(promotion)}</span>
        <span className="promotion-cell-sub">{discountCapLabel(promotion)}</span>
      </td>
      <td>
        <span>{minSpendLabel(promotion.minSpend)}</span>
        <span className="promotion-cell-sub">{conditionDetail(promotion, scopeNames)}</span>
      </td>
      <td>
        <span>
          {promotion.usedCount.toLocaleString("th-TH")} / {limitLabel(promotion.usageLimitTotal)}
        </span>
        <span className="promotion-usage-bar" aria-hidden>
          <span
            className={cn(full ? "bg-destructive" : "bg-primary")}
            style={{ width: `${promotion.usageLimitTotal ? usagePercent(promotion) : 0}%` }}
          />
        </span>
        {promotion.claimable ? (
          <span className="promotion-cell-sub">
            เก็บแล้ว {promotion.claimedCount.toLocaleString("th-TH")} / {limitLabel(promotion.claimLimit)}
          </span>
        ) : null}
      </td>
      <td>
        <span
          className="block truncate"
          title={`${formatPromoDate(promotion.startsAt)} – ${formatPromoDate(promotion.endsAt)}`}
        >
          {formatPeriod(promotion.startsAt, promotion.endsAt)}
        </span>
        <span className="promotion-cell-sub">{periodHint(promotion, now)}</span>
      </td>
      <td>
        <PromotionStatusPill status={promotion.status} />
      </td>
      <td className="promotion-menu-cell">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="ghost" size="icon-sm" aria-label={`จัดการ ${promotion.code}`} />}
          >
            <MoreVertical className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={4} className="promotion-row-menu w-40 min-w-40">
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
      </td>
    </tr>
  );
}
