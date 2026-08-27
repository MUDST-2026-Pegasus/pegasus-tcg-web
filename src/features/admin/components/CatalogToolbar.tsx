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
import type { AdminCatalogData } from "@/features/admin/admin.types";

type CatalogToolbarProps = AdminCatalogData["toolbar"];

/**
 * แถบค้นหา + ตัวกรองด้านบนตารางสินค้า
 *
 * หมายเหตุ: ใน Figma ป้าย "แสดง N จาก M ใบ" ถูกวางทับกล่องค้นหาพอดี
 * (เลเยอร์ absolute ซ้อนกัน) ซึ่งน่าจะเป็นอุบัติเหตุตอนจัดเลย์เอาต์
 * ที่นี่จึงย้ายมาไว้เป็นบรรทัดบนแถบเครื่องมือแทน ให้อ่านออกจริง
 */
export function CatalogToolbar({
  resultLabel,
  searchPlaceholder,
  selects,
}: CatalogToolbarProps) {
  return (
    <div className="flex flex-col gap-2.5">
      <Badge className="h-5 w-fit rounded-full bg-[#eef1f2] px-2 text-[11px] text-muted-foreground">
        {resultLabel}
      </Badge>

      <div className="flex flex-wrap items-center gap-2.5">
        <InputGroup className="h-8 w-full bg-white rounded-lg sm:w-[320px]">
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupInput
            type="search"
            aria-label={searchPlaceholder}
            placeholder={searchPlaceholder}
          />
        </InputGroup>

        {selects.map((select) => (
          // items = แผนที่ value → label ถ้าไม่ส่ง SelectValue จะโชว์ค่าดิบ
          // อย่าง "all" แทนข้อความจริง
          <Select
            key={select.id}
            items={Object.fromEntries(
              select.options.map((option) => [option.value, option.label]),
            )}
            defaultValue={select.options[0]?.value}
          >
            <SelectTrigger
              aria-label={select.placeholder}
              className="h-8 w-full rounded-lg bg-white text-sm sm:w-[200px]"
            >
              <SelectValue placeholder={select.placeholder} />
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
