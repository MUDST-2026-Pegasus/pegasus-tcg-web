import { useState } from "react";

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
import { cn } from "@/lib/utils";

import { formatCount } from "../catalog.format";
import { formatReportBaht, weekRangeLabel } from "../weekly-report.format";
import { useExportWeeklyReport } from "../weekly-report.queries";
import type {
  WeeklyReport,
  WeeklyReportExportFormat,
  WeeklyReportFilters,
} from "../weekly-report.types";

const FORMATS: { value: WeeklyReportExportFormat; label: string; hint: string }[] = [
  { value: "csv", label: "CSV (.csv)", hint: "เหมาะสำหรับนำเข้าฐานข้อมูลหรือ Google Sheets" },
  { value: "xlsx", label: "Excel (.xlsx)", hint: "เปิดดูต่อใน Excel ได้ทันที" },
];

/** export ของ backend รวมข้อมูลสองชุดนี้เสมอ ยังเลือกทีละชุดไม่ได้ */
const INCLUDED_SECTIONS = ["รวมข้อมูลสรุป KPI รายสัปดาห์", "รวมตารางแยกตามเกมและประเภทสินค้า"];

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
  const [format, setFormat] = useState<WeeklyReportExportFormat>("csv");
  const exportReport = useExportWeeklyReport();

  const download = () => {
    exportReport.mutate(
      { filters, format },
      {
        onSuccess: ({ blob, filename }) => {
          downloadBlob(blob, filename ?? `pegasus_weekly_report_${filters.weekStart}.${format}`);
          toast.add({ type: "success", title: "ดาวน์โหลดรายงานสำเร็จ" });
          onOpenChange(false);
        },
        onError: () => {
          toast.add({
            type: "error",
            title: "ส่งออกรายงานไม่สำเร็จ",
            description: "กรุณาลองใหม่อีกครั้ง",
          });
        },
      },
    );
  };

  const summaryRows = [
    { label: "ช่วงเวลา", value: `สัปดาห์ที่ ${weekRangeLabel(filters.weekStart)}` },
    { label: "หมวดหมู่", value: gameLabel },
    {
      label: "จำนวนรายการ",
      value: `${formatCount(report.breakdownTable.length)} หมวดหมู่ (ยอดขายรวม ${formatReportBaht(report.totals.gmv)})`,
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
            ส่งออกรายงานสต็อกและกำไรรายสัปดาห์
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
            รูปแบบไฟล์
          </p>
          <RadioGroup
            aria-labelledby="weekly-export-format"
            value={format}
            onValueChange={(value) => setFormat(value as WeeklyReportExportFormat)}
            className="grid grid-cols-2 gap-3"
          >
            {FORMATS.map((option) => (
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

          <p className="pt-3 text-[13px] font-medium text-foreground">ข้อมูลที่ต้องการรวม</p>
          {INCLUDED_SECTIONS.map((section) => (
            <label key={section} className="flex items-center gap-2.5 py-0.5 text-sm text-foreground">
              <Checkbox checked disabled />
              {section}
            </label>
          ))}
        </div>

        <DialogFooter className="m-0 rounded-none border-t border-border bg-background px-6 py-4">
          <Button
            variant="outline"
            className="h-[41px] rounded-lg px-4"
            disabled={exportReport.isPending}
            onClick={() => onOpenChange(false)}
          >
            ยกเลิก
          </Button>
          <Button
            className="h-[41px] rounded-lg px-4"
            disabled={exportReport.isPending}
            onClick={download}
          >
            {exportReport.isPending ? (
              <>
                <Spinner /> กำลังสร้างไฟล์...
              </>
            ) : (
              "ดาวน์โหลดรายงาน"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
