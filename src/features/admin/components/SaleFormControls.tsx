import { useLanguage, translate } from "@/lib/language";
import { useState } from "react";
import { Plus, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
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
  useLanguage();
  return (
    <ToggleGroup
      aria-label={label}
      spacing={1}
      disabled={disabled}
      value={[value]}
      onValueChange={(next: string[]) => {
        if (next[0]) onChange(next[0] as T);
      }}
      className="max-w-full flex-wrap rounded-[8px] bg-[#eef1f2] p-1"
    >
      {options.map((option) => (
        <ToggleGroupItem
          key={option.value}
          value={option.value}
          className={cn(
            "h-auto min-w-0 rounded-[6px] px-3 py-1.5 text-[13px] font-normal text-muted-foreground hover:bg-card/60 disabled:opacity-60",
            "aria-pressed:bg-card aria-pressed:font-semibold aria-pressed:text-foreground aria-pressed:shadow-xs",
          )}
        >
          {option.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

/** ชิปที่เลือกแล้ว (ฟ้า + ×) */
export function SelectedChip({ label, onRemove, disabled }: { label: string; onRemove: () => void; disabled?: boolean }) {
  useLanguage();
  return (
    <Badge
      variant="outline"
      className="h-auto gap-1.5 border-[#b9d4f0] bg-[#e8f1fc] py-1 pr-1 pl-3 text-[13px] font-normal text-[#0058bc]"
    >
      {label}
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        aria-label={`เอา ${label} ออก`}
        disabled={disabled}
        onClick={onRemove}
        className="size-4 rounded-full text-[#0058bc] hover:bg-[#cfe0f7] hover:text-[#0058bc]"
      >
        <X />
      </Button>
    </Badge>
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
  useLanguage();
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
              <Button
                key={option.id}
                type="button"
                size="xs"
                variant="outline"
                className="h-auto rounded-full px-2.5 py-1 text-xs font-normal text-[#414755] hover:border-primary hover:text-primary"
                onClick={() => onChange([...selected, option.id])}
              >
                {option.label}
              </Button>
            ))}
            {loading ? (
              <span role="status" className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Spinner className="size-3.5" />
                {translate("กำลังโหลด…", "Loading…")}</span>
            ) : null}
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
  useLanguage();
  return (
    <ToggleGroup
      aria-label={label}
      multiple
      spacing={2}
      disabled={disabled}
      value={selected}
      onValueChange={(next: string[]) => onChange(next as T[])}
      className="flex-wrap"
    >
      {options.map((option) => (
        <ToggleGroupItem
          key={option.value}
          value={option.value}
          variant="outline"
          className={cn(
            "h-auto min-w-0 rounded-full px-3 py-1 text-[13px] font-normal text-[#414755] disabled:opacity-60",
            "aria-pressed:border-[#b9d4f0] aria-pressed:bg-[#e8f1fc] aria-pressed:text-[#0058bc]",
          )}
        >
          {option.label}
          {selected.includes(option.value) ? <X aria-hidden className="size-3" /> : null}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
