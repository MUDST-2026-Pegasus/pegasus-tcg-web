import { Card } from "@/components/ui/card";
import { PromotionDiscountLines } from "@/features/promotions/PromotionDiscountLines";
import { formatBaht } from "@/features/seller/shared/seller.format";

import type { SellerOrderDetails } from "../../orders.types";

/** Order payment and promotion breakdown shown separately from the seller's profit. */
export function PromotionOrderMoneyCard({ order }: { order: SellerOrderDetails }) {
  const commissionBase = order.commissionBase
    ?? Math.max(0, order.itemsSubtotal - (order.sellerDiscount ?? 0));
  const commissionRate = commissionBase > 0
    ? order.commissionAmount / commissionBase * 100
    : 0;
  const commissionRateText = commissionRate.toFixed(1).replace(/\.0$/, "");
  const carrierName = order.shipments.find((shipment) => shipment.carrierName)?.carrierName;

  return (
    <Card className="w-full gap-3 rounded-xl border border-border p-5 shadow-none ring-0">
      <p className="text-xs font-semibold text-foreground">ยอดเงินคำสั่งซื้อ</p>

      <MoneyRow label="ยอดสินค้า" amount={order.itemsSubtotal} />
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
      <MoneyRow label={carrierName ? `ค่าส่ง · ${carrierName}` : "ค่าส่ง"} amount={order.shippingFee} />
      <MoneyRow label="ลูกค้าจ่าย" amount={order.grandTotal} strong />

      {(order.platformSubsidy ?? 0) > 0 && (
        <MoneyRow label="Pegasus ชดเชยส่วนลด" amount={order.platformSubsidy ?? 0} />
      )}
      <MoneyRow
        label={`คอมมิชชั่น ${commissionRateText}% ของ ${formatBaht(commissionBase)}`}
        amount={order.commissionAmount}
        negative
      />

      <div className="h-px bg-border" />
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-foreground">ร้านได้รับ</span>
        <span className="text-2xl font-bold tabular-nums text-primary">{formatBaht(order.sellerNetAmount)}</span>
      </div>
    </Card>
  );
}

function MoneyRow({
  label,
  amount,
  strong = false,
  negative = false,
}: {
  label: string;
  amount: number;
  strong?: boolean;
  negative?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className={`shrink-0 text-right tabular-nums ${strong ? "font-semibold text-foreground" : "font-medium text-foreground"}`}>
        {negative ? "− " : ""}{formatBaht(amount)}
      </span>
    </div>
  );
}
