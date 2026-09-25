import { getProductCreateData } from "./product-create.api";
import type { CardCondition as FormCondition } from "./product-create.types";
import type { ProductEditData } from "./product-edit.types";
import type { CardCondition, SellerListing } from "./products.types";

/**
 * ฟอร์มจำลองของหน้าลงขายยังมีแค่ 4 สภาพที่ไม่ตรงกับ enum จริง — แม็ปเท่าที่ตรงกัน
 * ที่เหลือ (MP / HP / SEALED) ปล่อยว่างให้ผู้ขายเลือกเอง จนกว่า SLR-03 จะเปลี่ยนฟอร์มเป็นค่าจริง
 */
const FORM_CONDITION: Partial<Record<CardCondition, FormCondition>> = {
  NM: "near_mint",
  LP: "lightly_played",
  DMG: "damaged",
};

/**
 * ประกอบหน้าแก้ไขสินค้าจากประกาศจริง (`GET /sellers/me/listings/{id}`) กับข้อความของหน้าลงขาย
 * ปุ่มบันทึกยังไม่ยิงจริง — ต่อ `PUT /sellers/me/listings/{id}` ใน SLR-03
 * ต้นทุนเฉลี่ยยังไม่มีที่มาจนกว่า SLR-04 จะต่อ unit/คลัง จึงปล่อยว่าง
 */
export function getProductEditData(listing: SellerListing): ProductEditData {
  const create = getProductCreateData();

  return {
    productId: String(listing.id),
    breadcrumb: {
      rootLabel: "จัดการสินค้า",
      productLabel: listing.card.productName,
      currentLabel: "แก้ไขสินค้า",
    },
    title: "แก้ไขสินค้า",
    subtitle:
      "แก้ไขสภาพ ราคา และรายละเอียดของประกาศ — ต้นทุนและจำนวนเปลี่ยนผ่านการเติมสต็อก",
    actions: {
      cancelLabel: "ยกเลิก",
      saveLabel: "บันทึกการเปลี่ยนแปลง",
    },

    catalogCard: {
      title: "การ์ดในประกาศนี้",
      name: listing.card.productName,
      tags: [
        listing.card.variantLabel,
        ...(listing.lotLabel ? [listing.lotLabel] : []),
      ],
    },
    condition: create.condition,
    pricing: {
      ...create.pricing,
      description: "ต้นทุนและจำนวนมาจากประวัติการรับเข้า ผู้ซื้อไม่เห็นต้นทุน",
      costLabel: "ต้นทุนเฉลี่ยต่อใบ (บาท)",
      // ยังไม่มีข้อมูลราคาตลาดของการ์ดใบนี้จาก backend — ไม่โชว์ตัวเลขตลาดปลอม
      market: undefined,
    },
    stockLock: {
      costHelper: "คำนวณจากประวัติการรับเข้าอัตโนมัติ",
      quantityHelper: "เพิ่มจำนวนได้ที่หน้า",
      restockLabel: "เติมสต็อก",
    },
    details: create.details,
    preview: create.preview,
    tip: create.tip,

    initialDraft: {
      condition: FORM_CONDITION[listing.condition] ?? null,
      price: String(listing.price),
      cost: "",
      quantity: String(listing.quantityAvailable),
      description: listing.publicNote ?? "",
      options: { accept_offers: false, allow_trade: false },
    },
  };
}
