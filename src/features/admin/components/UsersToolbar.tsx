import { useEffect, useRef, useState } from "react";

import { SearchIcon, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { ROLE_LABEL, USER_STATUS_LABEL } from "../users.format";
import type { RoleCode, UserStatus } from "../users.types";

const SEARCH_DELAY_MS = 300;
const ALL = "all";

export type UserFilters = {
  q: string;
  role: RoleCode | null;
  status: UserStatus | null;
};

type UsersToolbarProps = {
  filters: UserFilters;
  onChange: (changes: Partial<UserFilters>) => void;
  onClear: () => void;
};

const ROLE_ITEMS: Record<string, string> = {
  [ALL]: "บทบาท: ทั้งหมด",
  ...ROLE_LABEL,
};

const STATUS_ITEMS: Record<string, string> = {
  [ALL]: "สถานะ: ทั้งหมด",
  ...USER_STATUS_LABEL,
};

/**
 * ส่วนหัวของการ์ดตาราง — ค้นหา + กรองบทบาท/สถานะ และชิปของตัวกรองที่ใช้อยู่
 * ค่าทั้งหมดเก็บใน URL (หน้าเจ้าของเป็นคนอ่าน/เขียน) reload แล้วยังอยู่ที่เดิม
 */
export function UsersToolbar({ filters, onChange, onClear }: UsersToolbarProps) {
  const [text, setText] = useState(filters.q);
  const [syncedQ, setSyncedQ] = useState(filters.q);
  const timer = useRef<number | undefined>(undefined);

  // URL เปลี่ยนจากที่อื่น (กด back, ล้างตัวกรอง) — เอาค่าในช่องตามไปด้วย
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
    timer.current = window.setTimeout(
      () => onChange({ q: value.trim() }),
      SEARCH_DELAY_MS,
    );
  }

  const chips = [
    filters.q ? { id: "q", label: `ค้นหา: ${filters.q}`, clear: { q: "" } } : null,
    filters.role
      ? { id: "role", label: ROLE_LABEL[filters.role], clear: { role: null } }
      : null,
    filters.status
      ? { id: "status", label: USER_STATUS_LABEL[filters.status], clear: { status: null } }
      : null,
  ].filter((chip) => chip !== null);

  return (
    <div className="flex flex-col">
      <div className="flex flex-wrap items-center gap-2.5 px-5 pt-4 pb-3.5">
        {/* ui/input-group กับ ui/select มาแบบ "พื้นเทา ไม่มีเส้นขอบ"
            ดีไซน์หน้านี้เป็นช่องขาวมีเส้นขอบ เลย override bg/border ตรงนี้ */}
        <InputGroup className="h-8 w-full rounded-lg border-input bg-background sm:w-[300px]">
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupInput
            type="search"
            value={text}
            onChange={(event) => handleSearchInput(event.target.value)}
            aria-label="ค้นหาชื่อผู้ใช้หรืออีเมล"
            placeholder="ค้นหาชื่อผู้ใช้, ชื่อที่แสดง, อีเมล..."
          />
        </InputGroup>

        <Select
          items={ROLE_ITEMS}
          value={filters.role ?? ALL}
          onValueChange={(value) =>
            onChange({ role: value === ALL ? null : (value as RoleCode) })
          }
        >
          <SelectTrigger
            size="sm"
            aria-label="กรองตามบทบาท"
            className="w-full rounded-lg border-input bg-background text-sm sm:w-[200px]"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {Object.entries(ROLE_ITEMS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        <Select
          items={STATUS_ITEMS}
          value={filters.status ?? ALL}
          onValueChange={(value) =>
            onChange({ status: value === ALL ? null : (value as UserStatus) })
          }
        >
          <SelectTrigger
            size="sm"
            aria-label="กรองตามสถานะ"
            className="w-full rounded-lg border-input bg-background text-sm sm:w-[200px]"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {Object.entries(STATUS_ITEMS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      {chips.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 px-5 pb-3.5">
          <p className="text-[11px] text-muted-foreground">ตัวกรองที่ใช้:</p>
          {chips.map((chip) => (
            <span
              key={chip.id}
              className="flex items-center gap-1.5 rounded-md bg-[#e8f1fc] px-2 py-[3px] text-[11px] font-medium text-[#0058bc]"
            >
              {chip.label}
              <button
                type="button"
                aria-label={`ลบตัวกรอง: ${chip.label}`}
                onClick={() => onChange(chip.clear)}
                className="rounded-sm opacity-80 transition-opacity hover:opacity-100 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                <X aria-hidden="true" className="size-3" />
              </button>
            </span>
          ))}
          <Button
            variant="ghost"
            size="xs"
            onClick={onClear}
            className="h-auto px-1 text-[11px] font-medium text-muted-foreground"
          >
            ล้างทั้งหมด
          </Button>
        </div>
      ) : null}
    </div>
  );
}
