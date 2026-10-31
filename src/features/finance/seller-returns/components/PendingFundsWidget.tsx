import { Card, CardContent } from "@/components/ui/card";

import { formatBahtShort } from "../../after-sales.format";

/**
 * Pending Funds Summary (เงินที่รอผลคำขอคืน)
 */
export function PendingFundsWidget({
  pendingFundsSummary,
}: {
  pendingFundsSummary: { count: number; total: number };
}) {
  return (
    <Card className="gap-0 rounded-xl border border-border py-0 shadow-none ring-0">
      <CardContent className="p-5 space-y-3.5">
        <div className="flex items-baseline justify-between">
          <div>
            <h3 className="font-bold text-sm text-foreground">
              เงินที่รอผลคำขอคืน
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {pendingFundsSummary.count} ออเดอร์ย่อย
            </p>
          </div>
          <div className="text-xl font-bold text-amber-600 dark:text-amber-400 tracking-tight">
            {formatBahtShort(pendingFundsSummary.total)}
          </div>
        </div>

        <div className="border-t border-border pt-3 space-y-2 text-xs">
          <div className="text-[11px] font-semibold text-muted-foreground">
            ผลต่อเงินของคุณเมื่อจบเรื่อง
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">คืนเต็มจำนวน</span>
            <span className="font-medium text-destructive">ไม่ได้รับเงินออเดอร์นี้</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">คืนบางส่วน</span>
            <span className="font-medium text-amber-600 dark:text-amber-400">ได้ส่วนที่เหลือ หลังหักค่าคอม</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">ปฏิเสธ</span>
            <span className="font-medium text-emerald-600 dark:text-emerald-400">ได้เต็มจำนวนตามกำหนดเดิม</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
