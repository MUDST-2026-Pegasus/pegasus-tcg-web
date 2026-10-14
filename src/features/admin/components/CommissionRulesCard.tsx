import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import type { AdminCommissionData } from "@/features/admin/admin.types";

type CommissionRulesCardProps = AdminCommissionData["rules"];

/**
 * การ์ด "กฎการเก็บค่าธรรมเนียม" — 4 สวิตช์ในการ์ดขาว
 */
export function CommissionRulesCard({ title, items }: CommissionRulesCardProps) {
  return (
    <Card className="gap-3.5 rounded-xl border border-[#e3e7e8] p-5 shadow-none ring-0">
      <p className="text-[13px] font-semibold text-[#090b0c]">{title}</p>
      <ul className="flex flex-col gap-3.5">
        {items.map((rule) => (
          <li key={rule.id} className="flex items-center gap-2.5">
            <Switch
              size="sm"
              checked={rule.active}
              disabled
              className="disabled:opacity-100"
              aria-label={rule.label}
            />
            <span className="text-xs text-[#414755]">
              {rule.label}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
