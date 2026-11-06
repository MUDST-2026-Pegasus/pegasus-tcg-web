import { useEffect, useState } from "react";

import { Search } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/** การ์ดตัวเลขบนหัวหน้า A1 / A4 */
export function AdminKpi({ label, value, valueClass }: { label: string; value: number; valueClass?: string }) {
  return (
    <Card className="gap-1 rounded-xl p-4 shadow-none">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("text-2xl font-bold tabular-nums text-foreground", valueClass)}>{value.toLocaleString("th-TH")}</p>
    </Card>
  );
}

type AdminTabsProps<T extends string> = {
  label: string;
  tabs: { key: T; label: string }[];
  active: T;
  counts?: Record<T, number>;
  onChange: (tab: T) => void;
};

/** แท็บแบบแคปซูลเทา (เหมือน S1) */
export function AdminTabs<T extends string>({ label, tabs, active, counts, onChange }: AdminTabsProps<T>) {
  return (
    <div role="tablist" aria-label={label} className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-100 p-1">
      {tabs.map((tab) => {
        const selected = tab.key === active;
        return (
          <button
            key={tab.key}
            role="tab"
            type="button"
            aria-selected={selected}
            onClick={() => onChange(tab.key)}
            className={cn(
              "flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-xs whitespace-nowrap transition-colors",
              selected ? "bg-card font-semibold text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
            {counts ? <span className="text-muted-foreground">{counts[tab.key].toLocaleString("th-TH")}</span> : null}
          </button>
        );
      })}
    </div>
  );
}

/** ช่องค้นหา — ส่งค่าเมื่อหยุดพิมพ์ 300ms (เหมือน S1) */
export function AdminSearchBox({ value, placeholder, onChange }: { value: string; placeholder: string; onChange: (q: string) => void }) {
  const [text, setText] = useState(value);
  const [synced, setSynced] = useState(value);
  // URL เปลี่ยนจากที่อื่น (กด back) → ตามค่าใหม่
  if (value !== synced) {
    setSynced(value);
    setText(value);
  }

  useEffect(() => {
    if (text.trim() === value.trim()) return;
    const timer = setTimeout(() => onChange(text), 300);
    return () => clearTimeout(timer);
  }, [text, value, onChange]);

  return (
    <div className="relative w-full sm:w-60">
      <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        aria-label={placeholder}
        placeholder={placeholder}
        value={text}
        onChange={(event) => setText(event.target.value)}
        className="h-9 rounded-lg bg-card pl-9 text-sm"
      />
    </div>
  );
}
