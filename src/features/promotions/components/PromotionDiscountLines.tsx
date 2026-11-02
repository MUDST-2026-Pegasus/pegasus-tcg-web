import type { ReactNode } from "react";

import { PromotionOwnerBadge } from "./PromotionOwnerBadge";

export type PromotionOwnerType = "SELLER" | "PLATFORM";

export type PromotionCodeSummary = {
  code: string;
  ownerType: PromotionOwnerType;
};

type PromotionDiscountLinesProps = {
  sellerDiscount?: number | null;
  platformDiscount?: number | null;
  promotions?: readonly PromotionCodeSummary[] | null;
  formatAmount: (amount: number) => string;
  className?: string;
  rowClassName?: string;
  appearance?: "default" | "dark";
  asDefinitionList?: boolean;
  labelStyle?: "discount" | "funding";
  labels?: Partial<Record<PromotionOwnerType, string>>;
  valuePrefix?: (ownerType: PromotionOwnerType) => ReactNode;
};

const DEFAULT_LABEL: Record<PromotionOwnerType, string> = {
  SELLER: "ส่วนลดร้าน",
  PLATFORM: "ส่วนลด Pegasus",
};

/** Shared owner tag and discount row used by buyer, seller and admin order summaries. */
export function PromotionDiscountLines({
  sellerDiscount = 0,
  platformDiscount = 0,
  promotions = [],
  formatAmount,
  className,
  rowClassName,
  appearance = "default",
  asDefinitionList = false,
  labelStyle = "discount",
  labels = DEFAULT_LABEL,
  valuePrefix = () => "−",
}: PromotionDiscountLinesProps) {
  const discountAmounts = {
    SELLER: sellerDiscount ?? 0,
    PLATFORM: platformDiscount ?? 0,
  };
  const appliedPromotions = promotions ?? [];
  const lines = [
    { ownerType: "SELLER" as const, amount: discountAmounts.SELLER },
    { ownerType: "PLATFORM" as const, amount: discountAmounts.PLATFORM },
  ].filter((line) => line.amount > 0);

  if (lines.length === 0) return null;

  const dark = appearance === "dark";

  const renderedLines = lines.map(({ ownerType, amount }) => {
        const codes = appliedPromotions
          .filter((promotion) => promotion.ownerType === ownerType)
          .map((promotion) => promotion.code)
          .filter(Boolean);
        const codeText = codes.length ? ` · ${codes.join(", ")}` : "";

        const labelText = labelStyle === "funding"
          ? ownerType === "SELLER"
            ? `โค้ดร้าน${codes.length ? ` ${codes.join(", ")}` : ""} · ร้านออก`
            : `โค้ด Pegasus${codes.length ? ` ${codes.join(", ")}` : ""} · Pegasus ออก`
          : `${labels[ownerType] ?? DEFAULT_LABEL[ownerType]}${codeText}`;
        const label = (
          <>
            <span className={dark ? "text-gray-300" : "text-muted-foreground"}>
              {labelText}
            </span>
            <PromotionOwnerBadge ownerType={ownerType} />
          </>
        );
        const value = (
          <span className={
            ownerType === "SELLER"
              ? dark ? "text-emerald-300" : "text-emerald-700"
              : dark ? "text-sky-300" : "text-sky-700"
          }>
            {valuePrefix(ownerType)} {formatAmount(amount)}
          </span>
        );
        const rowClass = rowClassName ?? "flex flex-wrap items-center gap-x-2 gap-y-1 text-xs";

        return asDefinitionList ? (
          <div key={ownerType} className={rowClass} data-promotion-owner={ownerType}>
            <dt className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">{label}</dt>
            <dd className="shrink-0 text-right font-medium tabular-nums">{value}</dd>
          </div>
        ) : (
          <div key={ownerType} className={rowClass} data-promotion-owner={ownerType}>
            {label}
            <span className="ml-auto shrink-0 font-medium tabular-nums">{value}</span>
          </div>
        );
      });

  if (asDefinitionList) return <>{renderedLines}</>;
  return <div className={className}>{renderedLines}</div>;
}
