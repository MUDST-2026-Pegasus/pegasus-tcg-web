/**
 * ลอกมาจาก `pegasus-tcg-api` ถ้าฝั่งนั้นแก้ ไฟล์นี้ต้องแก้ตาม
 * - สิ่งที่ backend ส่งกลับ: `model/Game.java`, `GameAttribute.java`, `CardSet.java`,
 *   `CatalogCategory.java`, `CatalogProduct.java`, `CatalogVariant.java`,
 *   `dto/ProductSummaryResponse.java`, `ProductDetailResponse.java`, `CatalogImageResponse.java`
 * - สิ่งที่เราส่งไป: `dto/ProductRequest.java`, `VariantRequest.java`, `CatalogImageRequest.java`
 *
 * enum ซ้ำกับ `features/catalog/catalog.types.ts` บางตัว แต่แยกไว้เป็นของ admin เอง
 * จะได้ไม่ผูกหน้าร้านกับหลังบ้านเข้าด้วยกัน — คนละเจ้าของ คนละวงจร
 */

/** `model/ProductType.java` */
export type ProductType =
  | "SINGLE_CARD"
  | "BOOSTER_PACK"
  | "BOOSTER_BOX"
  | "ELITE_TRAINER_BOX"
  | "STARTER_DECK"
  | "BUNDLE"
  | "ACCESSORY"
  | "OTHER";

/** `model/CardFinish.java` — ส่วนหนึ่งของตัวตน variant */
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

/** `model/AttributeDataType.java` — บอกว่าฟอร์มต้องวาดช่องแบบไหน */
export type AttributeDataType = "STRING" | "NUMBER" | "BOOLEAN" | "ENUM" | "DATE";

/**
 * `Game` — `GET /admin/games` ได้ทั้งเกมที่ปิดไปแล้ว เรียงตาม `displayOrder`
 * `logoUrl` ของ endpoint admin เป็นค่าดิบ (URL ที่วางไว้หรือ object key) ยังไม่ได้เซ็น
 */
export type Game = {
  id: number;
  /** รหัสถาวร เช่น POKEMON — เป็นส่วนหน้าของ SKU ที่ backend สร้างให้ */
  code: string;
  name: string;
  nameLocal: string | null;
  slug: string;
  logoUrl: string | null;
  displayOrder: number;
  active: boolean;
  createdBy: number | null;
  createdAt: string;
};

/**
 * หนึ่งช่องที่การ์ดของเกมนั้นมี (HP ของ Pokémon, mana cost ของ Magic) —
 * `GET /admin/games/{gameId}/attributes` เรียงตาม `displayOrder`
 * ค่าจริงเก็บใน `CatalogProduct.attributes` ใต้คีย์ `attrKey`
 */
export type GameAttribute = {
  id: number;
  gameId: number;
  attrKey: string;
  label: string;
  dataType: AttributeDataType;
  /** มีเฉพาะ `ENUM` — ค่าที่ส่งต้องเป็นหนึ่งในนี้ตรงตัว */
  options: string[];
  filterable: boolean;
  required: boolean;
  displayOrder: number;
};

/** `CardSet` — `GET /card-sets?gameId=` ใหม่สุดก่อน */
export type CardSet = {
  id: number;
  gameId: number;
  code: string;
  name: string;
  nameLocal: string | null;
  /** `yyyy-MM-dd` */
  releaseDate: string | null;
  totalCards: number | null;
  logoUrl: string | null;
};

/** `CatalogCategory` — `GET /admin/categories?gameId=` ได้หมวดข้ามเกม (`gameId: null`) มาด้วย */
export type CatalogCategory = {
  id: number;
  /** `null` = ใช้ได้ทุกเกม เช่น อุปกรณ์เสริม */
  gameId: number | null;
  parentId: number | null;
  code: string;
  name: string;
  slug: string;
  displayOrder: number;
  active: boolean;
  imageKey: string | null;
};

/**
 * `Map<String, Object>` ฝั่ง Java — ชนิดของค่าแต่ละคีย์ขึ้นกับ `GameAttribute.dataType`
 * ของเกมนั้น (NUMBER เป็นตัวเลข, BOOLEAN เป็น true/false, ที่เหลือเป็นข้อความ)
 */
export type ProductAttributes = Record<string, unknown>;

/** หนึ่งการ์ดในผลค้นหา — `GET /admin/catalog/products` (รวมสินค้าที่ปิดใช้งานแล้ว) */
export type ProductSummary = {
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
  attributes: ProductAttributes;
  /** presigned GET อายุสั้น — `null` เมื่อยังไม่มีรูป ห้ามเก็บหรือส่งต่อ */
  primaryImageUrl: string | null;
  /** นับเฉพาะ variant ที่เปิดใช้งาน */
  variantCount: number;
  /** ราคาถูกสุดที่มีคนขายตอนนี้ (บาท) — `null` = ยังไม่มีใครขาย */
  lowestPrice: number | null;
  listingCount: number;
};

/** `model/CatalogProduct.java` — ผลของ POST/PUT และ `product` ใน `ProductDetail` */
export type CatalogProduct = {
  id: number;
  /** ตายตัวตั้งแต่สร้าง — PUT ไม่สนค่านี้ */
  gameId: number;
  categoryId: number;
  cardSetId: number | null;
  productType: ProductType;
  name: string;
  nameLocal: string | null;
  /** ตายตัวตั้งแต่สร้าง เพราะลิงก์ชี้มาที่นี่ */
  slug: string;
  cardNumber: string | null;
  rarityCode: string | null;
  description: string | null;
  attributes: ProductAttributes;
  active: boolean;
  createdBy: number | null;
  createdAt: string;
  updatedAt: string;
};

/** `model/CatalogVariant.java` — หน่วยที่ซื้อขายจริง ประกาศขายชี้มาที่นี่ */
export type CatalogVariant = {
  id: number;
  catalogProductId: number;
  /** เช่น PKM-SV8A-025-EN-NORMAL */
  sku: string;
  /** EN, JP, TH … ตัวพิมพ์ใหญ่เสมอ */
  languageCode: string;
  finish: CardFinish;
  edition: CardEdition;
  /** ส่วนหนึ่งของตัวตน ไม่ใช่หมายเหตุ — "Alt Art" กับใบปกติคือคนละ variant */
  printingNote: string | null;
  barcode: string | null;
  imageUrl: string | null;
  active: boolean;
  createdAt: string;
};

/** `dto/CatalogImageResponse.java` */
export type CatalogImage = {
  id: number;
  /** `null` = ใช้ร่วมกันทุก variant (กรณีปกติ) */
  catalogVariantId: number | null;
  imageKey: string;
  /** presigned GET อายุสั้น — หมดอายุแล้วต้องดึงสินค้าใหม่ ห้ามเก็บหรือส่งต่อ */
  url: string;
  altText: string | null;
  sortOrder: number;
  primary: boolean;
};

/**
 * `GET /admin/catalog/products/{id}` — รวม variant และรูปที่ปิดใช้งานแล้วด้วย
 * ฟอร์มแก้ไขต้องโหลดจากที่นี่ก่อนเสมอ เพราะ PUT เขียนทับทั้งแถว
 */
export type ProductDetail = {
  product: CatalogProduct;
  variants: CatalogVariant[];
  images: CatalogImage[];
};

/** ค่าที่ `sort` รับ — `CatalogSearchService.parseSort()` */
export type ProductSort =
  | "name"
  | "newest"
  | "cardNumber"
  | "price_asc"
  | "price_desc"
  | "popular";

/** query ของ `GET /admin/catalog/products` */
export type AdminProductQuery = {
  gameId?: number;
  categoryId?: number;
  /** backend รับชุดเดียวต่อครั้ง */
  cardSetId?: number;
  productType?: ProductType;
  /** ค้นจากชื่อ */
  q?: string;
  sort?: ProductSort;
  /** ค่าเริ่มต้น false = รวมสินค้าที่ปิดใช้งาน */
  activeOnly?: boolean;
  page: number;
  size: number;
};

/** ค่าที่ส่งได้ใน `attributes` ต้องตรงชนิดกับ `GameAttribute.dataType` */
export type AttributeValue = string | number | boolean;

/**
 * body ของ `POST` / `PUT /admin/catalog/products` — ตรงกับ `ProductRequest.java`
 * PUT เขียนทับทั้งแถว ฟิลด์ที่ไม่ส่งจะถูกล้าง (ยกเว้น `gameId` กับ `slug` ที่ backend ไม่สนตอนแก้)
 */
export type ProductPayload = {
  gameId: number;
  categoryId: number;
  cardSetId: number | null;
  productType: ProductType;
  name: string;
  nameLocal: string | null;
  /** `null` = ให้ backend สร้างจากชื่อกับเลขการ์ด */
  slug: string | null;
  cardNumber: string | null;
  rarityCode: string | null;
  description: string | null;
  /** คีย์ที่ไม่มีใน registry ของเกมถูกปฏิเสธ ค่าว่างถูกตัดทิ้ง */
  attributes: Record<string, AttributeValue>;
  active: boolean;
};

/**
 * body ของ `POST` / `PUT .../variants` — ตรงกับ `VariantRequest.java`
 * PUT เขียนทับทั้งแถวเหมือนกัน ยกเว้น `sku` ที่ส่ง `null` = คงของเดิม
 */
export type VariantPayload = {
  /** `null` = ให้ backend สร้างจากเกม ชุด เลขการ์ด ภาษา และ finish */
  sku: string | null;
  languageCode: string;
  finish: CardFinish;
  edition: CardEdition;
  printingNote: string | null;
  barcode: string | null;
  imageUrl: string | null;
  active: boolean;
};

/** body ของ `POST .../images` — ตรงกับ `CatalogImageRequest.java` */
export type ImagePayload = {
  /** object key จาก `useFileUpload({ purpose: "CATALOG_IMAGE" })` */
  imageKey: string;
  /** `null` = ใช้ร่วมกันทุก variant */
  catalogVariantId: number | null;
  altText: string | null;
  /** รูปแรกของสินค้าเป็นรูปหลักเสมอไม่ว่าจะส่งอะไร */
  primary: boolean;
};
