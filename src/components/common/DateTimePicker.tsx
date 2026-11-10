import { useState, type ReactNode } from "react";
import { CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { dateTimeFormat, dayPickerLocale, useTranslate } from "@/lib/i18n";

const pad = (value: number) => String(value).padStart(2, "0");
const HOURS = Array.from({ length: 24 }, (_, hour) => ({ value: pad(hour), label: pad(hour) }));
const MINUTES = Array.from({ length: 60 }, (_, minute) => ({ value: pad(minute), label: pad(minute) }));

const monthCaption = dateTimeFormat({ month: "long", year: "numeric" });
const dateLabel = dateTimeFormat({ day: "numeric", month: "short", year: "numeric" });

type DateTimePickerProps = {
  /** แบบเดียวกับ `<input type="datetime-local">` (`YYYY-MM-DDTHH:mm`) หรือ `YYYY-MM-DD` เมื่อ `mode="date"` · ว่าง = ยังไม่เลือก */
  value: string;
  onChange: (value: string) => void;
  mode?: "datetime" | "date";
  id?: string;
  "aria-label"?: string;
  disabled?: boolean;
  invalid?: boolean;
  /** รูปแบบเดียวกับ `value` — วันก่อนหน้านี้เลือกไม่ได้ */
  min?: string;
  /** รูปแบบเดียวกับ `value` — วันหลังจากนี้เลือกไม่ได้ */
  max?: string;
  /** เวลาที่ใส่ให้ตอนเลือกวันครั้งแรก เช่น `"23:59"` สำหรับวันสิ้นสุด */
  defaultTime?: string;
  placeholder?: string;
  /** ของท้ายช่อง เช่น แม่กุญแจตอนล็อก */
  suffix?: ReactNode;
  className?: string;
};

function parse(value: string): Date | undefined {
  if (!value) return undefined;
  const [datePart, timePart = "00:00"] = value.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);
  const date = new Date(year, month - 1, day, hour || 0, minute || 0);
  return Number.isFinite(date.getTime()) ? date : undefined;
}

function format(date: Date, mode: "datetime" | "date"): string {
  const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  return mode === "date" ? day : `${day}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * เลือกวัน (และเวลา) ด้วยปฏิทินของ design system แทนตัวเลือกของเบราว์เซอร์
 * ค่าเข้า/ออกเป็นสตริงแบบ `datetime-local` เพื่อให้ฟอร์มเดิมแปลงเป็น ISO ต่อได้เหมือนเดิม
 */
export function DateTimePicker({
  value,
  onChange,
  mode = "datetime",
  id,
  "aria-label": ariaLabel,
  disabled,
  invalid,
  min,
  max,
  defaultTime = "00:00",
  placeholder,
  suffix,
  className,
}: DateTimePickerProps) {
  const { t } = useTranslate();
  const [open, setOpen] = useState(false);
  const selected = parse(value);
  const minDate = parse(min ?? "");
  const minDay = minDate ? new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate()) : undefined;
  const maxDate = parse(max ?? "");
  const maxDay = maxDate ? new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate()) : undefined;
  const blocked = [...(minDay ? [{ before: minDay }] : []), ...(maxDay ? [{ after: maxDay }] : [])];
  const [defaultHour, defaultMinute] = defaultTime.split(":");

  const pickDay = (day: Date | undefined) => {
    if (!day) return;
    const next = new Date(day);
    next.setHours(selected ? selected.getHours() : Number(defaultHour), selected ? selected.getMinutes() : Number(defaultMinute));
    onChange(format(next, mode));
    if (mode === "date") setOpen(false);
  };

  const setTime = (part: "hour" | "minute", raw: string | null) => {
    if (!selected || raw == null) return;
    const next = new Date(selected);
    if (part === "hour") next.setHours(Number(raw));
    else next.setMinutes(Number(raw));
    onChange(format(next, mode));
  };

  const text = selected
    ? mode === "date"
      ? dateLabel.format(selected)
      : `${dateLabel.format(selected)}, ${pad(selected.getHours())}:${pad(selected.getMinutes())}`
    : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        data-slot="date-picker"
        id={id}
        aria-label={ariaLabel}
        aria-invalid={invalid || undefined}
        disabled={disabled}
        render={
          <Button
            type="button"
            variant="outline"
            className={cn(
              // หน้าตาเดียวกับ `Input` — หน้าไหนปรับมุม/กรอบของ input ให้ปรับ `data-slot="date-picker"` ด้วย
              "h-9 w-full justify-start gap-2 rounded-3xl border-transparent bg-input/50 px-3 text-left text-sm font-normal text-foreground hover:bg-input/50",
              "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
              className,
            )}
          />
        }
      >
        <CalendarIcon className="text-muted-foreground" aria-hidden />
        <span className={cn("flex-1 truncate", !text && "text-muted-foreground")}>{text ?? placeholder ?? (mode === "date" ? t("datePicker.pickDate", "เลือกวัน") : t("datePicker.pickDateTime", "เลือกวันและเวลา"))}</span>
        {suffix}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 max-w-[calc(100vw-2rem)] gap-0 rounded-xl p-0">
        <Calendar
          mode="single"
          className="w-full p-4 [--cell-size:--spacing(9)]"
          classNames={{ root: "w-full", month: "w-full gap-3", week: "mt-1 flex w-full justify-around", weekdays: "flex justify-around", weekday: "flex-1 pb-1 text-center text-[0.8rem] font-normal text-muted-foreground" }}
          locale={dayPickerLocale()}
          selected={selected}
          defaultMonth={selected ?? minDay}
          disabled={blocked.length ? blocked : undefined}
          formatters={{ formatCaption: (month) => monthCaption.format(month) }}
          onSelect={pickDay}
        />
        {mode === "datetime" ? (
          <div className="flex items-center justify-center gap-2 border-t px-4 py-3 text-sm">
            <span className="text-muted-foreground">{t("datePicker.time", "เวลา")}</span>
            <TimeSelect
              label={t("datePicker.hour", "ชั่วโมง")}
              items={HOURS}
              value={selected ? pad(selected.getHours()) : null}
              disabled={!selected}
              onChange={(next) => setTime("hour", next)}
            />
            <span aria-hidden>:</span>
            <TimeSelect
              label={t("datePicker.minute", "นาที")}
              items={MINUTES}
              value={selected ? pad(selected.getMinutes()) : null}
              disabled={!selected}
              onChange={(next) => setTime("minute", next)}
            />
            <Button type="button" size="sm" className="ml-2" onClick={() => setOpen(false)}>
              {t("actions.done", "เสร็จ")}
            </Button>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}

function TimeSelect({
  label,
  items,
  value,
  disabled,
  onChange,
}: {
  label: string;
  items: Array<{ value: string; label: string }>;
  value: string | null;
  disabled?: boolean;
  onChange: (value: string | null) => void;
}) {
  return (
    <Select items={items} value={value} disabled={disabled} onValueChange={onChange}>
      <SelectTrigger aria-label={label} size="sm" className="w-18 rounded-md border-border bg-card">
        <SelectValue placeholder="--" />
      </SelectTrigger>
      <SelectContent className="max-h-60">
        <SelectGroup>
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
