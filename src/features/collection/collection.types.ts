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

export type CollectionVariant = { id: number; sku: string; languageCode: string; active: boolean };

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
