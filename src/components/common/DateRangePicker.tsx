import { useState } from "react";
import { CalendarIcon } from "lucide-react";
import { format, parseISO } from "date-fns";
import { th } from "react-day-picker/locale";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const monthCaption = new Intl.DateTimeFormat("th-TH", { month: "long", year: "numeric" });
const dateLabel = new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short", year: "numeric" });

/** `YYYY-MM-DD` ทั้งคู่ · สตริงว่าง = ยังไม่เลือก */
export type DateRangeValue = { from: string; to: string };

type DateRangePickerProps = {
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
  id?: string;
  "aria-label"?: string;
  disabled?: boolean;
  invalid?: boolean;
  /** `YYYY-MM-DD` — วันก่อนหน้านี้เลือกไม่ได้ */
  min?: string;
  /** `YYYY-MM-DD` — วันหลังจากนี้เลือกไม่ได้ */
  max?: string;
  placeholder?: string;
  className?: string;
};

const toDate = (value: string | undefined) => (value ? parseISO(value) : undefined);
const toValue = (date: Date | undefined) => (date ? format(date, "yyyy-MM-dd") : "");

function label({ from, to }: DateRangeValue): string | null {
  if (!from) return null;
  const start = dateLabel.format(parseISO(from));
  return to && to !== from ? `${start} – ${dateLabel.format(parseISO(to))}` : start;
}

/**
 * เลือกช่วงวันด้วยปฏิทินของ design system หน้าตาเดียวกับ `DateTimePicker`
 * ถ้าเลือกวันเดียวให้ใช้ `DateTimePicker mode="date"`
 */
export function DateRangePicker({
  value,
  onChange,
  id,
  "aria-label": ariaLabel,
  disabled,
  invalid,
  min,
  max,
  placeholder = "เลือกช่วงวัน",
  className,
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const from = toDate(value.from);
  const minDate = toDate(min);
  const maxDate = toDate(max);
  const text = label(value);

  const blocked = [
    ...(minDate ? [{ before: minDate }] : []),
    ...(maxDate ? [{ after: maxDate }] : []),
  ];

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
              "h-9 w-full justify-start gap-2 rounded-3xl border-transparent bg-input/50 px-3 text-left text-sm font-normal text-foreground hover:bg-input/50",
              "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
              className,
            )}
          />
        }
      >
        <CalendarIcon className="text-muted-foreground" aria-hidden />
        <span className={cn("flex-1 truncate", !text && "text-muted-foreground")}>{text ?? placeholder}</span>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 max-w-[calc(100vw-2rem)] gap-0 rounded-xl p-0">
        <Calendar
          mode="range"
          className="w-full p-4 [--cell-size:--spacing(9)]"
          locale={th}
          selected={from ? { from, to: toDate(value.to) } : undefined}
          defaultMonth={from ?? minDate}
          disabled={blocked.length ? blocked : undefined}
          formatters={{ formatCaption: (month) => monthCaption.format(month) }}
          onSelect={(range) => onChange({ from: toValue(range?.from), to: toValue(range?.to) })}
        />
        <div className="flex items-center justify-end gap-2 border-t px-4 py-3">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={!value.from}
            onClick={() => onChange({ from: "", to: "" })}
          >
            ล้าง
          </Button>
          <Button type="button" size="sm" onClick={() => setOpen(false)}>
            เสร็จ
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
