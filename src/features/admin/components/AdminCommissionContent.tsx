import { Button } from "@/components/ui/button";
import type { AdminCommissionData } from "@/features/admin/admin.types";
import { CommissionCalcCard } from "@/features/admin/components/CommissionCalcCard";
import { CommissionCategoryList } from "@/features/admin/components/CommissionCategoryList";
import { CommissionDefaultRateCard } from "@/features/admin/components/CommissionDefaultRateCard";
import { CommissionImpactCard } from "@/features/admin/components/CommissionImpactCard";
import { CommissionRulesCard } from "@/features/admin/components/CommissionRulesCard";

type AdminCommissionContentProps = {
  data: AdminCommissionData;
};

export function AdminCommissionContent({ data }: AdminCommissionContentProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* หัวหน้า: ชื่อหน้า + ปุ่มการทำงาน */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-[26px] leading-tight font-bold tracking-[-0.5px] text-foreground">
            {data.title}
          </h1>
          <p className="text-[13px] text-muted-foreground">{data.subtitle}</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" className="rounded-md px-2.5">
            {data.actions.historyLabel}
          </Button>
          <Button className="rounded-md bg-[#090b0c] px-2.5 text-white hover:bg-[#090b0c]/90">
            {data.actions.saveLabel}
          </Button>
        </div>
      </div>

      {/* 2 คอลัมน์: 596 (ซ้าย, ยืด) + 340 (ขวา, คงที่)
          บนจอเล็กพับเป็นคอลัมน์เดียว */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex flex-col gap-4">
          <CommissionDefaultRateCard {...data.defaultRate} />
          <CommissionCategoryList {...data.categories} />
        </div>

        <div className="flex flex-col gap-4">
          <CommissionCalcCard {...data.calculation} />
          <CommissionRulesCard {...data.rules} />
          <CommissionImpactCard {...data.impact} />
        </div>
      </div>
    </div>
  );
}
