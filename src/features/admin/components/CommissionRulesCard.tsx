import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import type { AdminCommissionData } from "@/features/admin/admin.types";

type CommissionRulesCardProps = AdminCommissionData["rules"];

/**
 * การ์ด "กฎการเก็บค่าธรรมเนียม" — 4 สวิตช์ในการ์ดขาว
 */
export function CommissionRulesCard({ title, items }: CommissionRulesCardProps) {
  return (
    <Card className="gap-3 rounded-xl border border-border p-5 shadow-none ring-0">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <ul className="flex flex-col gap-3.5">
        {items.map((rule) => (
          <li key={rule.id} className="flex items-center gap-2.5">
            <Switch
              size="sm"
              defaultChecked={rule.active}
              aria-label={rule.label}
            />
            <span className="text-[13px] text-muted-foreground">
              {rule.label}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
