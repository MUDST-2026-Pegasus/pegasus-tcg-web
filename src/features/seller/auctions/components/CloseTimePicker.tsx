import { useState } from "react";
import { CalendarIcon, ChevronDown, Clock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

import {
  CLOSE_TIME_SHORTCUTS,
  closeAtMs,
  closeDateRange,
  formatCloseDate,
  formatCloseDuration,
  shortcutCloseTime,
} from "../auction-form.schema";
import { AuctionFieldError } from "./AuctionFieldError";
import { TimeWheel } from "./TimeWheel";
import { dateTimeFormat, dayPickerLocale } from "@/lib/i18n";

const pad = (value: number) => String(value).padStart(2, "0");

const monthCaption = dateTimeFormat({ month: "long", year: "numeric" });

/** `YYYY-MM-DD` ↔ Date ของปฏิทิน (ปฏิทินคิดเป็นวันบนเครื่อง ใช้แค่ปี/เดือน/วัน) */
function toDay(date: string): Date | undefined {
  const [year, month, day] = date.split("-").map(Number);
  return year ? new Date(year, month - 1, day) : undefined;
}
function fromDay(day: Date): string {
  return `${day.getFullYear()}-${pad(day.getMonth() + 1)}-${pad(day.getDate())}`;
}

type CloseTimePickerProps = {
  date: string;
  time: string;
  onChange: (next: { date: string; time: string }) => void;
  /** นาฬิกาตอน render — ใช้กันวันในปฏิทินและคำนวณ "อีก …" */
  now: number;
  error?: string;
  /** ตั้งวันแล้วแต่ยังไม่มีเวลา ใส่ให้เท่านี้ */
  defaultTime?: string;
};

/**
 * เวลาปิดประมูล (Figma S2 + S3-G) [TCG-633 · FE-7]
 * วัน: ปฏิทิน + วงล้อเวลา · เวลา: วงล้อเลื่อนขึ้นลงแบบนาฬิกา iPhone (ชั่วโมง / นาที)
 * วันก่อนวันนี้และหลัง 30 วันกดไม่ได้ — ส่วนเวลาที่เร็ว/ไกลเกินไป schema เป็นคนบอก
 */
export function CloseTimePicker({ date, time, onChange, now, error, defaultTime = "21:00" }: CloseTimePickerProps) {
  const [dateOpen, setDateOpen] = useState(false);
  const [timeOpen, setTimeOpen] = useState(false);

  const range = closeDateRange(now);
  const first = toDay(range.first);
  const last = toDay(range.last);
  const selected = toDay(date);
  const closeAt = closeAtMs(date, time);

  // ยังไม่ได้เลือกวัน → หมุนเวลาแล้วใช้วันนี้ไปก่อน
  const pickTime = (next: string) => onChange({ date: date || range.first, time: next });

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Popover open={dateOpen} onOpenChange={setDateOpen}>
          <PopoverTrigger
            aria-label="วันปิดประมูล"
            aria-invalid={Boolean(error) || undefined}
            render={
              <Button
                type="button"
                variant="outline"
                className="h-9 flex-1 justify-start gap-2 rounded-lg border-input bg-background px-3 text-left text-sm font-normal text-foreground aria-invalid:border-destructive"
              />
            }
          >
            <CalendarIcon aria-hidden className="text-muted-foreground" />
            <span className={cn("flex-1 truncate", !date && "text-muted-foreground")}>{date ? formatCloseDate(date) : "เลือกวัน"}</span>
            <ChevronDown aria-hidden className="text-muted-foreground" />
          </PopoverTrigger>
          <PopoverContent align="start" className="w-auto gap-0 rounded-xl p-0">
            <div className="flex">
              <Calendar
                mode="single"
                locale={dayPickerLocale()}
                selected={selected}
                defaultMonth={selected ?? first}
                disabled={first && last ? [{ before: first }, { after: last }] : undefined}
                formatters={{ formatCaption: (month) => monthCaption.format(month) }}
                onSelect={(day) => {
                  if (!day) return;
                  onChange({ date: fromDay(day), time: time || defaultTime });
                }}
              />
              <div className="flex w-40 flex-col justify-center border-l">
                <p className="px-3 pt-3 text-xs text-muted-foreground">เวลา</p>
                <TimeWheel value={time} fallback={defaultTime} onChange={pickTime} />
              </div>
            </div>
            <p className="border-t px-3 py-2.5 text-[11px] text-muted-foreground">
              วันที่ก่อนวันนี้และหลัง 30 วันกดเลือกไม่ได้ · เลื่อนวงล้อขึ้นลงเพื่อตั้งเวลา
            </p>
          </PopoverContent>
        </Popover>

        <Popover open={timeOpen} onOpenChange={setTimeOpen}>
          <PopoverTrigger
            aria-label="เวลาปิดประมูล"
            aria-invalid={Boolean(error) || undefined}
            render={
              <Button
                type="button"
                variant="outline"
                className="h-9 justify-start gap-2 rounded-lg border-input bg-background px-3 text-left text-sm font-normal text-foreground tabular-nums aria-invalid:border-destructive sm:w-40"
              />
            }
          >
            <Clock aria-hidden className="text-muted-foreground" />
            <span className={cn("flex-1", !time && "text-muted-foreground")}>{time || "เลือกเวลา"}</span>
            <ChevronDown aria-hidden className="text-muted-foreground" />
          </PopoverTrigger>
          <PopoverContent align="end" className="w-48 gap-0 rounded-xl p-0">
            <TimeWheel value={time} fallback={defaultTime} onChange={pickTime} />
            <div className="border-t p-2">
              <Button type="button" size="sm" className="w-full rounded-lg" onClick={() => setTimeOpen(false)}>
                เสร็จ
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">ตั้งเร็ว:</span>
        {CLOSE_TIME_SHORTCUTS.map((shortcut) => (
          <Button
            key={shortcut.hours}
            type="button"
            variant="outline"
            size="xs"
            className="rounded-full px-3 text-xs font-semibold"
            onClick={() => onChange(shortcutCloseTime(Date.now(), shortcut.hours))}
          >
            {shortcut.label}
          </Button>
        ))}
      </div>

      <AuctionFieldError message={error} />

      <div className="flex flex-col gap-0.5 rounded-lg bg-teal-50 px-3.5 py-2.5 text-xs">
        {closeAt !== null && closeAt > now ? (
          <p className="font-semibold text-teal-700">
            เปิดทันทีเมื่อกด "เปิดประมูล" · ปิด {formatCloseDate(date)} เวลา {time} น. (อีก {formatCloseDuration(closeAt - now)})
          </p>
        ) : null}
        <p className="text-teal-700/80">
          ตั้งได้ตั้งแต่ 1 ชม. ถึง 30 วันจากตอนนี้ · เวลาประเทศไทย (GMT+7) · ถ้ามีคนบิดใน 2 นาทีสุดท้าย ระบบจะต่อเวลาให้อัตโนมัติ
        </p>
      </div>
    </div>
  );
}
