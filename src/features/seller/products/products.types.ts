/**
 * ลอกมาจาก `dto/SellerListingSummaryResponse.java`, `dto/SellerListingResponse.java`,
 * `dto/ListingCard.java`, `dto/ListingPriceRequest.java` และ enum ใน `model/`
 * ของ `pegasus-tcg-api` ถ้าฝั่งนั้นแก้ ไฟล์นี้ต้องแก้ตาม
 */

/**
 * `model/ListingStatus.java` — SOLD_OUT กับ BLOCKED ไม่มีใครขอได้ มันเกิดเอง
 * (ฐานข้อมูลเปลี่ยน ACTIVE ↔ SOLD_OUT ตามจำนวนการ์ด ส่วน BLOCKED มาจากแอดมิน)
 */
export type ListingStatus =
  | "DRAFT"
  | "ACTIVE"
  | "PAUSED"
  | "SOLD_OUT"
  | "DELISTED"
  | "BLOCKED";

/** `model/CardCondition.java` */
export type CardCondition = "NM" | "LP" | "MP" | "HP" | "DMG" | "SEALED";

/**
 * `model/PricingMode.java` — AUTO_MEDIAN ให้งานกลางคืนตั้งราคาตามค่ากลางตลาด
 * ภายใต้ offset / floor / ceiling ของผู้ขาย [RQ-5]
 */
export type PricingMode = "MANUAL" | "AUTO_MEDIAN";

/** `dto/ListingCard.java` — การ์ดใบไหน ละเอียดพอจะวาดได้โดยไม่ต้องถามแคตตาล็อกอีก */
export type ListingCard = {
  variantId: number;
  sku: string;
  variantLabel: string;
  /** false = แอดมินเลิกขายพิมพ์นี้แล้ว ของเดิมอยู่ได้ แต่เปิดขายใหม่ไม่ได้ (`VARIANT_INACTIVE`) */
  variantActive: boolean;
  productId: number;
  productName: string;
  productSlug: string;
  gameId: number;
  /** รูปทางการจากแคตตาล็อก เป็น presigned URL อายุสั้น — `null` เมื่อยังไม่มีรูป */
  officialImageUrl: string | null;
};

/** หนึ่งแถวในตารางสินค้า — `dto/SellerListingSummaryResponse.java` */
export type SellerListingSummary = {
  id: number;
  card: ListingCard;
  condition: CardCondition;
  /** `BigDecimal` ฝั่ง Java มาเป็นตัวเลขใน JSON */
  price: number;
  currency: string;
  pricingMode: PricingMode;
  /** การ์ดทั้งหมดบนประกาศ = พร้อมขาย + ติดจอง */
  quantityTotal: number;
  /** ถูกคำสั่งซื้อที่ยังไม่ปิดถือไว้ — ลบประกาศไม่ได้จนกว่าจะเป็น 0 */
  quantityReserved: number;
  /** ผู้ซื้อกดซื้อได้ตอนนี้ — เป็น 0 เมื่อไหร่ ประกาศ ACTIVE กลายเป็น SOLD_OUT เอง */
  quantityAvailable: number;
  status: ListingStatus;
  lotLabel: string | null;
  /** รูปแรกของประกาศ เป็น presigned URL อายุสั้น ห้ามเก็บไว้ใช้ภายหลัง */
  primaryPhotoUrl: string | null;
  updatedAt: string;
};

/** `dto/ListingPhotoResponse.java` */
export type ListingPhoto = {
  imageKey: string;
  url: string;
  primary: boolean;
};

/** `dto/SimilarListingResponse.java` — ประกาศอื่นของเราที่ขายการ์ดใบเดียวกันสภาพเดียวกัน */
export type SimilarListing = {
  id: number;
  lotLabel: string | null;
  price: number;
  pricingMode: PricingMode;
  status: ListingStatus;
  quantityAvailable: number;
  samePrice: boolean;
  followsSameMarket: boolean;
};

/** ประกาศเต็มก้อน — `dto/SellerListingResponse.java` ได้จาก GET ทีละใบและทุก PATCH */
export type SellerListing = Omit<SellerListingSummary, "primaryPhotoUrl"> & {
  gradingCompany: string | null;
  gradeValue: number | null;
  autoPriceOffsetPercent: number | null;
  autoPriceFloor: number | null;
  autoPriceCeiling: number | null;
  lastAutoPricedAt: string | null;
  publicNote: string | null;
  version: number;
  publishedAt: string | null;
  createdAt: string;
  photos: ListingPhoto[];
  similarListings: SimilarListing[];
};

/** query ของ `GET /sellers/me/listings` — backend ยังไม่รับคำค้นหรือการเรียง (เรียงแก้ไขล่าสุดก่อนเสมอ) */
export type ListingQuery = {
  /** ไม่ใส่ = ทุกสถานะ */
  status?: ListingStatus;
  /** เริ่มที่ 0 */
  page: number;
  size: number;
};

/**
 * `dto/ListingPriceRequest.java` — ราคาเดียวใช้กับการ์ดทุกใบบนประกาศ
 * MANUAL ต้องมี `price` · AUTO_MEDIAN ไม่ส่ง `price` = คงราคาเดิมไว้จนงานกลางคืนขยับ
 * ฟิลด์ auto ที่ไม่ส่งจะถูกล้างเป็น null (เขียนทับทั้งชุด ไม่ใช่ patch)
 */
export type ListingPricePayload = {
  pricingMode: PricingMode;
  price?: number;
  autoPriceOffsetPercent?: number;
  autoPriceFloor?: number;
  autoPriceCeiling?: number;
};
