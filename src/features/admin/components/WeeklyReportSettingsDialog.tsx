import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { QueryBoundary } from "@/components/common";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { applyApiErrors } from "@/lib/form";
import { useTranslate } from "@/lib/i18n";
import { cn } from "@/lib/utils";

import {
  formatShare,
  STOCK_STATUS_BADGE,
  STOCK_STATUS_LABEL,
} from "../weekly-report.format";
import { useSaveWeeklyThresholds, useWeeklyThresholds } from "../weekly-report.queries";
import { weeklyThresholdsSchema, type WeeklyThresholdsValues } from "../weekly-report.schema";
import type { WeeklyStockStatus, WeeklyStockThresholds } from "../weekly-report.types";

type WeeklyReportSettingsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * เกณฑ์ที่ backend ใช้คำนวณสถานะสต็อกในรายงาน
 * ตัวฟอร์มอยู่ใน `DialogContent` ที่ถูก unmount ตอนปิด ค่าที่แก้ค้างจึงรีเซ็ตเอง
 */
export function WeeklyReportSettingsDialog({ open, onOpenChange }: WeeklyReportSettingsDialogProps) {
  const { t } = useTranslate("admin");
  const thresholds = useWeeklyThresholds(open);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-[440px]">
        <DialogHeader className="border-b border-border px-6 py-5">
          <DialogTitle className="text-lg font-semibold">
            {t("weeklyReport.settings.title", "ตั้งค่าเกณฑ์รายงานสต็อกและกำไร")}
          </DialogTitle>
        </DialogHeader>
        <QueryBoundary
          query={thresholds}
          loading={
            <div aria-busy="true" className="flex flex-col gap-4 px-6 py-5">
              {Array.from({ length: 3 }, (_, index) => (
                <Skeleton key={index} className="h-[70px] rounded-lg" />
              ))}
            </div>
          }
          errorTitle={t("weeklyReport.settings.loadError", "โหลดเกณฑ์รายงานไม่สำเร็จ")}
        >
          {(current) => <SettingsForm current={current} onClose={() => onOpenChange(false)} />}
        </QueryBoundary>
      </DialogContent>
    </Dialog>
  );
}

function StatusBadge({ status, children }: { status: WeeklyStockStatus; children: string }) {
  return (
    <Badge
      className={cn(
        "pointer-events-none absolute top-1/2 right-3 h-[22px] -translate-y-1/2 rounded-full px-2 text-xs",
        STOCK_STATUS_BADGE[status],
      )}
    >
      {children}
    </Badge>
  );
}

function SettingsForm({ current, onClose }: { current: WeeklyStockThresholds; onClose: () => void }) {
  const { t } = useTranslate("admin");
  const save = useSaveWeeklyThresholds();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<WeeklyThresholdsValues>({
    resolver: zodResolver(weeklyThresholdsSchema()),
    defaultValues: {
      lowStockThreshold: String(current.lowStockThreshold),
      fastMovingPercent: String(current.fastMovingPercent),
    },
  });

  const onSubmit = handleSubmit((values) => {
    save.mutate(
      {
        lowStockThreshold: Number(values.lowStockThreshold),
        fastMovingPercent: Number(values.fastMovingPercent),
      },
      {
        onSuccess: () => {
          toast.add({
            type: "success",
            title: t("weeklyReport.settings.saveSuccess", "บันทึกการตั้งค่าแล้ว"),
          });
          onClose();
        },
        onError: (error) => {
          if (!applyApiErrors(error, setError)) {
            toast.add({
              type: "error",
              title: t("weeklyReport.settings.saveErrorTitle", "บันทึกการตั้งค่าไม่สำเร็จ"),
              description: t("actions.retry", "กรุณาลองใหม่อีกครั้ง", { ns: "common" }),
            });
          }
        },
      },
    );
  });

  return (
    <form onSubmit={onSubmit} noValidate>
      <div className="flex flex-col gap-4 px-6 py-5">
        <Field data-invalid={Boolean(errors.lowStockThreshold) || undefined}>
          <FieldLabel htmlFor="low-stock-threshold">
            {t("weeklyReport.settings.lowStockLabel", "เกณฑ์แจ้งเตือนสต็อกต่ำ (ชิ้น)")}
          </FieldLabel>
          <div className="relative">
            <Input
              id="low-stock-threshold"
              inputMode="numeric"
              className="h-11 rounded-lg pr-24"
              aria-invalid={Boolean(errors.lowStockThreshold)}
              {...register("lowStockThreshold")}
            />
            <StatusBadge status="LOW_STOCK">{STOCK_STATUS_LABEL.LOW_STOCK}</StatusBadge>
          </div>
          <FieldError errors={[errors.lowStockThreshold]} />
        </Field>

        <Field data-invalid={Boolean(errors.fastMovingPercent) || undefined}>
          <FieldLabel htmlFor="fast-moving-percent">
            {t(
              "weeklyReport.settings.fastMovingLabel",
              "เกณฑ์สต็อกหมุนเวียนเร็ว (ยอดขายต่อสัปดาห์ > %)",
            )}
          </FieldLabel>
          <div className="relative">
            <Input
              id="fast-moving-percent"
              inputMode="numeric"
              className="h-11 rounded-lg pr-36"
              aria-invalid={Boolean(errors.fastMovingPercent)}
              {...register("fastMovingPercent")}
            />
            <StatusBadge status="FAST_MOVING">
              {t("weeklyReport.settings.fastMovingBadge", "สต็อกหมุนเวียนเร็ว")}
            </StatusBadge>
          </div>
          <FieldError errors={[errors.fastMovingPercent]} />
        </Field>

        <Field>
          <FieldLabel htmlFor="standard-commission-rate">
            {t("weeklyReport.settings.standardCommissionLabel", "อัตราค่าคอมมิชชั่นมาตรฐาน (%)")}
          </FieldLabel>
          <div className="relative">
            <Input
              id="standard-commission-rate"
              readOnly
              disabled
              className="h-11 rounded-lg bg-muted pr-44"
              value={formatShare(current.standardCommissionRatePercent)}
            />
            <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-muted-foreground">
              {t("weeklyReport.settings.standardCommissionHint", "อ้างอิงจากระบบค่าคอมมิชชั่น")}
            </span>
          </div>
        </Field>
      </div>

      <DialogFooter className="m-0 rounded-none border-t border-border bg-background px-6 py-4">
        <Button
          type="button"
          variant="outline"
          className="h-[41px] rounded-lg px-4"
          disabled={save.isPending}
          onClick={onClose}
        >
          {t("actions.cancel", "ยกเลิก", { ns: "common" })}
        </Button>
        <Button type="submit" className="h-[41px] rounded-lg px-4" disabled={save.isPending}>
          {save.isPending ? (
            <>
              <Spinner /> {t("weeklyReport.settings.saving", "กำลังบันทึก...")}
            </>
          ) : (
            t("weeklyReport.settings.saveButton", "บันทึกการตั้งค่า")
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}
