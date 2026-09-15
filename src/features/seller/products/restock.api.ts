import { getProductsData } from "./products.api";
import { parseBaht } from "./products.format";
import { toIsoDate } from "./restock.calc";
import type { RestockData, RestockLot } from "./restock.types";

type RestockSeed = {
  tags?: string[];
  soldCount?: number;
  lots: RestockLot[];
  initialDraft?: Partial<RestockData["initialDraft"]>;
};

/**
 * ข้อมูลเฉพาะหน้าเติมสต็อกของแต่ละสินค้า — ของ Charizard ex ลอกจากดีไซน์
 * สินค้าอื่นยังไม่มีประวัติรับเข้า
 */
const RESTOCK_SEEDS: Record<string, RestockSeed> = {
  "charizard-ex": {
    tags: ["Pokémon", "Near Mint", "125/197"],
    soldCount: 34,
    lots: [
      {
        id: "lot-2569-07-02",
        receivedAt: "2026-07-02",
        quantity: 12,
        unitCost: 1020,
        totalCost: 12240,
        sourceLabel: "งาน TCG Expo",
        averageCostAfter: 980,
      },
      {
        id: "lot-2569-05-18",
        receivedAt: "2026-05-18",
        quantity: 16,
        unitCost: 950,
        totalCost: 15200,
        sourceLabel: "ซื้อยกกล่องแล้วแยกใบ",
        averageCostAfter: 962,
      },
      {
        id: "lot-2569-04-05",
        receivedAt: "2026-04-05",
        quantity: 10,
        unitCost: 980,
        totalCost: 9800,
        sourceLabel: "ซื้อจากผู้ขายรายย่อย",
        averageCostAfter: 980,
      },
    ],
    initialDraft: {
      quantity: "8",
      totalCost: "8800",
      receivedAt: "2026-08-14",
      reference: "INV-2569-0814",
    },
  },
};

const SOURCE_OPTIONS = [
  { value: "other_shop", label: "ซื้อจากร้านค้าอื่น" },
  { value: "individual", label: "ซื้อจากผู้ขายรายย่อย" },
  { value: "box_break", label: "ซื้อยกกล่องแล้วแยกใบ" },
  { value: "event", label: "งาน TCG Expo" },
  { value: "other", label: "อื่น ๆ" },
];

/**
 * จุดต่อข้อมูลของหน้าเติมสต็อก — ตอนนี้ประกอบจากข้อมูลจำลองของหน้าจัดการสินค้า
 * วันที่ต่อ API จริงให้แก้เฉพาะข้างในฟังก์ชันนี้ · ไม่พบสินค้า = undefined
 */
export function getRestockData(productId: string): RestockData | undefined {
  const row = getProductsData().rows.find((product) => product.id === productId);
  if (!row) return undefined;

  const seed: RestockSeed = RESTOCK_SEEDS[productId] ?? { lots: [] };

  return {
    productId,
    breadcrumb: {
      rootLabel: "จัดการสินค้า",
      productLabel: row.name.split(" — ")[0],
      currentLabel: "เติมสต็อก",
    },
    title: "เติมสต็อก",
    subtitle:
      "บันทึกล็อตที่รับเข้าพร้อมต้นทุน — ระบบคำนวณต้นทุนเฉลี่ยถ่วงน้ำหนักให้อัตโนมัติ",
    actions: {
      cancelLabel: "ยกเลิก",
      saveLabel: "บันทึกการรับเข้า",
    },

    product: {
      name: row.name,
      tags: seed.tags ?? row.meta.split(" · "),
      stockLabel: "สต็อกปัจจุบัน",
      stock: row.stock,
      averageCost: parseBaht(row.cost),
      sellingPrice: parseBaht(row.price),
      unit: "ใบ",
    },
    commissionPercent: 5,

    form: {
      title: "รับสินค้าเข้าล็อตใหม่",
      description:
        "กรอกจำนวนและต้นทุนรวมของล็อตนี้ ระบบจะหารเป็นต้นทุนต่อใบให้",
      quantityLabel: "จำนวนที่รับเข้า (ใบ)",
      totalCostLabel: "ต้นทุนรวมทั้งล็อต (บาท)",
      totalCostHelper: "รวมค่าส่งและค่าธรรมเนียม",
      receivedAtLabel: "วันที่รับเข้า",
      receivedAtPlaceholder: "เลือกวันที่",
      sourceLabel: "แหล่งที่มา",
      sourceOptions: SOURCE_OPTIONS,
      referenceLabel: "เลขอ้างอิง / ใบเสร็จ",
      referenceHelper: "ไม่บังคับ",
      noteLabel: "บันทึกเพิ่มเติม",
      notePlaceholder: "เช่น รับจากงาน TCG Expo บูธ B12 ตรวจสภาพแล้ว...",
    },

    calculation: {
      title: "การคำนวณต้นทุนเฉลี่ยถ่วงน้ำหนัก (Weighted Average Cost)",
      previousLotLabel: "ล็อตเดิม",
      newLotLabel: "ล็อตใหม่",
      totalLabel: "รวม",
      newAverageLabel: "ต้นทุนเฉลี่ยใหม่ต่อใบ",
      beforeLabel: "เดิม",
      afterLabel: "ใหม่",
    },

    history: {
      title: "ประวัติการรับเข้าสินค้านี้",
      exportLabel: "ส่งออก CSV",
      soldCount: seed.soldCount ?? row.sold,
      columns: {
        receivedAt: "วันที่",
        quantity: "จำนวน",
        unitCost: "ต้นทุน/ใบ",
        totalCost: "ต้นทุนรวม",
        source: "แหล่งที่มา",
        averageCostAfter: "ต้นทุนเฉลี่ยหลังรับ",
      },
      newBadgeLabel: "ใหม่",
      emptyLabel: "ยังไม่มีประวัติการรับเข้าสินค้านี้",
      lots: seed.lots,
    },

    summary: {
      title: "สรุปหลังบันทึก",
      newStockLabel: "สต็อกใหม่",
      averageCostLabel: "ต้นทุนเฉลี่ย",
      sellingPriceLabel: "ราคาขายปัจจุบัน",
      profitPerUnitLabel: "กำไรต่อใบใหม่",
    },

    profitWarning: {
      title: "กำไรต่อใบลดลง",
      adjustPriceLabel: "ปรับราคาขาย",
    },

    info: {
      title: "ทำไมต้องใช้ค่าเฉลี่ย",
      description:
        "เมื่อรับของหลายล็อตราคาต่างกัน ระบบใช้ต้นทุนเฉลี่ยถ่วงน้ำหนักเพื่อให้รายงานกำไรสะท้อนความจริง ไม่ต้องแยกว่าขายใบจากล็อตไหน",
    },

    initialDraft: {
      quantity: "",
      totalCost: "",
      receivedAt: toIsoDate(new Date()),
      source: SOURCE_OPTIONS[0].value,
      reference: "",
      note: "",
      ...seed.initialDraft,
    },
  };
}
