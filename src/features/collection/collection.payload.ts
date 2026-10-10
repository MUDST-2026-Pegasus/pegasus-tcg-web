import type { CollectionItem, CollectionPayload } from "./collection.types";

/** PUT replaces the whole row; keep private fields when editing or toggling visibility. */
export function payloadOf(item: CollectionItem, changes: Partial<CollectionPayload> = {}): CollectionPayload {
  return {
    catalogVariantId: item.card.variantId,
    imageKey: item.imageKey,
    publicItem: item.publicItem,
    condition: item.condition,
    quantity: item.quantity,
    gradingCompany: item.gradingCompany,
    gradeValue: item.gradeValue,
    certNumber: item.certNumber,
    acquiredPrice: item.acquiredPrice,
    acquiredAt: item.acquiredAt,
    personalNote: item.personalNote,
    ...changes,
  };
}
