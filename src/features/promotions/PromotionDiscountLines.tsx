import { PromotionOwnerTag } from "./PromotionOwnerTag";
import type { PromotionCodeSummary, PromotionOwnerType } from "./order.types";

type PromotionDiscountLinesProps = {
  sellerDiscount?: number | null;
  platformDiscount?: number | null;
  promotions?: readonly PromotionCodeSummary[] | null;
  formatAmount: (amount: number) => string;
  className?: string;
  rowClassName?: string;
  colorScheme?: "order" | "return";
  asDefinitionList?: boolean;
  labels?: Partial<Record<PromotionOwnerType, string>>;
};

const DEFAULT_LABEL: Record<PromotionOwnerType, string> = {
  SELLER: "ส่วนลดร้าน",
  PLATFORM: "ส่วนลด Pegasus",
};

/** Shared owner tags and discount rows for buyer, seller, and admin order summaries. */
export function PromotionDiscountLines({
  sellerDiscount = 0,
  platformDiscount = 0,
  promotions = [],
  formatAmount,
  className,
  rowClassName,
  colorScheme = "order",
  asDefinitionList = false,
  labels = DEFAULT_LABEL,
}: PromotionDiscountLinesProps) {
  const appliedPromotions = promotions ?? [];
  const lines = [
    { ownerType: "SELLER" as const, amount: sellerDiscount ?? 0 },
    { ownerType: "PLATFORM" as const, amount: platformDiscount ?? 0 },
  ].filter((line) => line.amount > 0);

  if (lines.length === 0) return null;

  const renderedLines = lines.map(({ ownerType, amount }) => {
    const codes = appliedPromotions
      .filter((promotion) => promotion.ownerType === ownerType)
      .map((promotion) => promotion.code)
      .filter(Boolean);
    const codeText = codes.length ? ` · ${codes.join(", ")}` : "";
    const label = (
      <>
        <span className="text-muted-foreground">
          {labels[ownerType] ?? DEFAULT_LABEL[ownerType]}{codeText}
        </span>
        {colorScheme === "order" && <PromotionOwnerTag owner={ownerType} tone="order" />}
      </>
    );
    const valueTone = colorScheme === "return"
      ? "text-primary"
      : ownerType === "SELLER" ? "text-orange-700" : "text-primary";
    const rowClass = rowClassName ?? "flex flex-wrap items-center gap-x-2 gap-y-1 text-xs";

    return asDefinitionList ? (
      <div key={ownerType} className={rowClass} data-promotion-owner={ownerType}>
        <dt className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">{label}</dt>
        <dd className="shrink-0 text-right font-medium tabular-nums">
          <span className={valueTone}>− {formatAmount(amount)}</span>
        </dd>
      </div>
    ) : (
      <div key={ownerType} className={rowClass} data-promotion-owner={ownerType}>
        {label}
        <span className={`ml-auto shrink-0 font-medium tabular-nums ${valueTone}`}>
          − {formatAmount(amount)}
        </span>
      </div>
    );
  });

  if (asDefinitionList) return <>{renderedLines}</>;
  return <div className={className}>{renderedLines}</div>;
}
