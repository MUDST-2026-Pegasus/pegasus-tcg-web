import { useState } from "react";
import { Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * ตัวเลือกแบบแท็บพื้นเทา (Figma SAL-A2 "ทุกสินค้า | เกม | หมวดหมู่ | ชุดการ์ด", "ลดเป็น % | ลดเป็นบาทต่อชิ้น")
 */
export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
  disabled,
}: {
  label: string;
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
  disabled?: boolean;
}) {
  return (
    <div role="group" aria-label={label} className="flex w-fit max-w-full flex-wrap gap-1 rounded-[8px] bg-[#eef1f2] p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          disabled={disabled}
          onClick={() => onChange(option.value)}
          className={cn(
            "rounded-[6px] px-3 py-1.5 text-[13px] text-muted-foreground transition-colors disabled:cursor-not-allowed disabled:opacity-60",
            "aria-pressed:bg-card aria-pressed:font-semibold aria-pressed:text-foreground aria-pressed:shadow-xs",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

/** ชิปที่เลือกแล้ว (ฟ้า + ×) */
export function SelectedChip({ label, onRemove, disabled }: { label: string; onRemove: () => void; disabled?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#b9d4f0] bg-[#e8f1fc] py-1 pr-1.5 pl-3 text-[13px] text-[#0058bc]">
      {label}
      <button
        type="button"
        aria-label={`เอา ${label} ออก`}
        disabled={disabled}
        onClick={onRemove}
        className="grid size-4 place-items-center rounded-full hover:bg-[#cfe0f7] disabled:opacity-50"
      >
        <X className="size-3" />
      </button>
    </span>
  );
}

/**
 * เลือกหลายรายการเป็นชิป + ปุ่ม "+ เพิ่ม…" ที่เปิดช่องค้นหา (Figma SAL-A2 การ์ด 2)
 * ใช้กับเกม / หมวดหมู่ / ชุดการ์ด / ร้านที่ยกเว้น
 */
export function ChipPicker({
  options,
  selected,
  onChange,
  addLabel,
  disabled,
  loading,
  error,
  onSearch,
}: {
  options: Array<{ id: number; label: string }>;
  selected: number[];
  onChange: (ids: number[]) => void;
  addLabel: string;
  disabled?: boolean;
  loading?: boolean;
  error?: string;
  /** ค้นที่ server แทนการกรองในเครื่อง (ร้านค้า) */
  onSearch?: (q: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const labels = new Map(options.map((option) => [option.id, option.label]));
  const needle = q.trim().toLowerCase();
  const matches = options
    .filter((option) => !selected.includes(option.id))
    .filter((option) => onSearch || !needle || option.label.toLowerCase().includes(needle))
    .slice(0, 12);

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {selected.map((id) => (
          <SelectedChip
            key={id}
            label={labels.get(id) ?? `#${id}`}
            disabled={disabled}
            onRemove={() => onChange(selected.filter((value) => value !== id))}
          />
        ))}
        {!disabled ? (
          <Button
            type="button"
            size="xs"
            variant="outline"
            className="h-auto rounded-full! px-3 py-1 text-[13px] font-normal text-[#414755]"
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            <Plus />
            {addLabel}
          </Button>
        ) : null}
      </div>
      {open && !disabled ? (
        <div className="grid gap-2 rounded-md border p-2.5">
          <Input
            autoFocus
            aria-label={addLabel}
            placeholder="ค้นหา…"
            value={q}
            onChange={(event) => {
              setQ(event.target.value);
              onSearch?.(event.target.value);
            }}
          />
          <div className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto">
            {matches.map((option) => (
              <button
                key={option.id}
                type="button"
                className="rounded-full border px-2.5 py-1 text-xs text-[#414755] hover:border-primary hover:text-primary"
                onClick={() => onChange([...selected, option.id])}
              >
                {option.label}
              </button>
            ))}
            {loading ? <span className="text-xs text-muted-foreground">กำลังโหลด…</span> : null}
            {!loading && matches.length === 0 ? (
              <span className="text-xs text-muted-foreground">
                {onSearch && needle.length < 2 ? "พิมพ์อย่างน้อย 2 ตัวอักษร" : "ไม่พบรายการ"}
              </span>
            ) : null}
          </div>
        </div>
      ) : null}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

/** ชิปเปิด/ปิดหลายตัว (สภาพการ์ด) */
export function ToggleChips<T extends string>({
  label,
  options,
  selected,
  onChange,
  disabled,
}: {
  label: string;
  options: Array<{ value: T; label: string }>;
  selected: T[];
  onChange: (values: T[]) => void;
  disabled?: boolean;
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((option) => {
        const on = selected.includes(option.value);
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={on}
            disabled={disabled}
            onClick={() => onChange(on ? selected.filter((value) => value !== option.value) : [...selected, option.value])}
            className={cn(
              "rounded-full border px-3 py-1 text-[13px] text-[#414755] disabled:cursor-not-allowed disabled:opacity-60",
              "aria-pressed:border-[#b9d4f0] aria-pressed:bg-[#e8f1fc] aria-pressed:text-[#0058bc]",
            )}
          >
            {option.label}
            {on ? " ×" : ""}
          </button>
        );
      })}
    </div>
  );
}
