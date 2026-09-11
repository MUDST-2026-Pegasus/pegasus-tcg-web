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
import type { AdminUsersData } from "@/features/admin/admin.types";

type UsersToolbarProps = AdminUsersData["toolbar"];

/**
 * ส่วนหัวของการ์ดตาราง — แถวค้นหา/ตัวกรอง และแถวชิปตัวกรองที่ใช้อยู่
 *
 * หมายเหตุ: ในดีไซน์ปุ่ม ✕ บนชิปเป็นตัวอักษร แต่หน้าที่จริงคือปุ่มลบตัวกรอง
 * ที่นี่จึงทำเป็น <button> พร้อมไอคอน lucide เพื่อให้กดด้วยคีย์บอร์ดได้
 */
export function UsersToolbar({
  searchPlaceholder,
  selects,
  advancedLabel,
  appliedLabel,
  chips,
  clearLabel,
}: UsersToolbarProps) {
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
              size="sm"
              aria-label={select.placeholder}
              className="w-full rounded-lg border-input bg-background text-sm sm:w-[200px]"
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

        <Button variant="outline" className="ml-auto rounded-md px-2.5">
          {advancedLabel}
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2 px-5 pb-3.5">
        <p className="text-[11px] text-muted-foreground">{appliedLabel}</p>

        {chips.map((chip) => (
          <span
            key={chip.id}
            className="flex items-center gap-1.5 rounded-md bg-[#e8f1fc] px-2 py-[3px] text-[11px] font-medium text-[#0058bc]"
          >
            {chip.label}
            <button
              type="button"
              aria-label={`ลบตัวกรอง: ${chip.label}`}
              className="rounded-sm opacity-80 transition-opacity hover:opacity-100 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <X aria-hidden="true" className="size-3" />
            </button>
          </span>
        ))}

        <Button
          variant="ghost"
          size="xs"
          className="h-auto px-1 text-[11px] font-medium text-muted-foreground"
        >
          {clearLabel}
        </Button>
      </div>
    </div>
  );
}
