import { Card, CardContent } from "@/components/ui/card";

import { formatBahtShort } from "../../after-sales.format";
import { useTranslate } from "@/lib/i18n";

/**
 * Pending Funds Summary (เงินที่รอผลคำขอคืน)
 */
export function PendingFundsWidget({
  pendingFundsSummary,
}: {
  pendingFundsSummary: { count: number; total: number };
}) {
  const { t } = useTranslate("seller");
  return (
    <Card className="gap-0 rounded-xl border border-border py-0 shadow-none ring-0">
      <CardContent className="p-5 space-y-3.5">
        <div className="flex items-baseline justify-between">
          <div>
            <h3 className="font-bold text-sm text-foreground">
              {t("sellerReturns.pendingFunds.title", "เงินที่รอผลคำขอคืน")}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t("sellerReturns.pendingFunds.subOrders", "{count} ออเดอร์ย่อย", { count: pendingFundsSummary.count })}
            </p>
          </div>
          <div className="text-xl font-bold text-amber-600 dark:text-amber-400 tracking-tight">
            {formatBahtShort(pendingFundsSummary.total)}
          </div>
        </div>

        <div className="border-t border-border pt-3 space-y-2 text-xs">
          <div className="text-[11px] font-semibold text-muted-foreground">
            {t("sellerReturns.pendingFunds.impactTitle", "ผลต่อเงินของคุณเมื่อจบเรื่อง")}
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">{t("sellerReturns.pendingFunds.fullRefundLabel", "คืนเต็มจำนวน")}</span>
            <span className="font-medium text-destructive">{t("sellerReturns.pendingFunds.fullRefundImpact", "ไม่ได้รับเงินออเดอร์นี้")}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">{t("sellerReturns.pendingFunds.partialRefundLabel", "คืนบางส่วน")}</span>
            <span className="font-medium text-amber-600 dark:text-amber-400">{t("sellerReturns.pendingFunds.partialRefundImpact", "ได้ส่วนที่เหลือ หลังหักค่าคอม")}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">{t("sellerReturns.pendingFunds.rejectLabel", "ปฏิเสธ")}</span>
            <span className="font-medium text-emerald-600 dark:text-emerald-400">{t("sellerReturns.pendingFunds.rejectImpact", "ได้เต็มจำนวนตามกำหนดเดิม")}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
