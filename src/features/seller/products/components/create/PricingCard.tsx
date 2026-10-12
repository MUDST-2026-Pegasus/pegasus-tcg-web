import { useId } from "react";

import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { formatBaht } from "@/features/seller/shared/seller.format";
import { cn } from "@/lib/utils";

import type {
  ListingDraft,
  ProductCreateData,
} from "../../product-create.types";
import {
  formatSignedBaht,
  roundMoney,
  toNumber,
} from "../../products.format";
import { AmountInput } from "../AmountInput";

/** ตั้งราคาห่างจากค่ากลางไม่เกินกี่ % ถึงนับว่า "ใกล้ค่ากลาง" — ตรงกับเคล็ดลับตั้งราคา */
const NEAR_MEDIAN_PERCENT = 5;

const INPUT_CLASS = "h-8 rounded-lg border-input bg-background px-2.5 text-sm";
const READ_ONLY_INPUT_CLASS =
  "h-8 rounded-lg border-input bg-gray-50 px-2.5 text-sm text-gray-500 focus-visible:border-input focus-visible:ring-0";
const LABEL_CLASS = "text-xs font-medium text-gray-700";
const HELPER_CLASS = "text-[10px] leading-normal text-gray-400";

type MarketData = ProductCreateData["pricing"]["market"];

type PricingCardProps = Omit<ProductCreateData["pricing"], "market"> & {
  /** ไม่มี = ยังไม่มีข้อมูลราคาตลาดของสินค้านี้ ซ่อนส่วนเทียบราคา */
  market?: MarketData;
  draft: Pick<ListingDraft, "price" | "cost" | "quantity">;
  onFieldChange: (field: "price" | "cost" | "quantity", value: string) => void;
  /**
   * หน้าแก้ไขสินค้า: ต้นทุนเฉลี่ยกับจำนวนมาจากประวัติรับเข้า แก้ตรงนี้ไม่ได้
   * ต้องไปเพิ่มผ่านหน้าเติมสต็อก ไม่งั้นรายงานกำไรกับประวัติล็อตจะไม่ตรงกัน
   */
  stockLock?: {
    costHelper: string;
    quantityHelper: string;
    restockLabel: string;
    restockTo: string;
  };
  /** เปิดหน้ามาแล้วโฟกัสช่องราคาเลย (มาจากปุ่ม "ปรับราคาขาย") */
  autoFocusPrice?: boolean;
};

export function PricingCard({
  title,
  description,
  priceLabel,
  costLabel,
  costHelper,
  quantityLabel,
  quantityHelper,
  commissionPercent,
  summary,
  market,
  draft,
  onFieldChange,
  stockLock,
  autoFocusPrice = false,
}: PricingCardProps) {
  const priceId = useId();
  const costId = useId();
  const quantityId = useId();

  const price = toNumber(draft.price);
  const cost = toNumber(draft.cost) ?? 0;
  const quantity = toNumber(draft.quantity) ?? 0;

  const commission = roundMoney(((price ?? 0) * commissionPercent) / 100);
  const profitPerUnit = roundMoney((price ?? 0) - cost - commission);
  const totalProfit = roundMoney(profitPerUnit * quantity);

  const summaryItems = [
    {
      id: "price",
      label: summary.priceLabel,
      value: formatBaht(price ?? 0),
      className: "text-base font-semibold text-zinc-950",
    },
    {
      id: "cost",
      label: summary.costLabel,
      value: formatBaht(cost),
      className: "text-base font-semibold text-gray-500",
    },
    {
      id: "commission",
      label: `${summary.commissionLabel} ${commissionPercent}%`,
      value: formatBaht(commission),
      className: "text-base font-semibold text-gray-500",
    },
    {
      id: "profit-per-unit",
      label: summary.profitPerUnitLabel,
      value: formatSignedBaht(profitPerUnit),
      className: cn(
        "text-lg font-bold",
        profitPerUnit < 0 ? "text-red-600" : "text-emerald-700",
      ),
    },
  ];

  const isStockLocked = stockLock !== undefined;

  return (
    <Card className="w-full gap-4 rounded-xl border border-border p-5 shadow-none ring-0">
      <div className="flex flex-col gap-[3px]">
        <h2 className="text-base font-semibold text-zinc-950">{title}</h2>
        <p className="text-xs text-gray-500">{description}</p>
      </div>

      <FieldGroup className="gap-3.5 sm:flex-row">
        <Field className="flex-1 gap-1.5">
          <FieldLabel htmlFor={priceId} className={LABEL_CLASS}>
            {priceLabel} *
          </FieldLabel>
          <AmountInput
            id={priceId}
            required
            autoFocus={autoFocusPrice}
            maxLength={10}
            value={draft.price}
            onValueChange={(value) => onFieldChange("price", value)}
            aria-invalid={price !== null && price <= 0 ? true : undefined}
            className={INPUT_CLASS}
          />
          {market ? (
            <FieldDescription className={HELPER_CLASS}>
              {market.currentMedianLabel} {formatBaht(market.median)}
            </FieldDescription>
          ) : null}
        </Field>

        <Field className="flex-1 gap-1.5">
          <FieldLabel htmlFor={costId} className={LABEL_CLASS}>
            {costLabel}
            {isStockLocked ? "" : " *"}
          </FieldLabel>
          <AmountInput
            id={costId}
            required={!isStockLocked}
            readOnly={isStockLocked}
            maxLength={10}
            value={draft.cost}
            onValueChange={(value) => onFieldChange("cost", value)}
            className={isStockLocked ? READ_ONLY_INPUT_CLASS : INPUT_CLASS}
          />
          <FieldDescription className={HELPER_CLASS}>
            {stockLock?.costHelper ?? costHelper}
          </FieldDescription>
        </Field>

        <Field className="flex-1 gap-1.5">
          <FieldLabel htmlFor={quantityId} className={LABEL_CLASS}>
            {quantityLabel}
            {isStockLocked ? "" : " *"}
          </FieldLabel>
          <AmountInput
            id={quantityId}
            required={!isStockLocked}
            readOnly={isStockLocked}
            maxLength={6}
            allowDecimal={false}
            value={draft.quantity}
            onValueChange={(value) => onFieldChange("quantity", value)}
            aria-invalid={draft.quantity !== "" && quantity <= 0 ? true : undefined}
            className={isStockLocked ? READ_ONLY_INPUT_CLASS : INPUT_CLASS}
          />
          <FieldDescription className={HELPER_CLASS}>
            {stockLock ? (
              <>
                {stockLock.quantityHelper}{" "}
                <Link
                  to={stockLock.restockTo}
                  className="font-medium text-teal-600 no-underline hover:underline"
                >
                  {stockLock.restockLabel}
                </Link>
              </>
            ) : (
              quantityHelper
            )}
          </FieldDescription>
        </Field>
      </FieldGroup>

      <div className="flex flex-wrap items-center gap-y-3 rounded-[10px] border border-gray-100 bg-neutral-50 p-4">
        {summaryItems.map((item) => (
          <div
            key={item.id}
            className="flex min-w-28 flex-1 flex-col gap-[5px]"
          >
            <p className="text-xs text-gray-500">{item.label}</p>
            <p className={item.className}>{item.value}</p>
          </div>
        ))}

        <div className="flex flex-col items-end gap-[5px]">
          <p className="text-xs text-gray-500">
            {summary.totalProfitLabel} {quantity} {summary.unit}
          </p>
          <p
            className={cn(
              "text-lg font-bold",
              totalProfit < 0 ? "text-red-600" : "text-emerald-700",
            )}
          >
            {formatSignedBaht(totalProfit)}
          </p>
        </div>
      </div>

      {market ? <MarketComparison market={market} price={price} /> : null}
    </Card>
  );
}

type MarketComparisonProps = {
  market: MarketData;
  price: number | null;
};

/** แถบเทียบราคาของเรากับช่วงราคาต่ำสุด–สูงสุดของประกาศอื่นในตลาด */
function MarketComparison({ market, price }: MarketComparisonProps) {
  // ตำแหน่งราคาของเราในช่วงต่ำสุด–สูงสุดของตลาด (0–100%)
  const range = market.high - market.low;
  const pricePosition =
    price === null || range <= 0
      ? 0
      : Math.min(Math.max((price - market.low) / range, 0), 1) * 100;

  const diffPercent =
    price === null ? null : ((price - market.median) / market.median) * 100;
  const isNearMedian =
    diffPercent !== null && Math.abs(diffPercent) <= NEAR_MEDIAN_PERCENT;

  let badgeLabel: string | null = null;
  if (diffPercent !== null) {
    const rounded = Math.abs(diffPercent).toFixed(1);
    if (rounded === "0.0") badgeLabel = market.equalLabel;
    else if (diffPercent > 0) badgeLabel = `${market.aboveLabel} ${rounded}%`;
    else badgeLabel = `${market.belowLabel} ${rounded}%`;
  }

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-gray-700">
          {market.compareLabel} ({market.listingCount} {market.listingsLabel})
        </p>
        {badgeLabel ? (
          <Badge
            className={cn(
              "h-5 rounded-full px-2 text-xs",
              isNearMedian
                ? "bg-green-100 text-emerald-700"
                : "bg-orange-100 text-amber-700",
            )}
          >
            {badgeLabel}
          </Badge>
        ) : null}
      </div>

      <div
        aria-hidden="true"
        style={{ "--price-position": `${pricePosition}%` } as React.CSSProperties}
        className="flex h-7 items-center overflow-hidden rounded-lg bg-gray-100"
      >
        <div className="h-7 w-(--price-position) rounded-lg bg-emerald-50" />
        {price !== null ? (
          <div className="h-7 w-[3px] shrink-0 bg-teal-600" />
        ) : null}
      </div>

      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] text-gray-400">
          {market.lowLabel} {formatBaht(market.low)}
        </p>
        <p className="text-[10px] font-medium text-gray-700">
          {market.medianLabel} {formatBaht(market.median)}
        </p>
        <p className="text-[10px] text-gray-400">
          {market.highLabel} {formatBaht(market.high)}
        </p>
      </div>
    </div>
  );
}
