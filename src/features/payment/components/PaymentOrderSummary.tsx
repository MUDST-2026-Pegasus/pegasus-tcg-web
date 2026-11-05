import { useState } from "react";
import { PAYMENT_PAGE_FIXTURE } from "@/features/payment/Payment.fixture";

function ProductThumbnail({
  imageUrl,
  productName,
}: {
  imageUrl?: string | null;
  productName: string;
}) {
  const [hasError, setHasError] = useState(false);

  if (!imageUrl || hasError) {
    return (
      <div className="w-full h-full bg-slate-50 border border-muted/80 rounded flex flex-col items-center justify-center p-1 text-center">
        <div className="w-7 h-9 border border-slate-200 rounded bg-card shadow-2xs flex items-center justify-center">
          <span className="text-[7px] font-bold text-slate-400 uppercase tracking-tighter">
            TCG
          </span>
        </div>
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={productName}
      onError={() => setHasError(true)}
      className="w-full h-full object-contain"
    />
  );
}

export interface OrderItemSummaryData {
  id?: number;
  productName: string;
  variantLabel?: string;
  condition?: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  imageUrl?: string | null;
}

interface PaymentOrderSummaryProps {
  items?: OrderItemSummaryData[];
  subtotal?: number;
  shippingTotal?: number;
  grandTotal?: number;
}

export function PaymentOrderSummary({
  items,
  subtotal,
  shippingTotal,
  grandTotal,
}: PaymentOrderSummaryProps) {
  const hasRealItems = Boolean(items && items.length > 0);

  const displayItems = hasRealItems
    ? items!
    : [
        {
          id: 1,
          productName: PAYMENT_PAGE_FIXTURE.orderSummary.item.name,
          variantLabel: PAYMENT_PAGE_FIXTURE.orderSummary.item.description,
          condition: "",
          unitPrice: 12900,
          quantity: 1,
          lineTotal: 12900,
          imageUrl: null,
        },
      ];

  const formattedSubtotal = hasRealItems && subtotal !== undefined
    ? `THB ${Number(subtotal).toLocaleString("th-TH")}`
    : PAYMENT_PAGE_FIXTURE.orderSummary.subtotal;

  const formattedShipping = hasRealItems && shippingTotal !== undefined
    ? `THB ${Number(shippingTotal).toLocaleString("th-TH")}`
    : PAYMENT_PAGE_FIXTURE.orderSummary.shipping;

  const formattedTotal = hasRealItems && grandTotal !== undefined
    ? `THB ${Number(grandTotal).toLocaleString("th-TH")}`
    : PAYMENT_PAGE_FIXTURE.orderSummary.total;

  return (
    <div className="bg-card rounded-2xl border border-muted shadow-sm p-6 space-y-4">
      {/* Title */}
      <h2 className="text-xl font-bold text-slate-900 tracking-tight">
        Order Summary
      </h2>

      <div className="h-px bg-secondary" />

      {/* Items List */}
      <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
        {displayItems.map((item, index) => {
          const subtitle = [item.variantLabel, item.condition]
            .filter(Boolean)
            .join(" · ");

          return (
            <div key={item.id ?? index} className="flex gap-4 items-start">
              <div className="w-16 h-20 rounded-lg bg-[#F8FAFC] border border-muted overflow-hidden shrink-0 flex items-center justify-center p-1">
                <ProductThumbnail
                  imageUrl={item.imageUrl}
                  productName={item.productName}
                />
              </div>

              <div className="flex-1 min-w-0 pt-0.5">
                <p className="font-bold text-base text-slate-900 leading-snug truncate">
                  {item.productName}
                </p>
                {subtitle && (
                  <p className="text-xs font-semibold uppercase text-slate-600 tracking-wide truncate mt-1">
                    {subtitle}
                  </p>
                )}
                <p className="text-sm font-normal text-slate-900 mt-1.5">
                  THB {Number(item.lineTotal || item.unitPrice * (item.quantity || 1)).toLocaleString("th-TH")}
                  {item.quantity > 1 && (
                    <span className="text-xs text-slate-500 font-normal ml-1">
                      × {item.quantity}
                    </span>
                  )}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="h-px bg-secondary" />

      {/* Price Breakdown */}
      <div className="space-y-3 text-sm">
        <div className="flex justify-between items-center">
          <span className="font-normal text-slate-600">Subtotal</span>
          <span className="font-normal text-slate-900">{formattedSubtotal}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-normal text-slate-600">Shipping</span>
          <span className="font-normal text-slate-900">{formattedShipping}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-normal text-slate-600">Tax</span>
          <span className="font-normal text-slate-600">Included</span>
        </div>
      </div>

      <div className="h-px bg-secondary" />

      {/* Total Row */}
      <div className="flex justify-between items-center pt-1">
        <span className="text-base font-bold text-slate-900">Total</span>
        <span className="text-2xl font-black text-slate-900 tracking-tight">
          {formattedTotal}
        </span>
      </div>
    </div>
  );
}
