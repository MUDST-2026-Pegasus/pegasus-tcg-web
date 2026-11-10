import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { downloadBlob } from "@/lib/download";
import { useTranslate } from "@/lib/i18n";

import { useFileExport } from "../export";
import { downloadAdminOrdersCsv } from "../orders.api";
import {
  addDays,
  bangkokToday,
  DEFAULT_EXPORT_DAYS,
  EXPORT_ORDER_STATUSES,
  exportStatusFilter,
  orderExportRange,
} from "../orders.export";
import { ORDER_STATUS_LABEL } from "../orders.format";
import type { SellerOrderStatus } from "../orders.types";

type OrderExportDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * หน้าคำสั่งซื้อเป็น Kanban ไม่มีตัวกรองวันที่ จึงให้เลือกช่วงวันที่และสถานะก่อนส่งออก [TCG-749]
 * ค่าเริ่มต้น 30 วันล่าสุด ทุกสถานะ · วันที่ตามเวลาไทย และนับรวมวันสุดท้ายด้วย
 */
export function OrderExportDialog({ open, onOpenChange }: OrderExportDialogProps) {
  const { t } = useTranslate("admin");
  const [lastDay, setLastDay] = useState(() => bangkokToday());
  const [firstDay, setFirstDay] = useState(() => addDays(bangkokToday(), -(DEFAULT_EXPORT_DAYS - 1)));
  const [statuses, setStatuses] = useState<SellerOrderStatus[]>(EXPORT_ORDER_STATUSES);
  const { pending, run } = useFileExport();

  const rangeInvalid = !firstDay || !lastDay || firstDay > lastDay;
  const noStatus = statuses.length === 0;

  const download = async () => {
    if (rangeInvalid || noStatus) return;
    const done = await run(async () => {
      const { blob, filename } = await downloadAdminOrdersCsv({
        ...orderExportRange(firstDay, lastDay),
        statuses: exportStatusFilter(statuses),
      });
      downloadBlob(blob, filename ?? `admin-orders-${firstDay}-${lastDay}.csv`);
    });
    if (done) onOpenChange(false);
  };

  const toggle = (status: SellerOrderStatus, checked: boolean) =>
    setStatuses((current) =>
      EXPORT_ORDER_STATUSES.filter((value) =>
        value === status ? checked : current.includes(value),
      ),
    );

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // ไฟล์กำลังสร้างอยู่ ปิดไม่ได้ ไม่งั้นผู้ใช้ไม่รู้ว่าดาวน์โหลดจะมาถึงเมื่อไร
        if (!pending) onOpenChange(next);
      }}
    >
      <DialogContent className="gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-[480px]">
        <DialogHeader className="border-b border-border px-6 py-5">
          <DialogTitle className="text-lg font-semibold">
            {t("orders.export.title", "ส่งออกคำสั่งซื้อเป็น CSV")}
          </DialogTitle>
          <DialogDescription className="text-[13px]">
            {t("orders.export.description", "1 แถวต่อคำสั่งซื้อย่อยของแต่ละร้าน เรียงใหม่สุดก่อน · สูงสุด 20,000 แถว")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 px-6 py-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="order-export-from">{t("orders.export.from", "ตั้งแต่วันที่")}</Label>
              <Input
                id="order-export-from"
                type="date"
                value={firstDay}
                max={lastDay || undefined}
                onChange={(event) => setFirstDay(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="order-export-to">{t("orders.export.to", "ถึงวันที่")}</Label>
              <Input
                id="order-export-to"
                type="date"
                value={lastDay}
                min={firstDay || undefined}
                onChange={(event) => setLastDay(event.target.value)}
              />
            </div>
          </div>
          {rangeInvalid ? (
            <p className="-mt-2 text-xs text-destructive">
              {t("orders.export.rangeInvalid", "เลือกวันที่ให้ครบ และวันแรกต้องไม่อยู่หลังวันสุดท้าย")}
            </p>
          ) : null}

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-[13px] font-medium text-foreground">
              {t("orders.export.statuses", "สถานะ")}
            </legend>
            <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium text-foreground">
              <Checkbox
                checked={statuses.length === EXPORT_ORDER_STATUSES.length}
                onCheckedChange={(checked) => setStatuses(checked ? EXPORT_ORDER_STATUSES : [])}
              />
              {t("orders.export.allStatuses", "ทุกสถานะ")}
            </label>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 pl-6">
              {EXPORT_ORDER_STATUSES.map((status) => (
                <label key={status} className="flex cursor-pointer items-center gap-2.5 text-sm text-foreground">
                  <Checkbox
                    checked={statuses.includes(status)}
                    onCheckedChange={(checked) => toggle(status, checked === true)}
                  />
                  {ORDER_STATUS_LABEL[status]}
                </label>
              ))}
            </div>
            {noStatus ? (
              <p className="text-xs text-destructive">
                {t("orders.export.noStatus", "เลือกสถานะอย่างน้อย 1 สถานะ")}
              </p>
            ) : null}
          </fieldset>
        </div>

        <DialogFooter className="m-0 rounded-none border-t border-border bg-background px-6 py-4">
          <Button
            variant="outline"
            className="h-[41px] rounded-lg px-4"
            disabled={pending}
            onClick={() => onOpenChange(false)}
          >
            {t("orders.export.cancel", "ยกเลิก")}
          </Button>
          <Button
            className="h-[41px] rounded-lg px-4"
            disabled={pending || rangeInvalid || noStatus}
            onClick={() => void download()}
          >
            {pending ? (
              <>
                <Spinner /> {t("export.pending", "กำลังสร้างไฟล์...")}
              </>
            ) : (
              t("orders.export.submit", "ดาวน์โหลด CSV")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
