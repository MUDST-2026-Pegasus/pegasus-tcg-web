import { Card } from "@/components/ui/card";
import { PromotionDiscountLines } from "@/features/promotions/PromotionDiscountLines";
import { formatBaht } from "@/features/seller/shared/seller.format";
import { cn } from "@/lib/utils";

import type { SellerOrderDetails } from "../../orders.types";
import { useTranslate } from "@/lib/i18n";

/** Order payment and promotion breakdown shown separately from the seller's profit. */
export function PromotionOrderMoneyCard({ order }: { order: SellerOrderDetails }) {
  const { t } = useTranslate("seller");
  const commissionBase = order.commissionBase
    ?? Math.max(0, order.itemsSubtotal - (order.sellerDiscount ?? 0));
  const commissionRate = commissionBase > 0
    ? order.commissionAmount / commissionBase * 100
    : 0;
  const commissionRateText = commissionRate.toFixed(1).replace(/\.0$/, "");
  const carrierName = order.shipments.find((shipment) => shipment.carrierName)?.carrierName;

  return (
    <Card className="w-full gap-3 rounded-xl border border-border p-5 shadow-none ring-0">
      <p className="text-xs font-semibold text-foreground">{t("orderDetail.money.title", "ยอดเงินคำสั่งซื้อ")}</p>

      <MoneyRow label={t("orderDetail.money.items", "ยอดสินค้า")} amount={order.itemsSubtotal} />
      <MoneyRow label={carrierName ? t("orderDetail.money.shippingWithCarrier", "ค่าส่ง · {carrier}", { carrier: carrierName }) : t("orderDetail.money.shipping", "ค่าส่ง")} amount={order.shippingFee} />
      <dl className="flex flex-col gap-2">
        <PromotionDiscountLines
          sellerDiscount={order.sellerDiscount}
          platformDiscount={order.platformDiscount}
          promotions={order.promotions}
          formatAmount={formatBaht}
          colorScheme="order"
          asDefinitionList
          rowClassName="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs"
        />
      </dl>
      <MoneyRow label={t("orderDetail.money.customerPaid", "ลูกค้าจ่าย")} amount={order.grandTotal} muted />

      <div className="h-px bg-border" />
      {(order.platformSubsidy ?? 0) > 0 && (
        <MoneyRow label={t("orderDetail.money.platformDiscount", "Pegasus ชดเชยส่วนลด")} amount={order.platformSubsidy ?? 0} positive />
      )}
      <MoneyRow
        label={t("orderDetail.money.commission", "คอมมิชชั่น {rate}% ของ {base}", { rate: commissionRateText, base: formatBaht(commissionBase) })}
        amount={order.commissionAmount}
        negative
      />

      <div className="h-px bg-border" />
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-foreground">{t("orderDetail.money.sellerReceives", "ร้านได้รับ")}</span>
        <span className="text-2xl font-bold tabular-nums text-emerald-700">{formatBaht(order.sellerNetAmount)}</span>
      </div>

      {(order.platformDiscount ?? 0) > 0 && (
        <p className="rounded-lg bg-primary/10 px-3 py-2 text-xs leading-relaxed text-primary">
          {t("orderDetail.money.platformNote", "โค้ด Pegasus ไม่ลดรายได้ร้าน — เงินส่วนนี้โอนเข้ากระเป๋าร้านพร้อมกันตอนปล่อยเงิน")}
        </p>
      )}
    </Card>
  );
}

function MoneyRow({
  label,
  amount,
  muted = false,
  negative = false,
  positive = false,
}: {
  label: string;
  amount: number;
  muted?: boolean;
  negative?: boolean;
  positive?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn(
        "shrink-0 text-right font-medium tabular-nums",
        muted ? "text-muted-foreground" : positive ? "text-emerald-700" : "text-foreground",
      )}>
        {negative ? "− " : positive ? "+ " : ""}{formatBaht(amount)}
      </span>
    </div>
  );
}
