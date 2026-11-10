import { X } from "lucide-react";
import { Link } from "react-router-dom";

import { ErrorState } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";

import { useAuditLogs } from "../audit.queries";
import type { AuditLogEntry } from "../audit.types";
import { ActivityTimeline, ActivityTimelineSkeleton } from "./ActivityTimeline";
import { useTranslate } from "@/lib/i18n";

/** แถวล่าสุดต่อแหล่ง — ที่เก่ากว่านั้นดูต่อได้ในหน้าบันทึกกิจกรรม */
const SHOWN = 20;
const DEFAULT_RATE_KEY = "commission.default_rate";

type CommissionHistorySheetProps = {
  open: boolean;
  onClose: () => void;
  onSelect: (entry: AuditLogEntry) => void;
};

/**
 * "ดูประวัติการแก้ไข" ของหน้าค่าคอมมิชชั่น — การเปลี่ยนกฎค่าคอมมิชชั่นและอัตราพื้นฐาน
 * API กรอง "กฎ หรือ setting ตัวนี้" ใน query เดียวไม่ได้ จึงยิงสองตัวแล้วรวมเรียงใหม่สุดก่อน
 * ยิงเฉพาะตอนเปิด Sheet
 */
export function CommissionHistorySheet({ open, onClose, onSelect }: CommissionHistorySheetProps) {
  const { t } = useTranslate("admin");
  const rules = useAuditLogs({ targetType: ["COMMISSION_RULE"], page: 0, size: SHOWN }, { enabled: open });
  const defaultRate = useAuditLogs(
    { targetType: ["SETTING"], targetId: DEFAULT_RATE_KEY, page: 0, size: SHOWN },
    { enabled: open },
  );

  const entries =
    rules.data && defaultRate.data
      ? [...rules.data.items, ...defaultRate.data.items]
          .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt) || b.id - a.id)
          .slice(0, SHOWN)
      : null;
  const error = rules.error ?? defaultRate.error;

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <SheetContent
        showCloseButton={false}
        className="gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-[520px] **:data-[slot=button]:rounded-md"
      >
        <header className="flex items-center border-b border-muted py-[18px] pr-4 pl-6">
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <SheetTitle className="text-[15px] font-bold text-foreground">{t("commission.history.title", "ประวัติการแก้ไขค่าคอมมิชชั่น")}</SheetTitle>
            <SheetDescription className="text-[11px] text-[#9aa5ad]">
              {t("commission.history.description", "กฎค่าคอมมิชชั่นและอัตราเริ่มต้น {count} รายการล่าสุด", { count: SHOWN })}
            </SheetDescription>
          </div>
          <SheetClose
            render={
              <Button variant="ghost" size="icon-sm" aria-label={t("commission.history.close", "ปิด")} className="size-7 rounded-[7px] text-muted-foreground" />
            }
          >
            <X />
          </SheetClose>
        </header>

        <div className="flex-1 overflow-y-auto">
          {error ? (
            <div className="p-6">
              <ErrorState
                error={error}
                title={t("refunds.history.loadFailed", "โหลดประวัติไม่สำเร็จ")}
                onRetry={() => {
                  void rules.refetch();
                  void defaultRate.refetch();
                }}
                className="min-h-0 border-0"
              />
            </div>
          ) : entries === null ? (
            <ActivityTimelineSkeleton rows={4} />
          ) : entries.length === 0 ? (
            <p className="px-6 py-10 text-center text-xs text-muted-foreground">{t("commission.history.empty", "ยังไม่มีการแก้ไขค่าคอมมิชชั่น")}</p>
          ) : (
            <ActivityTimeline entries={entries} onSelect={onSelect} />
          )}
        </div>

        <footer className="border-t border-muted px-6 py-3">
          <Button variant="ghost" className="rounded-md px-2.5" render={<Link to="/admin/activity-log?q=commission&range=all" />}>
            {t("commission.history.viewAll", "ดูทั้งหมดในบันทึกกิจกรรม")}
          </Button>
        </footer>
      </SheetContent>
    </Sheet>
  );
}
