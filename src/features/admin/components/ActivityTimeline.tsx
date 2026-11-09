import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import {
  AUDIT_TONE_META,
  actionLabel,
  actionTone,
  actorAccent,
  actorInitials,
  actorName,
  formatClock,
  formatFullDateTime,
  groupByDay,
  targetHint,
  targetLabel,
} from "../audit.format";
import type { AuditLogEntry } from "../audit.types";
import { SellerAvatar } from "./SellerAvatar";

type ActivityTimelineProps = {
  entries: AuditLogEntry[];
  onSelect: (entry: AuditLogEntry) => void;
  /** วันนี้ตามเครื่อง — ส่งมาได้ในเทสต์ */
  now?: Date;
  /** ทำให้จางลงระหว่างรอหน้าใหม่ (ข้อมูลเก่ายังโชว์อยู่) */
  dimmed?: boolean;
};

/**
 * timeline แบ่งตามวัน ตามดีไซน์ "บันทึกกิจกรรม" — หัววันพื้นเทา แถวละเหตุการณ์
 * เวลา · จุดสีตามระดับ · วงกลมตัวย่อผู้ทำ · ข้อความ · ป้ายเป้าหมาย + ป้ายระดับ
 * ทั้งแถวกดได้ เปิด Sheet รายละเอียด
 */
export function ActivityTimeline({ entries, onSelect, now, dimmed }: ActivityTimelineProps) {
  const groups = groupByDay(entries, now);

  return (
    <div className={cn("flex flex-col transition-opacity", dimmed && "opacity-60")}>
      {groups.map((group) => (
        <section key={group.key} aria-label={group.heading} className="flex flex-col">
          <h2 className="border-b border-muted bg-muted/50 px-5 py-2.5 text-xs font-semibold text-foreground">
            {group.heading}
          </h2>
          <ul className="flex flex-col">
            {group.entries.map((entry) => (
              <li key={entry.id} className="border-b border-muted last:border-b-0">
                <ActivityRow entry={entry} onSelect={onSelect} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

type ActivityRowProps = {
  entry: AuditLogEntry;
  onSelect: (entry: AuditLogEntry) => void;
};

export function ActivityRow({ entry, onSelect }: ActivityRowProps) {
  const tone = AUDIT_TONE_META[actionTone(entry)];
  const hint = targetHint(entry);

  return (
    <button
      type="button"
      onClick={() => onSelect(entry)}
      className="flex w-full items-start gap-3 px-5 py-3.5 text-left transition-colors hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none"
    >
      <Tooltip>
        <TooltipTrigger render={<span className="w-11 shrink-0 pt-0.5 text-xs text-muted-foreground tabular-nums" />}>
          {formatClock(entry.occurredAt)}
        </TooltipTrigger>
        <TooltipContent>{formatFullDateTime(entry.occurredAt)}</TooltipContent>
      </Tooltip>

      <span aria-hidden className="flex w-2 shrink-0 flex-col items-center gap-1 self-stretch pt-1.5">
        <span className={cn("size-1.5 rounded-full", tone.dotClass)} />
        <span className="w-px flex-1 bg-border" />
      </span>

      <SellerAvatar
        initials={actorInitials(entry)}
        accent={actorAccent(entry)}
        className="size-7 text-xs"
      />

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <p className="text-[13px] leading-5 text-[#414755]">
          <span className="font-semibold text-foreground">{actorName(entry)}</span>{" "}
          {actionLabel(entry)}
        </p>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="max-w-full truncate rounded-md bg-muted px-2 py-0.5 text-[11px] text-foreground">
            {targetLabel(entry)}
            {hint ? ` · ${hint}` : null}
          </span>
          <Badge className={cn("h-5 rounded-md px-1.5 text-[10px] font-medium", tone.badgeClass)}>
            {tone.label}
          </Badge>
        </div>
      </div>
    </button>
  );
}

export function ActivityTimelineSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div aria-busy="true" className="flex flex-col">
      <Skeleton className="h-9 rounded-none" />
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex items-start gap-3 border-b border-muted px-5 py-3.5">
          <Skeleton className="h-4 w-10" />
          <Skeleton className="size-7 rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
