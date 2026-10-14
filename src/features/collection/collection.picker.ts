import type { CardCondition, ProductSummaryDto } from "@/features/catalog/catalog.types";

import type { CollectionPayload, CollectionVariant } from "./collection.types";

/** A catalogue card ticked in the picker — kept apart from the search page so it survives paging. */
export type PickedCard = {
  productId: number;
  name: string;
  imageUrl: string | null;
  cardNumber: string | null;
  rarityCode: string | null;
};

/** What the owner fills in for one picked card before it is added. */
export type CardDraft = {
  variantId: number | null;
  condition: CardCondition;
  quantity: number;
};

export const MAX_QUANTITY = 9999;

export const DEFAULT_DRAFT: CardDraft = { variantId: null, condition: "NM", quantity: 1 };

export function pickedOf(product: ProductSummaryDto): PickedCard {
  return {
    productId: product.id,
    name: product.name,
    imageUrl: product.primaryImageUrl,
    cardNumber: product.cardNumber,
    rarityCode: product.rarityCode,
  };
}

/** "161/131 · SIR" — sealed products have neither part and get an empty line. */
export function metaOf(card: Pick<PickedCard, "cardNumber" | "rarityCode">): string {
  return [card.cardNumber, card.rarityCode].filter(Boolean).join(" · ");
}

/** "EN / FOIL / UNLIMITED" — the same wording the API puts on a collection card (`CatalogVariant.label()`). */
export function variantLabelOf(variant: CollectionVariant): string {
  return [
    variant.languageCode,
    variant.finish === "NOT_APPLICABLE" ? null : variant.finish,
    variant.edition === "NOT_APPLICABLE" ? null : variant.edition,
    variant.printingNote?.trim() || null,
  ].filter(Boolean).join(" / ");
}

/** The quantity box accepts anything while typing; this is what gets sent. */
export function clampQuantity(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.min(MAX_QUANTITY, Math.max(1, Math.trunc(value)));
}

/**
 * The printings to choose from: the ones still in the catalogue, plus `keepId` — the
 * printing a card already has, which stays selectable after it is retired.
 */
export function offeredVariants(variants: CollectionVariant[] | undefined, keepId?: number): CollectionVariant[] {
  return (variants ?? []).filter((variant) => variant.active || variant.id === keepId);
}

/**
 * The printing a card will be saved as: the owner's choice while it is still on
 * offer, otherwise the only printing there is. `null` means they still have to choose.
 */
export function resolveVariantId(
  draft: CardDraft,
  variants: CollectionVariant[] | undefined,
  keepId?: number,
): number | null {
  const offered = offeredVariants(variants, keepId);
  if (draft.variantId !== null && offered.some((variant) => variant.id === draft.variantId)) {
    return draft.variantId;
  }
  return offered.length === 1 ? offered[0].id : null;
}

export function toPayload(
  variantId: number,
  draft: CardDraft,
  imageKey: string | null,
  publicItem: boolean,
): CollectionPayload {
  return {
    catalogVariantId: variantId,
    imageKey,
    publicItem,
    condition: draft.condition,
    quantity: clampQuantity(draft.quantity),
  };
}
