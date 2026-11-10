import type { StockInLot } from "./listing-form.types";
import { CONDITION_LABEL } from "./products.format";
import type { SellerListing } from "./products.types";
import { toIsoDate } from "./restock.calc";
import type { RestockData, RestockLot } from "./restock.types";
import { translate } from "@/lib/i18n";

const SOURCE_OPTIONS = [
  { value: "other_shop", get label() { return translate("seller", "restock.source.other_shop", "ซื้อจากร้านค้าอื่น"); } },
  { value: "individual", get label() { return translate("seller", "restock.source.individual", "ซื้อจากผู้ขายรายย่อย"); } },
  { value: "box_break", get label() { return translate("seller", "restock.source.box_break", "ซื้อยกกล่องแล้วแยกใบ"); } },
  { value: "event", get label() { return translate("seller", "restock.source.event", "งาน TCG Expo"); } },
  { value: "other", get label() { return translate("seller", "restock.source.other", "อื่น ๆ"); } },
];

/**
 * ประกอบหน้าเติมสต็อกจากประกาศจริง (`GET /sellers/me/listings/{id}`)
 * ต้นทุนเฉลี่ยมาจาก `costBasis` ของประกาศ — ตัวเดียวกับที่ backend ใช้เป็นต้นทุนตอนขาย
 * ประวัติรับเข้าโหลดแยกด้วย `useStockIns` ตาม `market` แล้วแปลงแถวด้วย `toRestockLot`
 */
export function getRestockData(listing: SellerListing): RestockData {
  return {
    productId: String(listing.id),
    market: { variantId: listing.card.variantId, condition: listing.condition },
    breadcrumb: {
      rootLabel: translate("seller", "restock.breadcrumb.rootLabel", "จัดการสินค้า"),
      productLabel: listing.card.productName,
      currentLabel: translate("seller", "restock.breadcrumb.currentLabel", "เติมสต็อก"),
    },
    title: translate("seller", "restock.title", "เติมสต็อก"),
    subtitle:
      translate("seller", "restock.subtitle", "บันทึกล็อตที่รับเข้าพร้อมต้นทุน — ระบบคำนวณต้นทุนเฉลี่ยถ่วงน้ำหนักให้อัตโนมัติ"),
    actions: {
      cancelLabel: translate("seller", "restock.actions.cancelLabel", "ยกเลิก"),
      saveLabel: translate("seller", "restock.actions.saveLabel", "บันทึกการรับเข้า"),
    },

    product: {
      name: listing.card.productName,
      tags: [listing.card.variantLabel, CONDITION_LABEL[listing.condition]],
      stockLabel: translate("seller", "restock.product.stockLabel", "สต็อกปัจจุบัน"),
      stock: listing.quantityAvailable,
      averageCost: listing.costBasis.averageUnitCost,
      costQuantity: listing.costBasis.quantity,
      costTotal: listing.costBasis.totalCost,
      sellingPrice: listing.price,
      unit: translate("seller", "restock.product.unit", "ใบ"),
    },
    commissionPercent: 5,

    form: {
      title: translate("seller", "restock.form.title", "รับสินค้าเข้าล็อตใหม่"),
      description:
        translate("seller", "restock.form.description", "กรอกจำนวนและต้นทุนรวมของล็อตนี้ ระบบจะหารเป็นต้นทุนต่อใบให้"),
      quantityLabel: translate("seller", "restock.form.quantityLabel", "จำนวนที่รับเข้า (ใบ)"),
      totalCostLabel: translate("seller", "restock.form.totalCostLabel", "ต้นทุนรวมทั้งล็อต (บาท)"),
      totalCostHelper: translate("seller", "restock.form.totalCostHelper", "รวมค่าส่งและค่าธรรมเนียม"),
      receivedAtLabel: translate("seller", "restock.form.receivedAtLabel", "วันที่รับเข้า"),
      receivedAtPlaceholder: translate("seller", "restock.form.receivedAtPlaceholder", "เลือกวันที่"),
      sourceLabel: translate("seller", "restock.form.sourceLabel", "แหล่งที่มา"),
      sourceOptions: SOURCE_OPTIONS,
      referenceLabel: translate("seller", "restock.form.referenceLabel", "เลขอ้างอิง / ใบเสร็จ"),
      referenceHelper: translate("seller", "restock.form.referenceHelper", "ไม่บังคับ"),
      noteLabel: translate("seller", "restock.form.noteLabel", "บันทึกเพิ่มเติม"),
      notePlaceholder: translate("seller", "restock.form.notePlaceholder", "เช่น รับจากงาน TCG Expo บูธ B12 ตรวจสภาพแล้ว..."),
    },

    calculation: {
      title: translate("seller", "restock.calculation.title", "การคำนวณต้นทุนเฉลี่ยถ่วงน้ำหนัก (Weighted Average Cost)"),
      previousLotLabel: translate("seller", "restock.calculation.previousLotLabel", "ล็อตเดิม"),
      newLotLabel: translate("seller", "restock.calculation.newLotLabel", "ล็อตใหม่"),
      totalLabel: translate("seller", "restock.calculation.totalLabel", "รวม"),
      newAverageLabel: translate("seller", "restock.calculation.newAverageLabel", "ต้นทุนเฉลี่ยใหม่ต่อใบ"),
      beforeLabel: translate("seller", "restock.calculation.beforeLabel", "เดิม"),
      afterLabel: translate("seller", "restock.calculation.afterLabel", "ใหม่"),
    },

    history: {
      title: translate("seller", "restock.history.title", "ประวัติการรับเข้าสินค้านี้"),
      exportLabel: translate("seller", "restock.history.exportLabel", "ส่งออก CSV"),
      columns: {
        receivedAt: translate("seller", "restock.history.columns.receivedAt", "วันที่"),
        quantity: translate("seller", "restock.history.columns.quantity", "จำนวน"),
        unitCost: translate("seller", "restock.history.columns.unitCost", "ต้นทุน/ใบ"),
        totalCost: translate("seller", "restock.history.columns.totalCost", "ต้นทุนรวม"),
        source: translate("seller", "restock.history.columns.source", "แหล่งที่มา"),
        averageCostAfter: translate("seller", "restock.history.columns.averageCostAfter", "ต้นทุนเฉลี่ยหลังรับ"),
      },
      newBadgeLabel: translate("seller", "restock.history.newBadgeLabel", "ใหม่"),
      emptyLabel: translate("seller", "restock.history.emptyLabel", "ยังไม่มีประวัติการรับเข้าสินค้านี้"),
      errorLabel: translate("seller", "restock.history.errorLabel", "โหลดประวัติการรับเข้าไม่สำเร็จ"),
      loadMoreLabel: translate("seller", "restock.history.loadMoreLabel", "ดูเพิ่ม"),
    },

    summary: {
      title: translate("seller", "restock.summary.title", "สรุปหลังบันทึก"),
      newStockLabel: translate("seller", "restock.summary.newStockLabel", "สต็อกใหม่"),
      averageCostLabel: translate("seller", "restock.summary.averageCostLabel", "ต้นทุนเฉลี่ย"),
      sellingPriceLabel: translate("seller", "restock.summary.sellingPriceLabel", "ราคาขายปัจจุบัน"),
      profitPerUnitLabel: translate("seller", "restock.summary.profitPerUnitLabel", "กำไรต่อใบใหม่"),
    },

    profitWarning: {
      title: translate("seller", "restock.profitWarning.title", "กำไรต่อใบลดลง"),
      adjustPriceLabel: translate("seller", "restock.profitWarning.adjustPriceLabel", "ปรับราคาขาย"),
    },

    info: {
      title: translate("seller", "restock.info.title", "ทำไมต้องใช้ค่าเฉลี่ย"),
      description:
        translate("seller", "restock.info.description", "เมื่อรับของหลายล็อตราคาต่างกัน ระบบใช้ต้นทุนเฉลี่ยถ่วงน้ำหนักเพื่อให้รายงานกำไรสะท้อนความจริง ไม่ต้องแยกว่าขายใบจากล็อตไหน"),
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

/**
 * ล็อตจาก backend → แถวในตารางประวัติ
 * วันที่ตัดเหลือวันตามเวลาเครื่อง (backend ส่งมาพร้อม offset) ให้ตรงกับที่ผู้ขายเลือกในฟอร์ม
 * แหล่งที่มา เลขอ้างอิง และโน้ตถูกรวมเป็นข้อความเดียวตอนบันทึก (`toNewUnitsPayload`) จึงแสดงทั้งก้อน
 */
export function toRestockLot(lot: StockInLot): RestockLot {
  return {
    id: String(lot.id),
    receivedAt: toIsoDate(new Date(lot.receivedAt)),
    quantity: lot.quantity,
    unitCost: lot.unitCost,
    totalCost: lot.totalCost,
    sourceLabel: lot.note ?? "",
    averageCostAfter: lot.averageCostAfter,
  };
}

// translate() อยู่นอก component — ประกาศ key ให้ tolgee CLI เห็น [TCG-555]
// @tolgee-key {"key": "restock.source.other_shop", "ns": "seller", "defaultValue": "ซื้อจากร้านค้าอื่น"}
// @tolgee-key {"key": "restock.source.individual", "ns": "seller", "defaultValue": "ซื้อจากผู้ขายรายย่อย"}
// @tolgee-key {"key": "restock.source.box_break", "ns": "seller", "defaultValue": "ซื้อยกกล่องแล้วแยกใบ"}
// @tolgee-key {"key": "restock.source.event", "ns": "seller", "defaultValue": "งาน TCG Expo"}
// @tolgee-key {"key": "restock.source.other", "ns": "seller", "defaultValue": "อื่น ๆ"}
// @tolgee-key {"key": "restock.breadcrumb.rootLabel", "ns": "seller", "defaultValue": "จัดการสินค้า"}
// @tolgee-key {"key": "restock.breadcrumb.currentLabel", "ns": "seller", "defaultValue": "เติมสต็อก"}
// @tolgee-key {"key": "restock.title", "ns": "seller", "defaultValue": "เติมสต็อก"}
// @tolgee-key {"key": "restock.subtitle", "ns": "seller", "defaultValue": "บันทึกล็อตที่รับเข้าพร้อมต้นทุน — ระบบคำนวณต้นทุนเฉลี่ยถ่วงน้ำหนักให้อัตโนมัติ"}
// @tolgee-key {"key": "restock.actions.cancelLabel", "ns": "seller", "defaultValue": "ยกเลิก"}
// @tolgee-key {"key": "restock.actions.saveLabel", "ns": "seller", "defaultValue": "บันทึกการรับเข้า"}
// @tolgee-key {"key": "restock.product.stockLabel", "ns": "seller", "defaultValue": "สต็อกปัจจุบัน"}
// @tolgee-key {"key": "restock.product.unit", "ns": "seller", "defaultValue": "ใบ"}
// @tolgee-key {"key": "restock.form.title", "ns": "seller", "defaultValue": "รับสินค้าเข้าล็อตใหม่"}
// @tolgee-key {"key": "restock.form.description", "ns": "seller", "defaultValue": "กรอกจำนวนและต้นทุนรวมของล็อตนี้ ระบบจะหารเป็นต้นทุนต่อใบให้"}
// @tolgee-key {"key": "restock.form.quantityLabel", "ns": "seller", "defaultValue": "จำนวนที่รับเข้า (ใบ)"}
// @tolgee-key {"key": "restock.form.totalCostLabel", "ns": "seller", "defaultValue": "ต้นทุนรวมทั้งล็อต (บาท)"}
// @tolgee-key {"key": "restock.form.totalCostHelper", "ns": "seller", "defaultValue": "รวมค่าส่งและค่าธรรมเนียม"}
// @tolgee-key {"key": "restock.form.receivedAtLabel", "ns": "seller", "defaultValue": "วันที่รับเข้า"}
// @tolgee-key {"key": "restock.form.receivedAtPlaceholder", "ns": "seller", "defaultValue": "เลือกวันที่"}
// @tolgee-key {"key": "restock.form.sourceLabel", "ns": "seller", "defaultValue": "แหล่งที่มา"}
// @tolgee-key {"key": "restock.form.referenceLabel", "ns": "seller", "defaultValue": "เลขอ้างอิง / ใบเสร็จ"}
// @tolgee-key {"key": "restock.form.referenceHelper", "ns": "seller", "defaultValue": "ไม่บังคับ"}
// @tolgee-key {"key": "restock.form.noteLabel", "ns": "seller", "defaultValue": "บันทึกเพิ่มเติม"}
// @tolgee-key {"key": "restock.form.notePlaceholder", "ns": "seller", "defaultValue": "เช่น รับจากงาน TCG Expo บูธ B12 ตรวจสภาพแล้ว..."}
// @tolgee-key {"key": "restock.calculation.title", "ns": "seller", "defaultValue": "การคำนวณต้นทุนเฉลี่ยถ่วงน้ำหนัก (Weighted Average Cost)"}
// @tolgee-key {"key": "restock.calculation.previousLotLabel", "ns": "seller", "defaultValue": "ล็อตเดิม"}
// @tolgee-key {"key": "restock.calculation.newLotLabel", "ns": "seller", "defaultValue": "ล็อตใหม่"}
// @tolgee-key {"key": "restock.calculation.totalLabel", "ns": "seller", "defaultValue": "รวม"}
// @tolgee-key {"key": "restock.calculation.newAverageLabel", "ns": "seller", "defaultValue": "ต้นทุนเฉลี่ยใหม่ต่อใบ"}
// @tolgee-key {"key": "restock.calculation.beforeLabel", "ns": "seller", "defaultValue": "เดิม"}
// @tolgee-key {"key": "restock.calculation.afterLabel", "ns": "seller", "defaultValue": "ใหม่"}
// @tolgee-key {"key": "restock.history.title", "ns": "seller", "defaultValue": "ประวัติการรับเข้าสินค้านี้"}
// @tolgee-key {"key": "restock.history.exportLabel", "ns": "seller", "defaultValue": "ส่งออก CSV"}
// @tolgee-key {"key": "restock.history.columns.receivedAt", "ns": "seller", "defaultValue": "วันที่"}
// @tolgee-key {"key": "restock.history.columns.quantity", "ns": "seller", "defaultValue": "จำนวน"}
// @tolgee-key {"key": "restock.history.columns.unitCost", "ns": "seller", "defaultValue": "ต้นทุน/ใบ"}
// @tolgee-key {"key": "restock.history.columns.totalCost", "ns": "seller", "defaultValue": "ต้นทุนรวม"}
// @tolgee-key {"key": "restock.history.columns.source", "ns": "seller", "defaultValue": "แหล่งที่มา"}
// @tolgee-key {"key": "restock.history.columns.averageCostAfter", "ns": "seller", "defaultValue": "ต้นทุนเฉลี่ยหลังรับ"}
// @tolgee-key {"key": "restock.history.newBadgeLabel", "ns": "seller", "defaultValue": "ใหม่"}
// @tolgee-key {"key": "restock.history.emptyLabel", "ns": "seller", "defaultValue": "ยังไม่มีประวัติการรับเข้าสินค้านี้"}
// @tolgee-key {"key": "restock.history.errorLabel", "ns": "seller", "defaultValue": "โหลดประวัติการรับเข้าไม่สำเร็จ"}
// @tolgee-key {"key": "restock.history.loadMoreLabel", "ns": "seller", "defaultValue": "ดูเพิ่ม"}
// @tolgee-key {"key": "restock.summary.title", "ns": "seller", "defaultValue": "สรุปหลังบันทึก"}
// @tolgee-key {"key": "restock.summary.newStockLabel", "ns": "seller", "defaultValue": "สต็อกใหม่"}
// @tolgee-key {"key": "restock.summary.averageCostLabel", "ns": "seller", "defaultValue": "ต้นทุนเฉลี่ย"}
// @tolgee-key {"key": "restock.summary.sellingPriceLabel", "ns": "seller", "defaultValue": "ราคาขายปัจจุบัน"}
// @tolgee-key {"key": "restock.summary.profitPerUnitLabel", "ns": "seller", "defaultValue": "กำไรต่อใบใหม่"}
// @tolgee-key {"key": "restock.profitWarning.title", "ns": "seller", "defaultValue": "กำไรต่อใบลดลง"}
// @tolgee-key {"key": "restock.profitWarning.adjustPriceLabel", "ns": "seller", "defaultValue": "ปรับราคาขาย"}
// @tolgee-key {"key": "restock.info.title", "ns": "seller", "defaultValue": "ทำไมต้องใช้ค่าเฉลี่ย"}
// @tolgee-key {"key": "restock.info.description", "ns": "seller", "defaultValue": "เมื่อรับของหลายล็อตราคาต่างกัน ระบบใช้ต้นทุนเฉลี่ยถ่วงน้ำหนักเพื่อให้รายงานกำไรสะท้อนความจริง ไม่ต้องแยกว่าขายใบจากล็อตไหน"}
