import { ChevronRight, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { AdminCommissionData } from "@/features/admin/admin.types";

type CommissionCategoryListProps = AdminCommissionData["categories"];
type EditableProps = {
  onAdd?: () => void;
  onToggle?: (id: string, checked: boolean) => void;
  onRateChange?: (id: string, rate: string) => void;
  /** เปิด popup แก้กฎของแถวนี้แบบละเอียด (ค่าคงที่ ขั้นต่ำ/สูง ช่วงเวลา) */
  onEdit?: (id: string) => void;
  manageLabel?: string;
  onManage?: () => void;
};

/**
 * การ์ด "อัตราเฉพาะหมวดหมู่" — รายการหมวดที่เปิดสวิตช์ตั้งค่าอัตราแยกได้
 *
 * ใช้ข้อมูลจาก catalog และค่ากฎที่โหลดจาก API เมื่อหน้าส่ง callback เข้ามา
 */
export function CommissionCategoryList({
  title,
  description,
  addLabel,
  items,
  onAdd,
  onToggle,
  onRateChange,
  onEdit,
  manageLabel,
  onManage,
}: CommissionCategoryListProps & EditableProps) {
  return (
    <Card className="gap-0 rounded-xl border border-[#e3e7e8] p-0 shadow-none ring-0">
      <div className="flex items-center justify-between gap-4 px-5 pt-[18px] pb-3.5">
        <div className="flex flex-col gap-[3px]">
          <p className="text-[15px] font-semibold text-[#090b0c]">{title}</p>
          <p className="text-xs text-[#67787c]">{description}</p>
        </div>
        <Button variant="outline" className="rounded-md px-2.5" onClick={onAdd}>
          {addLabel}
        </Button>
      </div>

      <ul className="border-t border-[#eef1f2]">
        {items.length === 0 && <li className="px-5 py-6 text-sm text-muted-foreground">ยังไม่มีเกมหรือหมวดหมู่ให้ตั้งค่า</li>}
        {items.map((item) => (
          <li
            key={item.id}
            className="flex flex-wrap items-center gap-x-3.5 gap-y-2 border-b border-[#eef1f2] px-5 py-3.5 last:border-b-0"
          >
            <div className="flex min-w-[160px] flex-1 basis-[200px] flex-col gap-[3px]">
              <span className="truncate text-[13px] font-medium text-[#090b0c]">
                {item.name}
              </span>
              <span className="truncate text-[11px] text-[#9aa5ad]">
                {item.description}
              </span>
            </div>

            <div className="ml-auto flex w-[150px] shrink-0 items-center gap-[9px]">
              <Switch
                size="sm"
                checked={item.useCustom}
                onCheckedChange={(checked) => onToggle?.(item.id, checked)}
                disabled={!onToggle}
                aria-label={`ตั้งค่าอัตราเฉพาะสำหรับ ${item.name}`}
              />
              <span className={cn("text-[11px]", item.useCustom ? "text-[#414755]" : "text-[#9aa5ad]")}>
                {item.useCustom ? item.customLabel : item.defaultLabel}
              </span>
            </div>

            <div
              className={cn(
                "flex w-[110px] shrink-0 items-baseline gap-1 rounded-lg border px-3 py-[7px]",
                item.useCustom
                  ? "border-[#e3e7e8] bg-white focus-within:border-primary"
                  : "border-[#eef1f2] bg-[#fafbfb]",
              )}
            >
              <input
                type="number"
                min="0"
                max="100"
                step="0.001"
                value={item.rate}
                onChange={(event) => onRateChange?.(item.id, event.target.value)}
                disabled={!item.useCustom || !onRateChange}
                aria-label={`อัตราค่าคอมของ ${item.name}`}
                className="w-full min-w-0 border-none bg-transparent text-sm font-semibold text-[#090b0c] outline-none disabled:text-[#9aa5ad] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <span className="text-[11px] text-[#9aa5ad]">%</span>
            </div>

            {onEdit && (
              <Button
                variant="ghost"
                size="icon-sm"
                className="shrink-0 rounded-md text-[#9aa5ad] hover:text-[#090b0c]"
                onClick={() => onEdit(item.id)}
                aria-label={`แก้ไขกฎของ ${item.name} แบบละเอียด`}
                title="ตั้งค่าแบบละเอียด"
              >
                <Pencil />
              </Button>
            )}
          </li>
        ))}
      </ul>

      {onManage && (
        <button
          type="button"
          onClick={onManage}
          className="flex items-center justify-between border-t border-[#eef1f2] px-5 py-3 text-left text-xs font-medium text-[#414755] hover:bg-[#fafbfb]"
        >
          {manageLabel}
          <ChevronRight className="size-4 text-[#9aa5ad]" />
        </button>
      )}
    </Card>
  );
}
