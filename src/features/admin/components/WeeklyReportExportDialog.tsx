import { useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { downloadBlob } from "@/lib/download";
import { useTranslate } from "@/lib/i18n";
import { cn } from "@/lib/utils";

import { formatCount } from "../catalog.format";
import { formatReportBaht, weekRangeLabel } from "../weekly-report.format";
import { useExportWeeklyReport } from "../weekly-report.queries";
import type {
  WeeklyReport,
  WeeklyReportExportDataset,
  WeeklyReportExportFormat,
  WeeklyReportFilters,
} from "../weekly-report.types";

type WeeklyReportExportDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: WeeklyReportFilters;
  gameLabel: string;
  report: WeeklyReport;
};

export function WeeklyReportExportDialog({
  open,
  onOpenChange,
  filters,
  gameLabel,
  report,
}: WeeklyReportExportDialogProps) {
  const { t } = useTranslate("admin");
  const [format, setFormat] = useState<WeeklyReportExportFormat>("csv");
  const [datasets, setDatasets] = useState<WeeklyReportExportDataset[]>(["kpi", "breakdown"]);
  const exportReport = useExportWeeklyReport();
  // `isPending` อัปเดตหลังเรนเดอร์รอบถัดไป คลิกซ้อนในจังหวะนั้นต้องกันด้วย ref
  const inFlight = useRef(false);

  const formats = useMemo<{ value: WeeklyReportExportFormat; label: string; hint: string }[]>(
    () => [
      {
        value: "csv",
        label: "CSV (.csv)",
        hint: t("weeklyReport.export.csvHint", "เหมาะสำหรับนำเข้าฐานข้อมูลหรือ Google Sheets"),
      },
      {
        value: "xlsx",
        label: "Excel (.xlsx)",
        hint: t("weeklyReport.export.xlsxHint", "เปิดดูต่อใน Excel ได้ทันที"),
      },
    ],
    [t],
  );

  const datasetsList = useMemo<{ value: WeeklyReportExportDataset; label: string }[]>(
    () => [
      {
        value: "kpi",
        label: t("weeklyReport.export.datasetKpi", "รวมข้อมูลสรุป KPI รายสัปดาห์"),
      },
      {
        value: "breakdown",
        label: t("weeklyReport.export.datasetBreakdown", "รวมตารางแยกตามเกมและประเภทสินค้า"),
      },
    ],
    [t],
  );

  const download = () => {
    if (inFlight.current || datasets.length === 0) return;
    inFlight.current = true;
    exportReport.mutate(
      { filters, format, datasets },
      {
        onSettled: () => {
          inFlight.current = false;
        },
        onSuccess: ({ blob, filename }) => {
          downloadBlob(blob, filename ?? `pegasus_weekly_report_${filters.weekStart}.${format}`);
          toast.add({
            type: "success",
            title: t("weeklyReport.export.successToast", "ดาวน์โหลดรายงานสำเร็จ"),
          });
          onOpenChange(false);
        },
        onError: () => {
          toast.add({
            type: "error",
            title: t("weeklyReport.export.errorToastTitle", "ส่งออกรายงานไม่สำเร็จ"),
            description: t("weeklyReport.export.errorToastDesc", "กรุณาลองใหม่อีกครั้ง"),
          });
        },
      },
    );
  };

  const summaryRows = [
    {
      label: t("weeklyReport.export.periodLabel", "ช่วงเวลา"),
      value: t("weeklyReport.weekNumber", "สัปดาห์ที่ {range}", {
        range: weekRangeLabel(filters.weekStart),
      }),
    },
    { label: t("weeklyReport.export.categoryLabel", "หมวดหมู่"), value: gameLabel },
    {
      label: t("weeklyReport.export.itemCountLabel", "จำนวนรายการ"),
      value: t(
        "weeklyReport.export.itemCountValue",
        "{count} หมวดหมู่ (ยอดขายรวม {total})",
        {
          count: formatCount(report.breakdownByGameAndType.length),
          total: formatReportBaht(report.totals.gmv),
        },
      ),
    },
  ];

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // ไฟล์กำลังสร้างอยู่ ปิดไม่ได้ ไม่งั้นผู้ใช้ไม่รู้ว่าดาวน์โหลดจะมาถึงเมื่อไร
        if (!exportReport.isPending) onOpenChange(next);
      }}
    >
      <DialogContent className="gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-[480px]">
        <DialogHeader className="border-b border-border px-6 py-5">
          <DialogTitle className="text-lg font-semibold">
            {t("weeklyReport.export.title", "ส่งออกรายงานสต็อกและกำไรรายสัปดาห์")}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-1.5 px-6 py-5">
          <dl className="rounded-[10px] border border-border bg-muted/50 px-4 py-3.5 text-[13px] leading-[26px]">
            {summaryRows.map((row) => (
              <div key={row.label} className="flex justify-between gap-4">
                <dt className="text-muted-foreground">{row.label}</dt>
                <dd className="text-right font-medium text-foreground">{row.value}</dd>
              </div>
            ))}
          </dl>

          <p id="weekly-export-format" className="pt-2 text-[13px] font-medium text-foreground">
            {t("weeklyReport.export.formatLabel", "รูปแบบไฟล์")}
          </p>
          <RadioGroup
            aria-labelledby="weekly-export-format"
            value={format}
            onValueChange={(value) => setFormat(value as WeeklyReportExportFormat)}
            className="grid grid-cols-2 gap-3"
          >
            {formats.map((option) => (
              <label
                key={option.value}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-[10px] border p-3.5",
                  format === option.value
                    ? "border-2 border-primary bg-[#eff6ff] p-[13px] dark:bg-primary/15"
                    : "border-border",
                )}
              >
                <RadioGroupItem value={option.value} className="mt-0.5" />
                <span className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium text-foreground">{option.label}</span>
                  <span className="text-xs text-muted-foreground">{option.hint}</span>
                </span>
              </label>
            ))}
          </RadioGroup>

          <p className="pt-3 text-[13px] font-medium text-foreground">
            {t("weeklyReport.export.datasetLabel", "ข้อมูลที่ต้องการรวม")}
          </p>
          {datasetsList.map((dataset) => (
            <label
              key={dataset.value}
              className="flex cursor-pointer items-center gap-2.5 py-0.5 text-sm text-foreground"
            >
              <Checkbox
                checked={datasets.includes(dataset.value)}
                onCheckedChange={(checked) =>
                  setDatasets((current) =>
                    checked
                      ? datasetsList
                          .map((item) => item.value)
                          .filter((value) => value === dataset.value || current.includes(value))
                      : current.filter((value) => value !== dataset.value),
                  )
                }
              />
              {dataset.label}
            </label>
          ))}
          {datasets.length === 0 ? (
            <p className="text-xs text-destructive">
              {t("weeklyReport.export.datasetRequired", "เลือกข้อมูลอย่างน้อย 1 ชุด")}
            </p>
          ) : null}
        </div>

        <DialogFooter className="m-0 rounded-none border-t border-border bg-background px-6 py-4">
          <Button
            variant="outline"
            className="h-[41px] rounded-lg px-4"
            disabled={exportReport.isPending}
            onClick={() => onOpenChange(false)}
          >
            {t("actions.cancel", "ยกเลิก", { ns: "common" })}
          </Button>
          <Button
            className="h-[41px] rounded-lg px-4"
            disabled={exportReport.isPending || datasets.length === 0}
            onClick={download}
          >
            {exportReport.isPending ? (
              <>
                <Spinner /> {t("weeklyReport.export.generating", "กำลังสร้างไฟล์...")}
              </>
            ) : (
              t("weeklyReport.export.submit", "ดาวน์โหลดรายงาน")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
