import { Check } from "lucide-react";
import { useState, type ReactNode } from "react";
import { format, parseISO } from "date-fns";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { useTranslate } from "@/lib/i18n";
import { cn } from "@/lib/utils";

import {
  addWeeks,
  bangkokToday,
  formatShare,
  weekEnd,
  weekOptions,
  weekRangeLabel,
  weekStartOf,
} from "../weekly-report.format";
import { dateTimeFormat, dayPickerLocale } from "@/lib/i18n";

/** แคปชันปฏิทินเป็นปี พ.ศ. ให้ตรงกับช่วงสัปดาห์ที่แสดงทั้งหน้า */
const monthCaption = dateTimeFormat({ month: "long", year: "numeric" });

function FilterTrigger({ open, children, ...props }: { open: boolean; children: ReactNode; disabled?: boolean }) {
  return (
    <PopoverTrigger
      render={<Button variant="outline" className="h-[41px] rounded-lg px-3.5 font-normal" {...props} />}
    >
      {children} <span aria-hidden="true">{open ? "▴" : "▾"}</span>
    </PopoverTrigger>
  );
}

function OptionButton({
  selected,
  muted,
  onSelect,
  children,
}: {
  selected: boolean;
  muted?: boolean;
  onSelect: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={cn(
        "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring",
        selected && "bg-[#eff6ff] font-medium text-primary hover:bg-[#eff6ff] dark:bg-primary/15",
        muted && !selected && "text-muted-foreground",
      )}
    >
      {children}
      {selected ? <Check aria-hidden="true" className="size-[18px] shrink-0" /> : null}
    </button>
  );
}

type WeekFilterProps = {
  weekStart: string;
  disabled: boolean;
  onChange: (weekStart: string) => void;
};

/** เมนูเลือกสัปดาห์ — ปุ่มล่างสุดเปิดปฏิทิน เลือกวันไหนก็ได้สัปดาห์ของวันนั้น */
export function WeekFilter({ weekStart, disabled, onChange }: WeekFilterProps) {
  const { t } = useTranslate("admin");
  const [open, setOpen] = useState(false);
  const [picking, setPicking] = useState(false);
  const today = bangkokToday();
  const lastSelectable = weekEnd(addWeeks(weekStartOf(today), 1));

  const choose = (next: string) => {
    onChange(next);
    setOpen(false);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setPicking(false);
      }}
    >
      <FilterTrigger open={open} disabled={disabled}>
        {t("weeklyReport.weekNumber", "สัปดาห์ที่ {range}", {
          range: weekRangeLabel(weekStart),
        })}
      </FilterTrigger>
      <PopoverContent align="start" className="w-[340px] max-w-[calc(100vw-2rem)] gap-0 rounded-xl p-1.5">
        {picking ? (
          <Calendar
            mode="single"
            className="w-full"
            locale={dayPickerLocale()}
            weekStartsOn={1}
            selected={parseISO(weekStart)}
            defaultMonth={parseISO(weekStart)}
            disabled={{ after: parseISO(lastSelectable) }}
            formatters={{ formatCaption: (month) => monthCaption.format(month) }}
            onSelect={(date) => {
              if (date) choose(weekStartOf(format(date, "yyyy-MM-dd")));
            }}
          />
        ) : (
          <>
            {weekOptions(today).map((option, index) => (
              <OptionButton
                key={option.weekStart}
                selected={option.weekStart === weekStart}
                muted={index === 3}
                onSelect={() => choose(option.weekStart)}
              >
                <span className="flex flex-col">
                  <span>{option.label}</span>
                  <span
                    className={cn(
                      "text-xs font-normal",
                      option.weekStart === weekStart ? "text-primary" : "text-muted-foreground",
                    )}
                  >
                    {option.range}
                  </span>
                </span>
              </OptionButton>
            ))}
            <Separator className="my-1.5" />
            <button
              type="button"
              onClick={() => setPicking(true)}
              className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-primary outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
            >
              {t("weeklyReport.filter.customWeek", "กำหนดช่วงสัปดาห์เอง...")}
            </button>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}

export type GameFilterOption = {
  slug: string;
  name: string;
  /** ส่วนแบ่งในสัปดาห์นี้ — `undefined` = ยังโหลดไม่เสร็จ */
  share: number | undefined;
};

type GameFilterProps = {
  game: string | null;
  options: GameFilterOption[];
  disabled: boolean;
  onChange: (game: string | null) => void;
};

export function GameFilter({ game, options, disabled, onChange }: GameFilterProps) {
  const { t } = useTranslate("admin");
  const [open, setOpen] = useState(false);
  const current = options.find((option) => option.slug === game);

  const choose = (next: string | null) => {
    onChange(next);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <FilterTrigger open={open} disabled={disabled}>
        {current?.name ?? (game ? game : t("weeklyReport.filter.allGames", "ทุกเกม"))}
      </FilterTrigger>
      <PopoverContent align="start" className="w-[260px] gap-0 rounded-xl p-1.5">
        <OptionButton selected={game === null} onSelect={() => choose(null)}>
          {t("weeklyReport.filter.allGames", "ทุกเกม")}
        </OptionButton>
        {options.map((option) => (
          <OptionButton
            key={option.slug}
            selected={option.slug === game}
            onSelect={() => choose(option.slug)}
          >
            <span className="flex min-w-0 flex-1 items-center justify-between gap-3">
              <span className="truncate">{option.name}</span>
              {option.share === undefined ? null : (
                <span className="text-[13px] font-normal text-muted-foreground">
                  {formatShare(option.share)}
                </span>
              )}
            </span>
          </OptionButton>
        ))}
      </PopoverContent>
    </Popover>
  );
}
