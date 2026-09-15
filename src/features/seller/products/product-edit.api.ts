import { getProductCreateData } from "./product-create.api";
import type { ListingDraft } from "./product-create.types";
import type { ProductEditData } from "./product-edit.types";
import { getProductsData } from "./products.api";
import { parseBaht } from "./products.format";

type ProductEditSeed = {
  tags: string[];
  description: string;
  options: ListingDraft["options"];
  /** มีเฉพาะสินค้าที่มีข้อมูลราคาตลาดในดีไซน์ */
  hasMarketData: boolean;
};

/** ข้อมูลที่หน้ารายการไม่มี — ของ Charizard ex ใช้ชุดเดียวกับตัวอย่างหน้าลงขาย */
const PRODUCT_EDIT_SEEDS: Record<string, ProductEditSeed> = {
  "charizard-ex": {
    tags: ["Pokémon", "125/197", "Double Rare", "EN"],
    description: "เก็บใน Top Loader ตั้งแต่แกะซอง ไม่เคยเล่น",
    options: { accept_offers: true, allow_trade: false },
    hasMarketData: true,
  },
};

/**
 * จุดต่อข้อมูลของหน้าแก้ไขสินค้า — ตอนนี้ประกอบจากข้อมูลจำลองของหน้ารายการ
 * กับข้อความของหน้าลงขาย วันที่ต่อ API ให้แก้เฉพาะข้างในฟังก์ชันนี้ · ไม่พบสินค้า = undefined
 */
export function getProductEditData(
  productId: string,
): ProductEditData | undefined {
  const row = getProductsData().rows.find((product) => product.id === productId);
  if (!row) return undefined;

  const create = getProductCreateData();
  const seed = PRODUCT_EDIT_SEEDS[productId];

  // meta เช่น "Pokémon · Near Mint" — สินค้าที่ไม่ใช่การ์ดเดี่ยว (Sealed, Graded) จะไม่ตรงกับตัวเลือกสภาพ
  const [game, conditionText = ""] = row.meta.split(" · ");
  const condition =
    create.condition.options.find((option) =>
      option.label.startsWith(`${conditionText} (`),
    )?.id ?? null;

  const { market, ...pricing } = create.pricing;

  return {
    productId,
    breadcrumb: {
      rootLabel: "จัดการสินค้า",
      productLabel: row.name.split(" — ")[0],
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
      name: row.name,
      tags: seed?.tags ?? [game],
    },
    condition: create.condition,
    pricing: {
      ...pricing,
      description: "ต้นทุนและจำนวนมาจากประวัติการรับเข้า ผู้ซื้อไม่เห็นต้นทุน",
      costLabel: "ต้นทุนเฉลี่ยต่อใบ (บาท)",
      market: seed?.hasMarketData ? market : undefined,
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
      condition,
      price: String(parseBaht(row.price)),
      cost: String(parseBaht(row.cost)),
      quantity: String(row.stock),
      description: seed?.description ?? "",
      options: seed?.options ?? { accept_offers: false, allow_trade: false },
    },
  };
}
