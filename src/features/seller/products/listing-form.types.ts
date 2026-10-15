import type { PageResponse } from "@/lib/api";

/**
 * หน้าลงขาย / แก้ประกาศ — ลอกมาจาก `pegasus-tcg-api` ถ้าฝั่งนั้นแก้ ไฟล์นี้ต้องแก้ตาม
 * - แคตตาล็อก (public): `dto/ProductSummaryResponse.java`, `ProductDetailResponse.java`,
 *   `VariantLookupResponse.java`, `model/CatalogVariant.java`
 * - ตลาด (public): `dto/PublicListingResponse.java`
 * - สิ่งที่เราส่งไป: `dto/ListingRequest.java`, `NewUnitsRequest.java`, `ListingDetailsRequest.java`
 *
 * ประกาศของเราเอง (`SellerListing`) กับ enum สภาพ/โหมดราคา อยู่ใน `products.types.ts`
 */

import type {
  CardCondition,
  ListingCard,
  PricingMode,
} from "./products.types";

/** `model/ProductType.java` */
export type CatalogProductType =
  | "SINGLE_CARD"
  | "BOOSTER_PACK"
  | "BOOSTER_BOX"
  | "ELITE_TRAINER_BOX"
  | "STARTER_DECK"
  | "BUNDLE"
  | "ACCESSORY"
  | "OTHER";

/** `model/CardFinish.java` */
export type CardFinish =
  | "NORMAL"
  | "HOLO"
  | "REVERSE_HOLO"
  | "FOIL"
  | "ETCHED"
  | "TEXTURED"
  | "NOT_APPLICABLE";

/** `model/CardEdition.java` */
export type CardEdition =
  | "FIRST_EDITION"
  | "UNLIMITED"
  | "PROMO"
  | "NOT_APPLICABLE";

/** หนึ่งการ์ดในผลค้นแคตตาล็อก — `GET /catalog/products?q=` (เฉพาะที่เปิดใช้งาน) */
export type CatalogSearchItem = {
  id: number;
  slug: string;
  name: string;
  nameLocal: string | null;
  gameId: number;
  cardSetId: number | null;
  productType: CatalogProductType;
  cardNumber: string | null;
  rarityCode: string | null;
  /** presigned GET อายุสั้น — `null` เมื่อยังไม่มีรูป */
  primaryImageUrl: string | null;
  variantCount: number;
  /** ราคาถูกสุดที่มีคนขายตอนนี้ — `null` = ยังไม่มีใครขาย */
  lowestPrice: number | null;
  listingCount: number;
};

/** `model/CatalogVariant.java` — พิมพ์หนึ่งแบบของการ์ด ประกาศชี้มาที่นี่ */
export type CatalogVariant = {
  id: number;
  catalogProductId: number;
  sku: string;
  languageCode: string;
  finish: CardFinish;
  edition: CardEdition;
  printingNote: string | null;
  barcode: string | null;
  imageUrl: string | null;
  active: boolean;
  createdAt: string;
};

/** `GET /catalog/products/{id}` — ตัวการ์ด พิมพ์ทุกแบบที่เปิดใช้งาน และรูปทางการ */
export type CatalogProductDetail = {
  product: {
    id: number;
    gameId: number;
    cardSetId: number | null;
    productType: CatalogProductType;
    name: string;
    nameLocal: string | null;
    slug: string;
    cardNumber: string | null;
    rarityCode: string | null;
  };
  variants: CatalogVariant[];
  images: {
    id: number;
    catalogVariantId: number | null;
    url: string;
    altText: string | null;
    primary: boolean;
  }[];
};

/** `GET /catalog/variants/by-code/{code}` — SKU หรือบาร์โค้ดที่สแกนมา */
export type VariantLookup = {
  variant: CatalogVariant;
  productId: number;
  productName: string;
  productSlug: string;
  /** "EN / FOIL / FIRST_EDITION" แบบเดียวกับ `ListingCard.variantLabel` */
  variantLabel: string;
};

/**
 * การ์ดที่ผู้ขายเลือกแล้ว — พอจะวาดสรุปและการ์ดตัวอย่างได้โดยไม่ต้องถามแคตตาล็อกอีก
 * ได้มาจากการเลือกในขั้นแรก หรือจาก `SellerListing.card` ตอนแก้ไข
 */
export type SelectedCard = Pick<
  ListingCard,
  "variantId" | "sku" | "variantLabel" | "productId" | "productName"
> & {
  imageUrl: string | null;
  /** ชิปใต้ชื่อ เช่น เลขการ์ด / ความหายาก */
  tags: string[];
  /** ไม่รู้ = `null` (มาจากประกาศเดิม ซึ่งไม่ได้บอกชนิดสินค้า) */
  productType: CatalogProductType | null;
};

/** ประกาศของคนอื่นในตลาด — ใช้เฉพาะราคา (`GET /listings`) */
export type MarketListing = {
  id: number;
  price: number;
  quantityAvailable: number;
  condition: CardCondition;
};

/**
 * ราคาในตลาดของการ์ดพิมพ์นี้ในสภาพนี้ ตอนนี้ — ชุดเดียวกับที่งานราคาอัตโนมัติตอนตี 3
 * ใช้คิดค่ากลาง (ประกาศ ACTIVE ของร้านที่เปิดอยู่) `null` = ยังไม่มีใครขาย
 */
export type MarketSnapshot = {
  listingCount: number;
  low: number;
  median: number;
  high: number;
};

/** body ของ `POST /sellers/me/listings` — ตรงกับ `ListingRequest.java` ได้ประกาศ DRAFT ที่ยังไม่มีการ์ด */
export type CreateListingPayload = {
  catalogVariantId: number;
  condition: CardCondition;
  gradingCompany: string | null;
  gradeValue: number | null;
  /** AUTO_MEDIAN ก็ต้องมี — เป็นราคาจนกว่างานกลางคืนจะขยับครั้งแรก */
  price: number;
  pricingMode: PricingMode;
  autoPriceOffsetPercent: number | null;
  autoPriceFloor: number | null;
  autoPriceCeiling: number | null;
  lotLabel: string | null;
  publicNote: string | null;
  /** object key จาก `LISTING_IMAGE` ตัวแรกเป็นรูปหลัก สูงสุด 10 */
  imageKeys: string[];
};

/** body ของ `POST /sellers/me/listings/{id}/units` — ตรงกับ `NewUnitsRequest.java` */
export type NewUnitsPayload = {
  /** 1–100 ต่อครั้ง */
  quantity: number;
  /** ต้นทุนต่อใบ ผู้ซื้อไม่เห็น ใช้คิดกำไร — ทศนิยมไม่เกิน 2 ตำแหน่ง */
  unitCost: number;
  /** ISO-8601 พร้อม offset ห้ามเป็นอนาคต · ไม่ส่ง = เวลาที่ backend รับ */
  acquiredAt?: string;
  /** โน้ตของการ์ด ผู้ซื้อไม่เห็น ไม่เกิน 255 ตัวอักษร */
  unitNote?: string | null;
};

/**
 * body ของ `PUT /sellers/me/listings/{id}` — ตรงกับ `ListingDetailsRequest.java`
 * เขียนทับทั้งชุด รูปต้องส่ง key เดิมที่จะเก็บไว้ด้วย การ์ดกับสภาพเปลี่ยนไม่ได้ ราคามี endpoint ของตัวเอง
 */
export type ListingDetailsPayload = {
  gradingCompany: string | null;
  gradeValue: number | null;
  lotLabel: string | null;
  publicNote: string | null;
  imageKeys: string[];
};

/**
 * `GET /sellers/me/inventory/stock-ins` — `dto/StockInHistoryResponse.java`
 * ประวัติรับเข้าของการ์ดพิมพ์นี้ในสภาพนี้ของร้าน (ต้นทุนเฉลี่ยคิดรวมทุกประกาศ จึงไม่ได้กรองตามประกาศ)
 */
export type StockInHistory = {
  /** การ์ดที่รับเข้าทั้งหมดทุกหน้า */
  receivedTotal: number;
  /** ส่งออกไปกับพัสดุแล้ว หักใบที่ถูกคืนกลับมา */
  soldTotal: number;
  lots: PageResponse<StockInLot>;
};

/** หนึ่งครั้งที่รับเข้า — backend รวมแถวรายใบของล็อตเดียวกันให้แล้ว */
export type StockInLot = {
  id: number;
  movementType: "INITIAL_STOCK" | "RESTOCK";
  /** วันที่ผู้ขายกรอกตอนรับเข้า (ISO-8601 พร้อม offset) */
  receivedAt: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  /** `null` = ล็อตที่บันทึกก่อนระบบเก็บค่านี้ */
  averageCostAfter: number | null;
  /** แหล่งที่มา · เลขอ้างอิง · โน้ต ที่ส่งไปเป็น `unitNote` */
  note: string | null;
  listingId: number | null;
};
