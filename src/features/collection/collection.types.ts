export type CollectionCard = {
  variantId: number;
  variantLabel: string;
  productId: number;
  productName: string;
  productSlug: string;
  officialImageUrl: string | null;
};

export type CollectionItem = {
  id: number;
  card: CollectionCard;
  imageKey: string | null;
  photoUrl: string | null;
  publicItem: boolean;
  condition: string;
  quantity: number;
  gradingCompany: string | null;
  gradeValue: number | null;
  certNumber: string | null;
  acquiredPrice: number | null;
  acquiredAt: string | null;
  personalNote: string | null;
};

export type PublicCollectionItem = Pick<CollectionItem, "id" | "card" | "photoUrl" | "condition" | "quantity">;

/** `CatalogVariant` — `finish` and `edition` are `NOT_APPLICABLE` where a product has neither. */
export type CollectionVariant = {
  id: number;
  sku: string;
  languageCode: string;
  finish: string;
  edition: string;
  printingNote: string | null;
  active: boolean;
};

export type CollectionPayload = {
  catalogVariantId: number;
  imageKey: string | null;
  publicItem: boolean;
  condition?: string;
  quantity?: number;
  gradingCompany?: string | null;
  gradeValue?: number | null;
  certNumber?: string | null;
  acquiredPrice?: number | null;
  acquiredAt?: string | null;
  personalNote?: string | null;
};
