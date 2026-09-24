// ---------- สิ่งที่ UI หน้าแรกใช้วาด ----------

export type HeroAction = {
  label: string;
  href: string;
};

export type HeroSlide = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  theme: "campaign" | "release" | "collector";
  primaryAction?: HeroAction;
  secondaryAction?: HeroAction;
};

export type GameCategory = {
  id: string;
  name: string;
  image?: string;
  imageAlt: string;
  href: string;
};

export type ProductCategory = {
  id: string;
  name: string;
  image: string;
  imageAlt: string;
  href: string;
};

export type HomeProduct = {
  id: string;
  name: string;
  type: string;
  /** null = ตอนนี้ไม่มีใครขาย */
  price: number | null;
  image?: string;
  imageAlt: string;
  href: string;
};

export type TrendingProduct = HomeProduct & {
  rank: number;
};

// ---------- สิ่งที่ backend ส่งมา (ลอกจาก dto/*.java ถ้าฝั่งนั้นแก้ ต้องแก้ตาม) ----------

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

/** `HomeBannerResponse` — `GET /home/banners` */
export type HomeBannerDto = {
  id: number;
  eyebrow: string | null;
  title: string;
  description: string | null;
  imageUrl: string | null;
  imageAlt: string | null;
  theme: "CAMPAIGN" | "RELEASE" | "COLLECTOR";
  primaryLabel: string | null;
  primaryHref: string | null;
  secondaryLabel: string | null;
  secondaryHref: string | null;
};

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
  /** ราคาถูกสุดที่มีขายตอนนี้ (บาท); null = ไม่มีใครขาย */
  lowestPrice: number | null;
  listingCount: number;
};

/** `TrendingProductResponse` — `GET /catalog/trending` */
export type TrendingProductDto = {
  rank: number;
  unitsSold: number;
  product: ProductSummaryDto;
};

/** `PublicListingResponse` — `GET /u/{username}/listings` */
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
    displayName: string;
    avatarUrl: string | null;
  };
};

export type ProductQuery = {
  sort?: "name" | "newest" | "cardNumber";
  inStock?: boolean;
  gameId?: number;
  categoryId?: number;
  page?: number;
  size?: number;
};
