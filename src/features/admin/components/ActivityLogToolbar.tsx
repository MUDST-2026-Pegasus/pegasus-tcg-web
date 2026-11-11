import { useEffect, useMemo, useRef, useState } from "react";

import { SearchIcon } from "lucide-react";

import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslate } from "@/lib/i18n";

import {
  AUDIT_CATEGORIES,
  AUDIT_RANGES,
  type AuditCategory,
  type AuditRange,
} from "../audit.format";

const SEARCH_DELAY_MS = 300;
const ALL = "all";

export type ActivityFilters = {
  q: string;
  category: AuditCategory | null;
  range: AuditRange;
};

type ActivityLogToolbarProps = {
  filters: ActivityFilters;
  onChange: (changes: Partial<ActivityFilters>) => void;
};

/**
 * แถบกรองเหนือ timeline — ค้นหา (หน่วง 300ms แบบ `CatalogToolbar`), ประเภท และช่วงเวลา
 * ค่าทั้งหมดเก็บใน URL (หน้าเจ้าของเป็นคนอ่าน/เขียน) reload แล้วยังอยู่ที่เดิม
 */
export function ActivityLogToolbar({ filters, onChange }: ActivityLogToolbarProps) {
  const { t } = useTranslate("admin");
  const [text, setText] = useState(filters.q);
  const [syncedQ, setSyncedQ] = useState(filters.q);
  const timer = useRef<number | undefined>(undefined);

  const categoryItems: Record<string, string> = useMemo(
    () => ({
      [ALL]: t("audit.category.all", "ทุกประเภท"),
      ...Object.fromEntries(
        Object.entries(AUDIT_CATEGORIES).map(([key, value]) => [key, value.label]),
      ),
    }),
    [t],
  );

  // URL เปลี่ยนจากที่อื่น (กด back) — เอาค่าในช่องตามไปด้วย
  if (filters.q !== syncedQ) {
    setSyncedQ(filters.q);
    if (text.trim() !== filters.q) {
      setText(filters.q);
    }
  }

  useEffect(() => () => window.clearTimeout(timer.current), []);

  function handleSearchInput(value: string) {
    setText(value);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => onChange({ q: value.trim() }), SEARCH_DELAY_MS);
  }

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <InputGroup className="h-8 w-full rounded-lg border-input bg-background sm:min-w-[240px] sm:flex-1">
        <InputGroupAddon>
          <SearchIcon />
        </InputGroupAddon>
        <InputGroupInput
          type="search"
          value={text}
          onChange={(event) => handleSearchInput(event.target.value)}
          aria-label={t("audit.toolbar.searchAria", "ค้นหาในบันทึกกิจกรรม")}
          placeholder={t("audit.toolbar.searchPlaceholder", "ค้นหาชื่อสินค้า, รหัส, ข้อความบันทึก...")}
        />
      </InputGroup>

      <Select
        items={categoryItems}
        value={filters.category ?? ALL}
        onValueChange={(value) =>
          onChange({ category: value === ALL ? null : (value as AuditCategory) })
        }
      >
        <SelectTrigger
          size="sm"
          aria-label={t("audit.toolbar.filterCategoryAria", "กรองตามประเภท")}
          className="w-full rounded-lg border-input bg-background text-sm sm:w-[200px]"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {Object.entries(categoryItems).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      <Select
        items={AUDIT_RANGES}
        value={filters.range}
        onValueChange={(value) => onChange({ range: value as AuditRange })}
      >
        <SelectTrigger
          size="sm"
          aria-label={t("audit.toolbar.rangeAria", "ช่วงเวลา")}
          className="w-full rounded-lg border-input bg-background text-sm sm:w-[140px]"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {Object.entries(AUDIT_RANGES).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
