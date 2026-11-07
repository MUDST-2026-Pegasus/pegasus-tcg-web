import { effectivePrice, isOnSale, priceTagState } from "@/components/sale";
import type {
  CatalogCardEffectDto,
  CatalogVariantDto,
  MarketStatDto,
  PublicListingDetailDto,
  PublicListingDto,
} from "./catalog.types";

type Listing = Pick<
  PublicListingDto,
  "quantityAvailable" | "pricing" | "seller"
> &
  Partial<Pick<PublicListingDetailDto["listing"], "status" | "gradingCompany">>;
export type BuyBoxState =
  "raw" | "sale" | "flash" | "graded" | "last-item" | "sold-out" | "own";
export function buyBoxState(
  listing: Listing,
  username?: string | null,
): BuyBoxState {
  if (username === listing.seller.username) return "own";
  if (listing.status === "SOLD_OUT" || listing.quantityAvailable <= 0)
    return "sold-out";
  const priceState = priceTagState(listing.pricing);
  if (priceState !== "default") return priceState;
  if (listing.gradingCompany) return "graded";
  return listing.quantityAvailable === 1 ? "last-item" : "raw";
}

export function marketHint(
  market: MarketStatDto | null | undefined,
  price: number,
) {
  if (!market || market.medianPrice == null || market.medianPrice <= 0)
    return { kind: "none", percent: 0 } as const;
  if (market.sampleSize < 3) return { kind: "low", percent: 0 } as const;
  const delta = ((price - market.medianPrice) / market.medianPrice) * 100;
  return {
    kind: Math.abs(delta) <= 3 ? "equal" : delta < 0 ? "below" : "above",
    percent: Math.abs(delta),
  } as const;
}

/** Sum server-provided unit prices, charging excess limited units at list price. */
export function listingTotal(
  listing: Pick<PublicListingDto, "price" | "pricing">,
  quantity: number,
) {
  const pricing = listing.pricing;
  if (!isOnSale(pricing))
    return effectivePrice(pricing, listing.price) * quantity;
  const limit = pricing.sale.perBuyerLimit;
  const discounted =
    limit == null ? quantity : Math.min(quantity, Math.max(0, limit));
  return (
    Math.round(
      (discounted * pricing.salePrice +
        (quantity - discounted) * pricing.listPrice) *
        100,
    ) / 100
  );
}

export function displayValue(value: unknown): string | null {
  if (value == null || typeof value === "object") return null;
  const text = String(value).trim();
  return text && text !== "—" && text !== "NOT_APPLICABLE" ? text : null;
}

export function versionOffers(
  variants: CatalogVariantDto[],
  listings: PublicListingDto[],
) {
  return variants
    .filter((v) => v.active)
    .map((variant) => {
      const offers = listings
        .filter(
          (l) => l.card.variantId === variant.id && l.quantityAvailable > 0,
        )
        .sort(
          (a, b) =>
            effectivePrice(a.pricing, a.price) -
              effectivePrice(b.pricing, b.price) || a.id - b.id,
        );
      return { variant, cheapest: offers[0], count: offers.length };
    });
}

export function sortedEffects(effects: CatalogCardEffectDto[]) {
  return [...effects].sort(
    (a, b) =>
      Number(a.effectType === "RULE") - Number(b.effectType === "RULE") ||
      a.displayOrder - b.displayOrder,
  );
}

export function certificateHref(
  company: string | null,
  cert: string | null | undefined,
) {
  if (!cert || !company) return null;
  switch (company.toUpperCase()) {
    case "PSA":
      return `https://www.psacard.com/cert/${encodeURIComponent(cert)}`;
    case "BGS":
    case "BVG":
    case "BCCG":
      return "https://www.beckett.com/grading/card-lookup";
    case "CGC":
      return "https://www.cgccards.com/certlookup/";
    default:
      return null;
  }
}
