import { Link } from "react-router-dom";

import { QueryBoundary } from "@/components/common";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useTranslate } from "@/lib/i18n";
import { cn } from "@/lib/utils";

import {
  AUDIT_TONE_META,
  actionLabel,
  actionTone,
  actorAccent,
  actorInitials,
  actorName,
  formatFullDateTime,
  formatRelative,
  targetLabel,
} from "../audit.format";
import { useAuditLogs } from "../audit.queries";
import { SellerAvatar } from "./SellerAvatar";

const SHOWN = 5;

/**
 * การ์ดฝั่งขวาของหน้าภาพรวม — กิจกรรมล่าสุด 5 รายการจาก `GET /admin/audit-logs`
 * ใช้ query และ formatter ชุดเดียวกับหน้าบันทึกกิจกรรม
 */
export function RecentActivityCard() {
  const { t } = useTranslate("admin");
  const logs = useAuditLogs({ page: 0, size: SHOWN });

  return (
    <Card className="w-full gap-0 rounded-xl border border-border p-0 shadow-none ring-0 lg:w-[400px]">
      <div className="flex flex-col gap-0.5 px-[18px] pt-[18px] pb-3.5">
        <p className="text-[15px] font-semibold text-foreground">
          {t("audit.recentCard.title", "กิจกรรมล่าสุด")}
        </p>
        <p className="text-xs text-muted-foreground">
          {t("audit.recentCard.desc", "การกระทำล่าสุดของผู้ดูแลและระบบ")}
        </p>
      </div>

      <QueryBoundary
        query={logs}
        loading={<ActivitySkeleton />}
        errorTitle={t("audit.recentCard.loadError", "โหลดกิจกรรมล่าสุดไม่สำเร็จ")}
        isEmpty={(page) => page.items.length === 0}
        empty={
          <p className="px-[18px] py-6 text-center text-xs text-muted-foreground">
            {t("audit.recentCard.empty", "ยังไม่มีกิจกรรม")}
          </p>
        }
      >
        {(page) => (
          <ul className="flex flex-col">
            {page.items.map((entry) => {
              const tone = AUDIT_TONE_META[actionTone(entry)];
              return (
                <li key={entry.id} className="flex items-start gap-3 border-t border-muted px-[18px] py-3 first:border-t-0">
                  <SellerAvatar initials={actorInitials(entry)} accent={actorAccent(entry)} className="size-7 text-xs" />
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="text-xs font-semibold text-foreground">{actorName(entry)}</p>
                      <Tooltip>
                        <TooltipTrigger render={<p className="text-[11px] text-[#9aa5ad]" />}>
                          · {formatRelative(entry.occurredAt)}
                        </TooltipTrigger>
                        <TooltipContent>{formatFullDateTime(entry.occurredAt)}</TooltipContent>
                      </Tooltip>
                    </div>
                    <p className="text-xs leading-[17px] text-[#414755]">
                      {actionLabel(entry)} · {targetLabel(entry)}
                    </p>
                    <Badge className={cn("h-5 w-fit rounded-full px-2 text-[11px]", tone.badgeClass)}>
                      {tone.label}
                    </Badge>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </QueryBoundary>

      <div className="px-[18px] pt-3 pb-4">
        <Button variant="ghost" className="rounded-md px-2.5" render={<Link to="/admin/activity-log" />}>
          {t("audit.recentCard.viewAll", "ดูบันทึกกิจกรรมทั้งหมด")}
        </Button>
      </div>
    </Card>
  );
}

function ActivitySkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-3 px-[18px] py-3">
      {Array.from({ length: 3 }, (_, index) => (
        <Skeleton key={index} className="h-14 rounded-md" />
      ))}
    </div>
  );
}
