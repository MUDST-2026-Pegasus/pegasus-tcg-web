import { TriangleAlert } from "lucide-react";

import type { AdminCommissionData } from "@/features/admin/admin.types";

type CommissionImpactCardProps = AdminCommissionData["impact"];

/**
 * แถบเตือนผลกระทบต่อผู้ขาย — โทนสีพีชเหมือน alert หน้าคำสั่งซื้อ
 */
export function CommissionImpactCard({
  title,
  description,
}: CommissionImpactCardProps) {
  return (
    <div className="flex flex-col gap-2 rounded-xl bg-[#fdf0dd] px-4 py-4 text-[#b45309]">
      <div className="flex items-center gap-2">
        <TriangleAlert aria-hidden="true" className="size-[15px] shrink-0" />
        <p className="text-xs font-semibold">{title}</p>
      </div>
      <p className="text-xs leading-snug text-[#b45309]/90">{description}</p>
    </div>
  );
}
