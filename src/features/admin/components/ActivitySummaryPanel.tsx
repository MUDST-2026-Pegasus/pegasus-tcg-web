import { LockKeyhole } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { actorAccent, actorInitials, countImportant } from "../audit.format";
import { useAuditSummary } from "../audit.queries";
import { formatCount } from "../catalog.format";
import { SellerAvatar } from "./SellerAvatar";

type ActivitySummaryPanelProps = {
  /** เที่ยงคืนวันนี้ตามเวลาเครื่อง (ISO) */
  todayStart: string;
};

/**
 * คอลัมน์ขวาของหน้าบันทึกกิจกรรม — สรุปวันนี้, ผู้ดูแลที่ใช้งานมากสุด และหมายเหตุว่าแก้ไขไม่ได้
 * ตัวเลขมาจาก `GET /admin/audit-logs/summary` ของวันนี้ ไม่ขึ้นกับตัวกรองทางซ้าย
 * ("เข้าสู่ระบบล้มเหลว" ในดีไซน์ยังไม่มีข้อมูลจาก backend จึงไม่แสดง)
 */
export function ActivitySummaryPanel({ todayStart }: ActivitySummaryPanelProps) {
  const summary = useAuditSummary(todayStart);
  const data = summary.data;

  return (
    <aside className="flex w-full flex-col gap-4 lg:w-[300px] lg:shrink-0">
      <Card className="gap-0 rounded-xl border border-border p-5 shadow-none ring-0">
        <h2 className="pb-3.5 text-[15px] font-semibold text-foreground">สรุปวันนี้</h2>
        {summary.isError ? (
          <p className="text-xs text-muted-foreground">โหลดสรุปไม่สำเร็จ</p>
        ) : (
          <dl className="flex flex-col gap-3 text-[13px]">
            <SummaryRow label="เหตุการณ์ทั้งหมด" value={data?.total} className="text-foreground" />
            <SummaryRow label="การกระทำของผู้ดูแล" value={data?.byAdmins} className="text-[#0058bc]" />
            <SummaryRow
              label="เหตุการณ์สำคัญ"
              value={data ? countImportant(data.byAction) : undefined}
              className="text-[#d0342c]"
            />
            <SummaryRow label="งานอัตโนมัติของระบบ" value={data?.bySystem} className="text-[#b45309]" />
          </dl>
        )}
      </Card>

      <Card className="gap-0 rounded-xl border border-border p-5 shadow-none ring-0">
        <h2 className="pb-3.5 text-[15px] font-semibold text-foreground">ผู้ดูแลที่ใช้งานมากสุด</h2>
        {summary.isPending ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-9" />
            <Skeleton className="h-9" />
          </div>
        ) : !data || data.topActors.length === 0 ? (
          <p className="text-xs text-muted-foreground">วันนี้ยังไม่มีผู้ดูแลทำรายการ</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {data.topActors.map((actor) => {
              const entry = { actor };
              return (
                <li key={actor.userId} className="flex items-center gap-2.5">
                  <SellerAvatar initials={actorInitials(entry)} accent={actorAccent(entry)} className="size-8" />
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-[13px] font-semibold text-foreground">{actor.username}</span>
                    <span className="text-[11px] text-[#9aa5ad]">{formatCount(actor.count)} การกระทำ</span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Card className="gap-1.5 rounded-xl border border-border p-5 shadow-none ring-0">
        <p className="flex items-center gap-1.5 text-[13px] font-semibold text-foreground">
          <LockKeyhole className="size-4" aria-hidden />
          บันทึกนี้แก้ไขไม่ได้
        </p>
        <p className="text-xs leading-5 text-muted-foreground">
          ทุกเหตุการณ์ถูกเขียนแบบ append-only ผู้ดูแลไม่สามารถลบหรือแก้ไขได้ เพื่อใช้ตรวจสอบย้อนหลัง
        </p>
      </Card>
    </aside>
  );
}

function SummaryRow({ label, value, className }: { label: string; value: number | undefined; className: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={cn("text-[15px] font-semibold tabular-nums", className)}>
        {value === undefined ? <Skeleton className="h-4 w-8" /> : formatCount(value)}
      </dd>
    </div>
  );
}
