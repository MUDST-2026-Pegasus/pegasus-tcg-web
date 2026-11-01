import { Card } from "@/components/ui/card";
import type { AdminCommissionData } from "@/features/admin/admin.types";

type CommissionDefaultRateCardProps = AdminCommissionData["defaultRate"];
type EditableProps = { onChange?: (value: string) => void };

/**
 * การ์ด "อัตราเริ่มต้นทั้งแพลตฟอร์ม"
 *
 * แถบแสดงอัตราเป็นแท่งบาร์แนวนอนที่โชว์ค่าปัจจุบันเทียบกับช่วง 0–15%
 * ถ้าส่ง onChange จะปรับอัตราผ่านช่องตัวเลขโดยคงหน้าตาตามดีไซน์
 */
export function CommissionDefaultRateCard({
  title,
  description,
  value,
  minLabel,
  maxLabel,
  recommendedLabel,
  max,
  onChange,
}: CommissionDefaultRateCardProps & EditableProps) {
  // ตำแหน่งของ handle เป็นเปอร์เซ็นต์ของความกว้างแถบ
  const percent = Math.min(100, (parseFloat(value) / max) * 100);

  return (
    <Card className="gap-[18px] rounded-xl border border-border p-5 shadow-none ring-0">
      <div className="flex flex-col gap-[3px]">
        <p className="text-[15px] font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex w-[105px] items-baseline gap-1 rounded-[10px] border border-border bg-[#fafbfb] px-[18px] py-3.5">
          {onChange ? <input aria-label="อัตราค่าคอมมิชชั่น (%)" type="number" min="0" max="100" step="0.001"
            value={value} onChange={(event) => onChange(event.target.value)}
            className="w-[50px] shrink-0 appearance-none bg-transparent text-[30px] leading-none font-bold tracking-[-0.8px] text-foreground outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
            : <span className="text-[32px] leading-none font-bold text-foreground">{value}</span>}
          <span className="text-lg font-medium text-muted-foreground">%</span>
        </div>

        <div className="flex flex-1 flex-col gap-[7px]">
          <div
            style={{ "--percent": `${percent}%` } as React.CSSProperties}
            className="relative h-[5px] w-full rounded-full bg-muted"
          >
            <div
              className="h-full rounded-full bg-[#0058bc]"
              style={{ width: "var(--percent)" }}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] text-[#9aa5ad]">
            <span>{minLabel}</span>
            <span className="text-muted-foreground">{recommendedLabel}</span>
            <span>{maxLabel}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
