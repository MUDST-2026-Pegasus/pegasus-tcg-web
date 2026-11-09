import { useEffect, useRef, useState } from "react";
import { CalendarIcon, ChevronDown, Clock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

import {
  CLOSE_TIME_SHORTCUTS,
  closeAtMs,
  closeDateRange,
  formatCloseDate,
  formatCloseDuration,
  parseTimeInput,
  shortcutCloseTime,
} from "../auction-form.schema";
import { AuctionFieldError } from "./AuctionFieldError";
import { dateTimeFormat, dayPickerLocale } from "@/lib/i18n";

const pad = (value: number) => String(value).padStart(2, "0");
/** รายการเวลาทีละ 30 นาที 00:00–23:30 */
const HALF_HOURS = Array.from({ length: 48 }, (_, index) => `${pad(Math.floor(index / 2))}:${index % 2 ? "30" : "00"}`);

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
 * วัน: ปฏิทิน + รายการเวลาทีละ 30 นาที · เวลา: พิมพ์เองได้ (เช่น 21:15) หรือเลือกจากรายการ
 * วันก่อนวันนี้และหลัง 30 วันกดไม่ได้ — ส่วนเวลาที่เร็ว/ไกลเกินไป schema เป็นคนบอก
 */
export function CloseTimePicker({ date, time, onChange, now, error, defaultTime = "21:00" }: CloseTimePickerProps) {
  const [dateOpen, setDateOpen] = useState(false);
  const [timeOpen, setTimeOpen] = useState(false);
  const [typed, setTyped] = useState(time);
  const [syncedTime, setSyncedTime] = useState(time);
  // เวลาเปลี่ยนจากที่อื่น (ปุ่มตั้งเร็ว / รายการ) → ช่องพิมพ์ตามค่าใหม่
  if (time !== syncedTime) {
    setSyncedTime(time);
    setTyped(time);
  }

  const range = closeDateRange(now);
  const first = toDay(range.first);
  const last = toDay(range.last);
  const selected = toDay(date);
  const closeAt = closeAtMs(date, time);

  const pickTime = (next: string) => {
    onChange({ date, time: next });
    setTimeOpen(false);
  };

  const commitTyped = () => {
    const parsed = parseTimeInput(typed);
    // พิมพ์ผิดรูปแบบ: เก็บข้อความไว้ให้ schema แจ้ง แทนการเด้งกลับค่าเดิมเงียบ ๆ
    onChange({ date, time: parsed ?? typed.trim() });
  };

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
              <div className="flex w-28 flex-col border-l">
                <p className="px-3 pt-3 pb-1 text-xs text-muted-foreground">เวลา</p>
                <TimeList value={time} onPick={(next) => onChange({ date: date || range.first, time: next })} className="max-h-64" />
              </div>
            </div>
            <p className="border-t px-3 py-2.5 text-[11px] text-muted-foreground">
              วันที่ก่อนวันนี้และหลัง 30 วันกดเลือกไม่ได้ · พิมพ์เวลาเองได้ (เช่น 21:15)
            </p>
          </PopoverContent>
        </Popover>

        <div className="relative sm:w-40">
          <Clock aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="เวลาปิดประมูล"
            aria-invalid={Boolean(error) || undefined}
            inputMode="numeric"
            placeholder="21:00"
            maxLength={5}
            value={typed}
            onChange={(event) => setTyped(event.target.value)}
            onBlur={commitTyped}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                commitTyped();
              }
            }}
            className="h-9 rounded-lg border-input bg-background pr-9 pl-9 text-sm tabular-nums"
          />
          <Popover open={timeOpen} onOpenChange={setTimeOpen}>
            <PopoverTrigger
              aria-label="เลือกเวลาจากรายการ"
              render={<button type="button" className="absolute top-1/2 right-1 flex size-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:bg-muted" />}
            >
              <ChevronDown aria-hidden className="size-4" />
            </PopoverTrigger>
            <PopoverContent align="end" className="w-28 gap-0 rounded-xl p-0">
              <TimeList value={time} onPick={pickTime} className="max-h-64" />
            </PopoverContent>
          </Popover>
        </div>
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

function TimeList({ value, onPick, className }: { value: string; onPick: (time: string) => void; className?: string }) {
  const selectedRef = useRef<HTMLButtonElement>(null);
  // เปิดมาแล้วเลื่อนให้เห็นเวลาที่เลือกอยู่
  useEffect(() => {
    selectedRef.current?.scrollIntoView({ block: "center" });
  }, []);

  return (
    <div role="listbox" aria-label="เวลา" className={cn("flex flex-col gap-0.5 overflow-y-auto p-1.5", className)}>
      {HALF_HOURS.map((slot) => {
        const active = slot === value;
        return (
          <button
            key={slot}
            ref={active ? selectedRef : undefined}
            type="button"
            role="option"
            aria-selected={active}
            onClick={() => onPick(slot)}
            className={cn(
              "cursor-pointer rounded-md px-2.5 py-1.5 text-left text-sm tabular-nums transition-colors",
              active ? "bg-primary font-semibold text-primary-foreground" : "hover:bg-muted",
            )}
          >
            {slot}
          </button>
        );
      })}
    </div>
  );
}
