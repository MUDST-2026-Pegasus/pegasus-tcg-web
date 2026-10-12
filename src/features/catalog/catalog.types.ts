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
  condition?: CardCondition[];
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sort?: ProductSort;
  page?: number;
  size?: number;
};
