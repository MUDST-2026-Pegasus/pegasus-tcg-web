// สิ่งที่ backend ส่งมาสำหรับ catalogue — ลอกจาก dto/*.java ถ้าฝั่งนั้นแก้ ต้องแก้ตาม
// หน้าแรกกับหน้าค้นหาใช้ร่วมกัน

export type ProductType =
  | "SINGLE_CARD"
  | "BOOSTER_PACK"
  | "BOOSTER_BOX"
  | "ELITE_TRAINER_BOX"
  | "STARTER_DECK"
  | "BUNDLE"
  | "ACCESSORY"
  | "OTHER";

export type CardCondition = "NM" | "LP" | "MP" | "HP" | "DMG" | "SEALED";

/** `Game` — `GET /games`; `logoUrl` เป็น URL ที่เปิดได้เลย (backend เซ็นให้แล้ว) */
export type GameDto = {
  id: number;
  code: string;
  name: string;
  nameLocal: string | null;
  slug: string;
  logoUrl: string | null;
  displayOrder: number;
};

/** `CardSet` — `GET /card-sets?gameId=` ใหม่สุดก่อน */
export type CardSetDto = {
  id: number;
  gameId: number;
  code: string;
  name: string;
  nameLocal: string | null;
};

/** `CategoryResponse` — `GET /categories` */
export type CategoryDto = {
  id: number;
  gameId: number | null;
  parentId: number | null;
  code: string;
  name: string;
  slug: string;
  displayOrder: number;
  imageUrl: string | null;
};

/** `ProductSummaryResponse` — `GET /catalog/products` */
export type ProductSummaryDto = {
  id: number;
  slug: string;
  name: string;
  nameLocal: string | null;
  gameId: number;
  categoryId: number;
  cardSetId: number | null;
  productType: ProductType;
  cardNumber: string | null;
  rarityCode: string | null;
  primaryImageUrl: string | null;
  variantCount: number;
  /** ราคาถูกสุดที่มีขายตอนนี้ (บาท) ในสภาพที่กรองไว้; null = ไม่มีใครขาย */
  lowestPrice: number | null;
  listingCount: number;
};

/** `ProductDetailResponse` — one product, its printings, and signed image URLs. */
export type ProductDetailDto = {
  product: {
    id: number;
    gameId: number;
    categoryId: number;
    cardSetId: number | null;
    productType: ProductType;
    name: string;
    nameLocal: string | null;
    slug: string;
    cardNumber: string | null;
    rarityCode: string | null;
    description: string | null;
    attributes: Record<string, unknown>;
    active: boolean;
  };
  variants: CatalogVariantDto[];
  images: CatalogImageDto[];
};

export type CatalogCardEffectDto = {
  effectType: "ABILITY" | "ATTACK" | "RULE";
  name: string;
  effectText: string | null;
  damage: number | null;
  energyCost: string[];
  displayOrder: number;
  sourceUrl: string | null;
};

export type CatalogVariantDto = {
  id: number;
  catalogProductId: number;
  sku: string;
  languageCode: string;
  finish: string;
  edition: string;
  printingNote: string | null;
  imageUrl: string | null;
  active: boolean;
};

export type CatalogImageDto = {
  id: number;
  catalogVariantId: number | null;
  imageKey: string;
  url: string;
  altText: string | null;
  sortOrder: number;
  primary: boolean;
};

/** `PublicListingResponse` — common to product detail and the home storefront. */
export type PublicListingDto = {
  id: number;
  card: {
    variantId: number;
    sku: string;
    variantLabel: string;
    productId: number;
    productName: string;
    productSlug: string;
    gameId: number;
    officialImageUrl: string | null;
  };
  condition: CardCondition;
  price: number;
  currency: string;
  quantityAvailable: number;
  primaryPhotoUrl: string | null;
  seller: {
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
};

export type PublicListingDetailDto = {
  listing: PublicListingDto & {
    publicNote: string | null;
    gradingCompany: string | null;
    gradeValue: number | null;
  };
  photoUrls: string[];
};

/** A collector who has made at least one copy of this product public. */
export type ProductCollectorDto = {
  username: string;
  displayName: string;
  avatarUrl: string | null;
  quantity: number;
};

export type ProductSort =
  | "name"
  | "newest"
  | "cardNumber"
  | "price_asc"
  | "price_desc"
  | "popular";

/** query ของ `GET /catalog/products` — array ส่งเป็นพารามิเตอร์ซ้ำ เช่น `gameId=1&gameId=5` */
export type ProductQuery = {
  q?: string;
  gameId?: number[];
  categoryId?: number;
  cardSetId?: number;
  condition?: CardCondition[];
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sort?: ProductSort;
  page?: number;
  size?: number;
};
