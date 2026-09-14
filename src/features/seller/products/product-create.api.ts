import type { ProductCreateData } from "./product-create.types";

/**
 * ข้อมูลตัวอย่างของหน้า "ลงขายสินค้าใหม่" ขั้นที่ 2 (สภาพและราคา)
 * ลอกข้อความและตัวเลขจากดีไซน์ เพื่อให้เทียบหน้าจอกับ Figma ได้ตรง ๆ
 */
const PRODUCT_CREATE_MOCK: ProductCreateData = {
  breadcrumb: {
    rootLabel: "จัดการสินค้า",
    currentLabel: "ลงขายสินค้าใหม่",
  },
  title: "ลงขายสินค้าใหม่",
  subtitle: "เลือกการ์ดจากแคตตาล็อกกลาง แล้วกำหนดสภาพ ราคา และจำนวนของคุณเอง",

  actions: {
    cancelLabel: "ยกเลิก",
    saveDraftLabel: "บันทึกฉบับร่าง",
    publishLabel: "ลงขายทันที",
  },

  steps: [
    { id: "card", label: "เลือกการ์ด" },
    { id: "condition-price", label: "สภาพและราคา" },
    { id: "photos", label: "รูปภาพ" },
    { id: "review", label: "ตรวจสอบ" },
  ],
  currentStepIndex: 1,

  catalogCard: {
    title: "การ์ดที่เลือกจากแคตตาล็อก",
    changeLabel: "เปลี่ยนการ์ด",
    name: "Charizard ex — Obsidian Flames",
    tags: ["Pokémon", "125/197", "Double Rare", "EN"],
  },

  condition: {
    title: "สภาพการ์ด",
    description: "ระบุตามจริง — การระบุสภาพไม่ตรงเป็นสาเหตุข้อพิพาทอันดับ 1",
    options: [
      {
        id: "mint",
        label: "Mint (M)",
        description: "ไร้ตำหนิ เพิ่งแกะจากซอง",
        badgeLabel: "MINT",
      },
      {
        id: "near_mint",
        label: "Near Mint (NM)",
        description: "ตำหนิเล็กน้อยมองแทบไม่เห็น",
        badgeLabel: "NEAR MINT",
      },
      {
        id: "lightly_played",
        label: "Lightly Played (LP)",
        description: "มีรอยขอบหรือรอยขีดเล็กน้อย",
        badgeLabel: "LIGHTLY PLAYED",
      },
      {
        id: "damaged",
        label: "Damaged (DMG)",
        description: "มีรอยพับ ฉีก หรือเปื้อนชัดเจน",
        badgeLabel: "DAMAGED",
      },
    ],
  },

  pricing: {
    title: "ราคาและจำนวน",
    description: "ต้นทุนใช้คำนวณกำไรในรายงานของคุณ ผู้ซื้อไม่เห็นข้อมูลนี้",
    priceLabel: "ราคาขายต่อใบ (บาท)",
    costLabel: "ต้นทุนต่อใบ (บาท)",
    costHelper: "ไม่แสดงต่อผู้ซื้อ",
    quantityLabel: "จำนวนที่มี",
    quantityHelper: "ระบบตัดสต็อกอัตโนมัติเมื่อขายได้",
    commissionPercent: 5,
    summary: {
      priceLabel: "ราคาขาย",
      costLabel: "− ต้นทุน",
      commissionLabel: "− ค่าคอมมิชชั่น",
      profitPerUnitLabel: "= กำไรต่อใบ",
      totalProfitLabel: "กำไรรวมถ้าขายหมด",
      unit: "ใบ",
    },
    market: {
      currentMedianLabel: "ราคากลางตลาดตอนนี้",
      compareLabel: "เทียบกับราคาตลาด",
      listingsLabel: "ประกาศที่ขายอยู่",
      aboveLabel: "สูงกว่าค่ากลาง",
      belowLabel: "ต่ำกว่าค่ากลาง",
      equalLabel: "เท่ากับค่ากลาง",
      lowLabel: "ต่ำสุด",
      medianLabel: "ค่ากลาง",
      highLabel: "สูงสุด",
      listingCount: 12,
      low: 890,
      median: 1180,
      high: 1650,
    },
  },

  details: {
    title: "รายละเอียดเพิ่มเติม",
    placeholder:
      "เช่น เก็บใน Top Loader ตั้งแต่แกะซอง ไม่เคยเล่น มีรูปมุมทั้ง 4 ให้ดูก่อนซื้อ...",
    options: [
      {
        id: "accept_offers",
        title: "เปิดรับข้อเสนอต่อรองราคา",
        description: "ผู้ซื้อเสนอราคาได้ คุณกดรับหรือปฏิเสธ",
        available: true,
      },
      {
        id: "allow_trade",
        title: "อนุญาตให้ใช้การ์ดใบนี้แลกเปลี่ยน (Trade)",
        description: "เปิดใช้ใน Phase 2",
        available: false,
      },
    ],
  },

  preview: {
    title: "ตัวอย่างที่ผู้ซื้อจะเห็น",
  },

  readiness: {
    title: "พร้อมลงขายหรือยัง",
    items: [
      {
        id: "card",
        doneLabel: "เลือกการ์ดจากแคตตาล็อกแล้ว",
        pendingLabel: "ยังไม่เลือกการ์ดจากแคตตาล็อก",
      },
      {
        id: "condition",
        doneLabel: "ระบุสภาพการ์ดแล้ว",
        pendingLabel: "ยังไม่ระบุสภาพการ์ด",
      },
      {
        id: "pricing",
        doneLabel: "กรอกราคาและต้นทุนแล้ว",
        pendingLabel: "ยังไม่กรอกราคาและต้นทุน",
      },
      {
        id: "quantity",
        doneLabel: "ระบุจำนวนแล้ว",
        pendingLabel: "ยังไม่ระบุจำนวน",
      },
      {
        id: "photos",
        doneLabel: "อัปโหลดรูปจริงแล้ว",
        pendingLabel: "ยังไม่อัปโหลดรูปจริง",
      },
      {
        id: "review",
        doneLabel: "ตรวจสอบขั้นสุดท้ายแล้ว",
        pendingLabel: "ยังไม่ตรวจสอบขั้นสุดท้าย",
      },
    ],
  },

  tip: {
    title: "เคล็ดลับตั้งราคา",
    description:
      "ประกาศที่ตั้งราคาใกล้ค่ากลาง ±5% ขายได้เร็วกว่าเฉลี่ย 3.2 เท่า ถ้าการ์ดสภาพดีกว่าคนอื่นค่อยตั้งสูงกว่าและใส่รูปมุมให้ครบ",
  },

  navigation: {
    backLabel: "ย้อนกลับ",
    nextLabel: "ถัดไป: รูปภาพ",
  },

  initialDraft: {
    condition: "near_mint",
    price: "1290",
    cost: "980",
    quantity: "12",
    description: "",
    options: {
      accept_offers: true,
      allow_trade: false,
    },
  },
};

/**
 * จุดต่อข้อมูลของหน้าลงขายสินค้าใหม่ — ตอนนี้คืนข้อมูลจำลอง
 * วันที่ต่อ API จริง (การ์ดที่เลือก + ราคาตลาด) ให้แก้เฉพาะข้างในฟังก์ชันนี้
 */
export function getProductCreateData(): ProductCreateData {
  return PRODUCT_CREATE_MOCK;
}
