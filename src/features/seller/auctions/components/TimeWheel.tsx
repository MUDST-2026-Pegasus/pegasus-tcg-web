import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";

import { cn } from "@/lib/utils";

import { parseTimeInput } from "../auction-form.schema";
import { useTranslate } from "@/lib/i18n";

/** ความสูงแถวละ 36px โชว์ 5 แถว แถวกลางคือค่าที่เลือก */
const ROW_HEIGHT = 36;
const VISIBLE_ROWS = 5;
/** หยุดเลื่อนนานเท่านี้ถึงนับว่าเลือกแล้ว */
const SETTLE_MS = 120;

const pad = (value: number) => String(value).padStart(2, "0");
const clamp = (value: number, max: number) => Math.min(Math.max(value, 0), max);

type TimeWheelProps = {
  /** `HH:mm` — ว่างหรือผิดรูปแบบจะโชว์ `fallback` */
  value: string;
  fallback?: string;
  onChange: (time: string) => void;
};

/**
 * เลือกเวลาแบบวงล้อเลื่อนขึ้นลง (เหมือนนาฬิกา iPhone) — ชั่วโมง 00–23 · นาที 00–59
 * ลากนิ้ว / หมุนลูกกลิ้ง / คลิกแถว / ปุ่มลูกศรขึ้นลง ได้หมด
 */
export function TimeWheel({ value, fallback = "21:00", onChange }: TimeWheelProps) {
  const { t } = useTranslate("auction");
  const [hour, minute] = (parseTimeInput(value) ?? fallback).split(":").map(Number);

  return (
    <div className="relative flex items-center justify-center gap-1 px-3 py-2" style={{ height: ROW_HEIGHT * VISIBLE_ROWS + 16 }}>
      {/* แถบไฮไลต์ตรงกลาง */}
      <div aria-hidden className="pointer-events-none absolute inset-x-3 top-1/2 h-9 -translate-y-1/2 rounded-lg bg-muted" />
      <WheelColumn label={t("seller.timeWheel.label", "ชั่วโมง")} count={24} value={hour} onChange={(next) => onChange(`${pad(next)}:${pad(minute)}`)} />
      <span aria-hidden className="relative text-lg font-semibold">
        :
      </span>
      <WheelColumn label={t("seller.timeWheel.label2", "นาที")} count={60} value={minute} onChange={(next) => onChange(`${pad(hour)}:${pad(next)}`)} />
    </div>
  );
}

type WheelColumnProps = {
  label: string;
  count: number;
  value: number;
  onChange: (value: number) => void;
};

function WheelColumn({ label, count, value, onChange }: WheelColumnProps) {
  const ref = useRef<HTMLDivElement>(null);
  const settleTimer = useRef<number | undefined>(undefined);
  const scrolling = useRef(false);
  // แถวที่อยู่ตรงกลางระหว่างเลื่อน — ให้ตัวหนาตามนิ้วก่อนจะ commit
  const [centered, setCentered] = useState(value);
  // ค่าล่าสุดสำหรับ callback ใน setTimeout
  const latest = useRef({ value, onChange });
  useLayoutEffect(() => {
    latest.current = { value, onChange };
  });

  // ค่าเปลี่ยนจากที่อื่น (ปุ่มตั้งเร็ว / เปิด popover) → เลื่อนวงล้อไปที่ค่านั้น
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element || scrolling.current) return;
    const top = value * ROW_HEIGHT;
    if (Math.abs(element.scrollTop - top) > 1) element.scrollTop = top;
    setCentered(value);
  }, [value]);

  useEffect(() => () => window.clearTimeout(settleTimer.current), []);

  const handleScroll = () => {
    const element = ref.current;
    if (!element) return;
    scrolling.current = true;
    setCentered(clamp(Math.round(element.scrollTop / ROW_HEIGHT), count - 1));
    window.clearTimeout(settleTimer.current);
    settleTimer.current = window.setTimeout(() => {
      scrolling.current = false;
      const index = clamp(Math.round(element.scrollTop / ROW_HEIGHT), count - 1);
      if (index !== latest.current.value) latest.current.onChange(index);
    }, SETTLE_MS);
  };

  const scrollToRow = (index: number) => {
    ref.current?.scrollTo({ top: clamp(index, count - 1) * ROW_HEIGHT, behavior: "smooth" });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = event.key === "ArrowDown" ? 1 : event.key === "ArrowUp" ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    scrollToRow(centered + step);
  };

  return (
    <div
      ref={ref}
      role="listbox"
      aria-label={label}
      aria-activedescendant={`${label}-${centered}`}
      tabIndex={0}
      onScroll={handleScroll}
      onKeyDown={handleKeyDown}
      className="relative h-full w-14 snap-y snap-mandatory overflow-y-auto overscroll-contain rounded-lg outline-none [scrollbar-width:none] focus-visible:ring-2 focus-visible:ring-ring/50 [&::-webkit-scrollbar]:hidden"
      style={{
        paddingBlock: ROW_HEIGHT * Math.floor(VISIBLE_ROWS / 2),
        maskImage: "linear-gradient(to bottom, transparent, black 30%, black 70%, transparent)",
      }}
    >
      {Array.from({ length: count }, (_, index) => {
        const active = index === centered;
        return (
          <div
            key={index}
            id={`${label}-${index}`}
            role="option"
            aria-selected={active}
            onClick={() => scrollToRow(index)}
            className={cn(
              "flex cursor-pointer snap-center items-center justify-center text-base tabular-nums transition-colors select-none",
              active ? "font-semibold text-foreground" : "text-muted-foreground",
            )}
            style={{ height: ROW_HEIGHT }}
          >
            {pad(index)}
          </div>
        );
      })}
    </div>
  );
}
