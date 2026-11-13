import { useState } from "react";

import { History } from "lucide-react";
import { useSearchParams } from "react-router-dom";

import { EmptyState, QueryBoundary } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useTranslate } from "@/lib/i18n";

import {
  AUDIT_CATEGORIES,
  AUDIT_RANGES,
  type AuditCategory,
  type AuditRange,
  rangeStart,
} from "../audit.format";
import { useAuditLogs } from "../audit.queries";
import type { AuditLogEntry } from "../audit.types";
import { formatCount } from "../catalog.format";
import { ActivityLogToolbar, type ActivityFilters } from "./ActivityLogToolbar";
import { ActivitySummaryPanel } from "./ActivitySummaryPanel";
import { ActivityTimeline, ActivityTimelineSkeleton } from "./ActivityTimeline";
import { AuditEntrySheet } from "./AuditEntrySheet";
import { CatalogPagination } from "./CatalogPagination";

const PAGE_SIZE = 20;
const DEFAULT_RANGE: AuditRange = "7d";

/** ค่าที่ไม่รู้จักใน URL (พิมพ์มาเอง/ลิงก์เก่า) ถือว่าไม่ได้กรอง */
function readActivityFilters(params: URLSearchParams): ActivityFilters & { page: number } {
  const category = params.get("type");
  const range = params.get("range");
  const page = Number(params.get("page") ?? "1");
  return {
    q: params.get("q") ?? "",
    category: category && category in AUDIT_CATEGORIES ? (category as AuditCategory) : null,
    range: range && range in AUDIT_RANGES ? (range as AuditRange) : DEFAULT_RANGE,
    page: Number.isInteger(page) && page > 0 ? page - 1 : 0,
  };
}

type AdminActivityLogContentProps = {
  /** "ตอนนี้" ของหน้า — ส่งมาได้ในเทสต์ */
  now?: Date;
};

/**
 * บันทึกกิจกรรม — ทุกการกระทำของผู้ดูแลและระบบจาก `GET /admin/audit-logs`
 * ตัวกรองและหน้าปัจจุบันอยู่ใน URL (`q`, `type`, `range`, `page`)
 */
export function AdminActivityLogContent({ now }: AdminActivityLogContentProps) {
  const { t } = useTranslate("admin");
  const [searchParams, setSearchParams] = useSearchParams();
  const { page, ...filters } = readActivityFilters(searchParams);
  // คำนวณครั้งเดียวต่อการเปิดหน้า ไม่งั้น query key เปลี่ยนทุก render
  const [today] = useState(() => now ?? new Date());
  const [selected, setSelected] = useState<AuditLogEntry | null>(null);

  const logs = useAuditLogs({
    q: filters.q || undefined,
    targetType: filters.category ? [...AUDIT_CATEGORIES[filters.category].targetTypes] : undefined,
    from: rangeStart(filters.range, today),
    page,
    size: PAGE_SIZE,
  });

  function writeParams(changes: Partial<ActivityFilters> & { page?: number }) {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        const set = (key: string, value: string | null | undefined) =>
          value ? next.set(key, value) : next.delete(key);
        if ("q" in changes) set("q", changes.q);
        if ("category" in changes) set("type", changes.category);
        if ("range" in changes) set("range", changes.range === DEFAULT_RANGE ? null : changes.range);
        // เปลี่ยนตัวกรองแล้วกลับไปหน้าแรก
        set("page", changes.page ? String(changes.page + 1) : null);
        return next;
      },
      { replace: true },
    );
  }

  const filtered = Boolean(filters.q || filters.category || filters.range !== DEFAULT_RANGE);
  const clearFilters = () => writeParams({ q: "", category: null, range: DEFAULT_RANGE });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-[26px] leading-tight font-bold tracking-[-0.5px] text-foreground">
          {t("audit.pageTitle", "บันทึกกิจกรรม")}
        </h1>
        <p className="text-[13px] text-muted-foreground">
          {t("audit.pageDesc", "บันทึกทุกการกระทำของผู้ดูแลและระบบ · แก้ไขหรือลบไม่ได้")}
        </p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <ActivityLogToolbar filters={filters} onChange={writeParams} />

          <Card className="gap-0 overflow-hidden rounded-xl border border-border p-0 shadow-none ring-0">
            <QueryBoundary
              query={logs}
              loading={<ActivityTimelineSkeleton />}
              errorTitle={t("audit.loadErrorTitle", "โหลดบันทึกกิจกรรมไม่สำเร็จ")}
              errorMessage={t(
                "audit.loadErrorDesc",
                "เครือข่ายขัดข้องหรือเซสชันหมดอายุ — ตัวกรองที่เลือกไว้ยังอยู่ใน URL",
              )}
              isEmpty={(result) => result.items.length === 0}
              empty={<ActivityEmpty filtered={filtered} onClear={clearFilters} />}
            >
              {(result) => (
                <ActivityTimeline
                  entries={result.items}
                  onSelect={setSelected}
                  now={today}
                  dimmed={logs.isPlaceholderData}
                />
              )}
            </QueryBoundary>
          </Card>

          {logs.data && logs.data.totalItems > 0 ? (
            <div className="flex flex-col gap-1">
              <p className="text-xs text-muted-foreground">
                {t("audit.totalEventsCount", "ทั้งหมด {count} เหตุการณ์", {
                  count: formatCount(logs.data.totalItems),
                })}
              </p>
              <CatalogPagination
                page={logs.data.page + 1}
                totalPages={logs.data.totalPages}
                disabled={logs.isPlaceholderData}
                onPageChange={(next) => writeParams({ page: next - 1 })}
              />
            </div>
          ) : null}
        </div>

        <ActivitySummaryPanel todayStart={rangeStart("today", today) ?? today.toISOString()} />
      </div>

      <AuditEntrySheet entry={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function ActivityEmpty({ filtered, onClear }: { filtered: boolean; onClear: () => void }) {
  const { t } = useTranslate("admin");

  return (
    <EmptyState
      icon={History}
      title={
        filtered
          ? t("audit.empty.filteredTitle", "ไม่พบกิจกรรมที่ตรงกับตัวกรอง")
          : t("audit.empty.title", "ยังไม่มีกิจกรรม")
      }
      description={
        filtered
          ? t("audit.empty.filteredDesc", "ลองเปลี่ยนคำค้นหา ประเภท หรือขยายช่วงเวลา")
          : t("audit.empty.desc", "เมื่อผู้ดูแลหรือระบบทำรายการ เหตุการณ์จะขึ้นที่นี่")
      }
      className="min-h-[320px] border-0"
    >
      {filtered ? (
        <Button variant="outline" className="rounded-md px-2.5" onClick={onClear}>
          {t("audit.filter.clear", "ล้างตัวกรอง")}
        </Button>
      ) : null}
    </EmptyState>
  );
}
