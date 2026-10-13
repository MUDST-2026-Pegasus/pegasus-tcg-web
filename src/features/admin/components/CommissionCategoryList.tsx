import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import type { AdminCommissionData } from "@/features/admin/admin.types";

type CommissionCategoryListProps = AdminCommissionData["categories"];
type EditableProps = {
  onAdd?: () => void;
  onToggle?: (id: string, checked: boolean) => void;
  onRateChange?: (id: string, rate: string) => void;
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
}: CommissionCategoryListProps & EditableProps) {
  return (
    <Card className="gap-0 rounded-xl border border-border p-0 shadow-none ring-0">
      <div className="flex items-start justify-between gap-4 px-5 pt-[18px] pb-4">
        <div className="flex flex-col gap-1">
          <p className="text-[15px] font-semibold text-foreground">{title}</p>
          <p className="text-[13px] text-muted-foreground">{description}</p>
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
            className="flex items-center gap-4 border-b border-[#eef1f2] px-5 py-3.5 last:border-b-0"
          >
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-sm font-medium text-foreground">
                {item.name}
              </span>
              <span className="text-[13px] text-muted-foreground">
                {item.description}
              </span>
            </div>

            <div className="flex w-[150px] items-center gap-2.5">
              <Switch
                size="sm"
                checked={item.useCustom}
                onCheckedChange={(checked) => onToggle?.(item.id, checked)}
                disabled={!onToggle}
                aria-label={`ตั้งค่าอัตราเฉพาะสำหรับ ${item.name}`}
              />
              <span className="text-[13px] text-muted-foreground">
                {item.useCustom ? item.customLabel : item.defaultLabel}
              </span>
            </div>

            <div className="flex h-[31px] w-[110px] items-baseline gap-1 rounded-md border border-border px-3">
              <input
                type="number"
                min="0"
                max="100"
                step="0.001"
                value={item.rate}
                onChange={(event) => onRateChange?.(item.id, event.target.value)}
                disabled={!item.useCustom || !onRateChange}
                aria-label={`อัตราค่าคอมของ ${item.name}`}
                className="w-full min-w-0 border-none bg-transparent text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground"
              />
              <span className="text-xs text-muted-foreground">%</span>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
