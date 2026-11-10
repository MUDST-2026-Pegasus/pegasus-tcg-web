import { ArrowRight, ExternalLink, X } from "lucide-react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

import {
  AUDIT_TONE_META,
  TARGET_TYPE_LABEL,
  actionLabel,
  actionTone,
  actorName,
  formatFullDateTime,
  metadataRows,
  targetHref,
  targetLabel,
} from "../audit.format";
import type { AuditLogEntry } from "../audit.types";

type AuditEntrySheetProps = {
  entry: AuditLogEntry | null;
  onClose: () => void;
};

/**
 * Sheet ขวา 440px — รายละเอียดหนึ่งเหตุการณ์
 * metadata แสดงเป็น "ค่าเดิม → ค่าใหม่" หรือคู่ชื่อ/ค่า ไม่ใช่ JSON ดิบ
 */
export function AuditEntrySheet({ entry, onClose }: AuditEntrySheetProps) {
  return (
    <Sheet
      open={entry !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent
        showCloseButton={false}
        className="gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-[440px] **:data-[slot=button]:rounded-md"
      >
        <header className="flex items-center border-b border-muted py-[18px] pr-4 pl-6">
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <SheetTitle className="text-[15px] font-bold text-foreground">รายละเอียดกิจกรรม</SheetTitle>
            <SheetDescription className="text-[11px] text-[#9aa5ad]">
              {entry ? `บันทึก #${entry.id}` : "รายละเอียดกิจกรรม"}
            </SheetDescription>
          </div>
          <SheetClose
            render={
              <Button variant="ghost" size="icon-sm" aria-label="ปิด" className="size-7 rounded-[7px] text-muted-foreground" />
            }
          >
            <X />
          </SheetClose>
        </header>

        {entry ? <AuditEntryBody entry={entry} /> : null}
      </SheetContent>
    </Sheet>
  );
}

function AuditEntryBody({ entry }: { entry: AuditLogEntry }) {
  const tone = AUDIT_TONE_META[actionTone(entry)];
  const href = targetHref(entry);
  const rows = metadataRows(entry.metadata);

  return (
    <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-5">
      <div className="flex flex-col gap-2">
        <Badge className={cn("h-5 w-fit rounded-md px-1.5 text-[10px] font-medium", tone.badgeClass)}>
          {tone.label}
        </Badge>
        <p className="text-[15px] leading-6 text-foreground">
          <span className="font-semibold">{actorName(entry)}</span> {actionLabel(entry)}
        </p>
      </div>

      <dl className="grid grid-cols-[96px_1fr] gap-x-3 gap-y-2.5 text-[13px]">
        <dt className="text-muted-foreground">เวลา</dt>
        <dd className="text-foreground">{formatFullDateTime(entry.occurredAt)}</dd>
        <dt className="text-muted-foreground">ผู้ทำ</dt>
        <dd className="text-foreground">
          {entry.actor ? `${entry.actor.displayName} (@${entry.actor.username})` : "ระบบ (งานอัตโนมัติ)"}
        </dd>
        <dt className="text-muted-foreground">เป้าหมาย</dt>
        <dd className="text-foreground">
          {TARGET_TYPE_LABEL[entry.targetType] ?? entry.targetType} · {targetLabel(entry)}
        </dd>
        {entry.ipAddress ? (
          <>
            <dt className="text-muted-foreground">IP</dt>
            <dd className="font-mono text-xs text-foreground">{entry.ipAddress}</dd>
          </>
        ) : null}
      </dl>

      {rows.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h3 className="text-xs font-semibold text-foreground">รายละเอียดที่บันทึกไว้</h3>
          <ul className="flex flex-col divide-y divide-muted rounded-lg border border-border">
            {rows.map((row) => (
              <li key={row.key} className="flex flex-col gap-1 px-3.5 py-2.5 text-[13px]">
                <span className="text-xs text-muted-foreground">{row.label}</span>
                {row.kind === "change" ? (
                  <span className="flex flex-wrap items-center gap-1.5 break-all text-foreground">
                    <span className="text-muted-foreground line-through decoration-muted-foreground/50">
                      {row.before}
                    </span>
                    <ArrowRight aria-label="เปลี่ยนเป็น" className="size-3.5 shrink-0 text-muted-foreground" />
                    <span className="font-medium">{row.after}</span>
                  </span>
                ) : (
                  <span className="break-all text-foreground">{row.value}</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <p className="text-[11px] leading-4 text-muted-foreground">
        ข้อความต้นฉบับจากระบบ: {entry.summary}
      </p>

      {href ? (
        <Button variant="outline" className="w-fit rounded-md px-2.5" render={<Link to={href} />}>
          <ExternalLink data-icon="inline-start" />
          ไปที่หน้าที่เกี่ยวข้อง
        </Button>
      ) : null}
    </div>
  );
}
