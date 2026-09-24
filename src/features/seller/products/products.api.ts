import { api, type PageResponse } from "@/lib/api";

import type {
  ListingPricePayload,
  ListingQuery,
  ListingStatus,
  ProductsData,
  SellerListing,
  SellerListingSummary,
} from "./products.types";

/**
 * `/sellers/me/listings` — ประกาศขายของผู้ขายที่ login อยู่ (`SellerListingController.java`)
 * อ่านได้เมื่อมี seller profile ส่วนการเขียนทุกแบบต้อง VERIFIED ไม่งั้นได้ `SELLER_NOT_VERIFIED`
 *
 * ไฟล์นี้ไม่มี React — component เรียกผ่าน hook ใน `products.queries.ts`
 */

/** แก้ไขล่าสุดก่อนเสมอ — backend ยังไม่รับ `sort` หรือคำค้น */
export function getMyListings(
  query: ListingQuery,
): Promise<PageResponse<SellerListingSummary>> {
  return api.get<PageResponse<SellerListingSummary>>("/sellers/me/listings", {
    query: { status: query.status, page: query.page, size: query.size },
  });
}

export function getMyListing(id: number): Promise<SellerListing> {
  return api.get<SellerListing>(`/sellers/me/listings/${id}`);
}

/** ประกาศที่ปิดแล้ว (DELISTED / BLOCKED) เปลี่ยนราคาไม่ได้ — `LISTING_CLOSED` */
export function changeListingPrice(
  id: number,
  payload: ListingPricePayload,
): Promise<SellerListing> {
  return api.patch<SellerListing>(`/sellers/me/listings/${id}/price`, payload);
}

/**
 * ผู้ขายขอได้แค่ ACTIVE (เปิดขาย/ขายต่อ), PAUSED (พักไว้) และ DELISTED (ปิดถาวร)
 * ย้ายไม่ได้ตามกติกาได้ `LISTING_STATUS_TRANSITION` · ร่างที่ไม่มีการ์ดได้ `LISTING_HAS_NO_STOCK`
 */
export function changeListingStatus(
  id: number,
  status: ListingStatus,
): Promise<SellerListing> {
  return api.patch<SellerListing>(`/sellers/me/listings/${id}/status`, {
    status,
  });
}

/** ปฏิเสธถ้ายังมีการ์ดติดจอง (`LISTING_HAS_RESERVATIONS`) · การ์ดที่วางขายอยู่กลับเข้าคลัง */
export function deleteListing(id: number): Promise<void> {
  return api.delete<void>(`/sellers/me/listings/${id}`);
}

/**
 * ข้อมูลตัวอย่างของหน้า "จัดการสินค้า" — ลอกข้อความและตัวเลขจาก
 * Figma node 432:7271 เพื่อให้เทียบหน้าจอกับดีไซน์ได้ตรง ๆ
 *
 * หมายเหตุ: ในดีไซน์แถวตัวอย่างเป็น "Charizard ex" ซ้ำกัน 5 แถว
 * ที่นี่ใส่ชื่อสินค้าจริงจากชุดเดียวกับหน้าแดชบอร์ดแทน และให้ครบทุกสถานะ
 * เพื่อให้กดชิปตัวกรองแล้วเห็นผลจริงทุกอัน
 */
const PRODUCTS_MOCK: ProductsData = {
  title: "จัดการสินค้า",
  subtitle: "สินค้าทั้งหมด 142 รายการ · พร้อมขาย 133 · หมดสต็อก 6 · ฉบับร่าง 3",

  actions: {
    importLabel: "นำเข้า CSV",
    createLabel: "+ ลงขายสินค้าใหม่",
  },

  filters: [
    { id: "all", label: "ทั้งหมด", count: 142 },
    { id: "active", label: "พร้อมขาย", count: 133 },
    { id: "low_stock", label: "สต็อกน้อย", count: 6 },
    { id: "out_of_stock", label: "หมดสต็อก", count: 6 },
    { id: "draft", label: "ฉบับร่าง", count: 3 },
  ],

  toolbar: {
    searchPlaceholder: "ค้นหาสินค้า...",
    sortPlaceholder: "เรียง: ขายดี",
    sortOptions: [
      { value: "best-selling", label: "เรียง: ขายดี" },
      { value: "newest", label: "เรียง: ใหม่ล่าสุด" },
      { value: "price-desc", label: "เรียง: ราคาสูง-ต่ำ" },
      { value: "price-asc", label: "เรียง: ราคาต่ำ-สูง" },
      { value: "stock-asc", label: "เรียง: สต็อกน้อยก่อน" },
    ],
  },

  bulkActions: [
    { id: "edit-price", label: "แก้ไขราคาพร้อมกัน" },
    { id: "restock", label: "เติมสต็อก" },
    { id: "unpublish", label: "ปิดการขาย" },
  ],

  table: {
    columns: {
      product: "สินค้า",
      price: "ราคาขาย",
      cost: "ต้นทุนเฉลี่ย",
      stock: "สต็อก",
      sold: "ขายแล้ว",
      status: "สถานะ",
      actions: "ตัวเลือกเพิ่มเติม",
    },
    stockUnit: "ใบ",
    selectAllLabel: "เลือกสินค้าทั้งหมดในหน้านี้",
    selectRowLabel: "เลือกสินค้า",
    editLabel: "แก้ไขสินค้า",
    moreLabel: "ตัวเลือกเพิ่มเติม",
    restockLabel: "เติมสต็อก",
    deleteLabel: "ลบสินค้า",
  },

  deleteDialog: {
    title: "ลบสินค้านี้ออกจากร้าน?",
    description: "การลบไม่สามารถย้อนกลับได้ ผู้ซื้อจะไม่เห็นประกาศนี้อีก",
    remainingLabel: "เหลือ",
    soldLabel: "ขายไปแล้ว",
    warning:
      'ประวัติการขายและกำไรของสินค้านี้จะยังอยู่ในรายงาน แต่จะลบออกจากหน้าร้านทันที แนะนำให้ "ปิดการขาย" แทนถ้าจะกลับมาขายอีก',
    unpublishLabel: "ปิดการขายแทน",
    confirmLabel: "ลบถาวร",
  },

  rows: [
    {
      id: "charizard-ex",
      name: "Charizard ex — Obsidian Flames",
      meta: "Pokémon · Near Mint",
      price: "฿1,290",
      cost: "฿980",
      stock: 12,
      sold: 48,
      status: "active",
      statusLabel: "พร้อมขาย",
    },
    {
      id: "pikachu-vmax",
      name: "Pikachu VMAX — Rainbow Rare",
      meta: "Pokémon · Near Mint",
      price: "฿2,450",
      cost: "฿1,890",
      stock: 8,
      sold: 31,
      status: "active",
      statusLabel: "พร้อมขาย",
    },
    {
      id: "rookie-serial-99",
      name: "2024 Rookie Serial /99",
      meta: "Sports Cards · Graded 9",
      price: "฿3,200",
      cost: "฿2,400",
      stock: 1,
      sold: 4,
      status: "low_stock",
      statusLabel: "สต็อกน้อย",
    },
    {
      id: "mewtwo-v-alt-art",
      name: "Mewtwo V — Alt Art",
      meta: "Pokémon · Near Mint",
      price: "฿980",
      cost: "฿720",
      stock: 0,
      sold: 67,
      status: "out_of_stock",
      statusLabel: "หมดสต็อก",
    },
    {
      id: "luffy-gear-5",
      name: "Luffy Gear 5 — Leader Parallel",
      meta: "One Piece · Near Mint",
      price: "฿1,650",
      cost: "฿1,180",
      stock: 3,
      sold: 22,
      status: "low_stock",
      statusLabel: "สต็อกน้อย",
    },
    {
      id: "gengar-vmax",
      name: "Gengar VMAX — Full Art",
      meta: "Pokémon · Lightly Played",
      price: "฿1,120",
      cost: "฿860",
      stock: 9,
      sold: 18,
      status: "active",
      statusLabel: "พร้อมขาย",
    },
    {
      id: "paldea-box",
      name: "Paldea Evolved Booster Box",
      meta: "Pokémon · Sealed",
      price: "฿4,890",
      cost: "฿4,150",
      stock: 5,
      sold: 12,
      status: "active",
      statusLabel: "พร้อมขาย",
    },
    {
      id: "sv-pack",
      name: "Scarlet & Violet Booster Pack",
      meta: "Pokémon · Sealed",
      price: "฿180",
      cost: "฿140",
      stock: 0,
      sold: 0,
      status: "draft",
      statusLabel: "ฉบับร่าง",
    },
  ],

  pagination: {
    previousLabel: "ก่อนหน้า",
    nextLabel: "ถัดไป",
    pages: [1, 2, 3],
    currentPage: 1,
  },
};

/**
 * จุดต่อข้อมูลของหน้าจัดการสินค้า — ตอนนี้คืนข้อมูลจำลอง
 * วันที่ต่อ API จริงให้แก้เฉพาะข้างในฟังก์ชันนี้ component ทุกตัวไม่ต้องแตะ
 */
export function getProductsData(): ProductsData {
  return PRODUCTS_MOCK;
}
