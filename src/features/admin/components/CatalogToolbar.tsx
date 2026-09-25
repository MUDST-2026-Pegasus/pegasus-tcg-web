import { useEffect, useRef, useState } from "react";

import { SearchIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
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

/** dropdown หนึ่งตัวบนแถบเครื่องมือ — ตัวเลือกแรกควรเป็น "ทั้งหมด" ที่มีชื่อตัวกรองนำหน้า */
export type CatalogToolbarSelect = {
  id: string;
  /** ชื่อตัวกรองสำหรับ screen reader เช่น "หมวดหมู่" */
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onValueChange: (value: string) => void;
};

type CatalogToolbarProps = {
  /** ป้ายบอกจำนวนผลลัพธ์ เช่น "แสดง 1–24 จาก 8,420 รายการ" */
  resultLabel: string;
  /** คำค้นที่อยู่ใน URL ตอนนี้ */
  search: string;
  onSearchChange: (search: string) => void;
  selects: CatalogToolbarSelect[];
};

/** พิมพ์ค้างไว้ครู่หนึ่งค่อยค้น ไม่ยิงทุกตัวอักษร */
const SEARCH_DELAY_MS = 350;

/**
 * แถบค้นหา + ตัวกรองด้านบนตารางสินค้า — ค่าทั้งหมดมาจาก URL ผ่านหน้าเพจ
 *
 * หมายเหตุ: ใน Figma ป้าย "แสดง N จาก M ใบ" ถูกวางทับกล่องค้นหาพอดี
 * (เลเยอร์ absolute ซ้อนกัน) ซึ่งน่าจะเป็นอุบัติเหตุตอนจัดเลย์เอาต์
 * ที่นี่จึงย้ายมาไว้เป็นบรรทัดบนแถบเครื่องมือแทน ให้อ่านออกจริง
 */
export function CatalogToolbar({
  resultLabel,
  search,
  onSearchChange,
  selects,
}: CatalogToolbarProps) {
  const [text, setText] = useState(search);
  const [syncedSearch, setSyncedSearch] = useState(search);
  const timer = useRef<number | undefined>(undefined);

  // URL เปลี่ยนจากที่อื่น (กด back, ล้างตัวกรอง) — เอาค่าในช่องตามไปด้วย
  // แต่ถ้าต่างกันแค่ช่องว่างท้ายคำที่กำลังพิมพ์อยู่ ปล่อยไว้ ไม่งั้นเคอร์เซอร์กระโดด
  if (search !== syncedSearch) {
    setSyncedSearch(search);
    if (text.trim() !== search) {
      setText(search);
    }
  }

  useEffect(() => () => window.clearTimeout(timer.current), []);

  function handleSearchInput(value: string) {
    setText(value);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(
      () => onSearchChange(value),
      SEARCH_DELAY_MS,
    );
  }

  function handleSearchSubmit() {
    window.clearTimeout(timer.current);
    onSearchChange(text);
  }

  return (
    <div className="flex flex-col gap-2.5">
      <Badge className="h-5 w-fit rounded-full bg-[#eef1f2] px-2 text-[11px] text-muted-foreground">
        {resultLabel}
      </Badge>

      <div className="flex flex-wrap items-center gap-2.5">
        <InputGroup className="h-8 w-full rounded-lg bg-white sm:w-[320px]">
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupInput
            type="search"
            aria-label="ค้นหาชื่อการ์ด"
            placeholder="ค้นหาชื่อการ์ด..."
            value={text}
            onChange={(event) => handleSearchInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") handleSearchSubmit();
            }}
          />
        </InputGroup>

        {selects.map((select) => (
          // items = แผนที่ value → label ถ้าไม่ส่ง SelectValue จะโชว์ค่าดิบ
          // อย่าง "all" แทนข้อความจริง
          <Select
            key={select.id}
            items={select.options}
            value={select.value}
            onValueChange={(value) => {
              if (value !== null) select.onValueChange(String(value));
            }}
          >
            <SelectTrigger
              aria-label={select.label}
              className="h-8 w-full rounded-lg bg-white text-sm sm:w-[200px]"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {select.options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        ))}
      </div>
    </div>
  );
}
