import { CONDITION_LABEL } from "./products.format";
import type { SellerListing } from "./products.types";
import { toIsoDate } from "./restock.calc";
import type { RestockData } from "./restock.types";

const SOURCE_OPTIONS = [
  { value: "other_shop", label: "ซื้อจากร้านค้าอื่น" },
  { value: "individual", label: "ซื้อจากผู้ขายรายย่อย" },
  { value: "box_break", label: "ซื้อยกกล่องแล้วแยกใบ" },
  { value: "event", label: "งาน TCG Expo" },
  { value: "other", label: "อื่น ๆ" },
];

/**
 * ประกอบหน้าเติมสต็อกจากประกาศจริง (`GET /sellers/me/listings/{id}`)
 * ประวัติรับเข้า ต้นทุนเฉลี่ย และยอดขาย ยังไม่มีที่มา — SLR-04 จะต่อกับ unit/คลัง
 * (`POST /sellers/me/listings/{id}/units`, `/inventory/movements`) ระหว่างนี้เป็น 0 / ว่าง
 */
export function getRestockData(listing: SellerListing): RestockData {
  return {
    productId: String(listing.id),
    breadcrumb: {
      rootLabel: "จัดการสินค้า",
      productLabel: listing.card.productName,
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
      name: listing.card.productName,
      tags: [listing.card.variantLabel, CONDITION_LABEL[listing.condition]],
      stockLabel: "สต็อกปัจจุบัน",
      stock: listing.quantityAvailable,
      averageCost: 0,
      sellingPrice: listing.price,
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
      soldCount: 0,
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
      lots: [],
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
    },
  };
}
