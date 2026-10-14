import type { CardCondition } from "./products.types";

/** ล็อตที่เคยรับเข้าแล้ว — แสดงในตารางประวัติ */
export type RestockLot = {
  id: string;
  /** วันที่แบบ ISO เช่น "2026-07-02" */
  receivedAt: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  sourceLabel: string;
  /** ต้นทุนเฉลี่ยของสินค้าหลังรับล็อตนี้ — `null` = ล็อตเก่าที่ระบบยังไม่ได้เก็บค่านี้ */
  averageCostAfter: number | null;
};

export type SelectOption = { value: string; label: string };

/** ค่าที่ผู้ขายกรอกในฟอร์มรับเข้า — ตัวเลขเก็บเป็นข้อความตามที่พิมพ์ */
export type RestockDraft = {
  quantity: string;
  totalCost: string;
  /** วันที่แบบ ISO เช่น "2026-08-14" · ว่าง = ยังไม่เลือก */
  receivedAt: string;
  source: string;
  reference: string;
  note: string;
};

export type RestockData = {
  productId: string;
  /** ประวัติรับเข้าอ่านตามการ์ดพิมพ์ + สภาพ เพราะต้นทุนเฉลี่ยคิดรวมทุกประกาศของร้าน */
  market: { variantId: number; condition: CardCondition };
  breadcrumb: {
    rootLabel: string;
    /** ชื่อสั้นของสินค้า เช่น "Charizard ex" */
    productLabel: string;
    currentLabel: string;
  };
  title: string;
  subtitle: string;
  actions: {
    cancelLabel: string;
    saveLabel: string;
  };
  product: {
    name: string;
    tags: string[];
    stockLabel: string;
    /** การ์ดที่พร้อมขายบนประกาศนี้ — แสดงเป็นสต็อกปัจจุบัน */
    stock: number;
    averageCost: number;
    /**
     * การ์ดทั้งหมดที่ต้นทุนเฉลี่ยนี้ครอบคลุม (`costBasis.quantity`) และต้นทุนรวมของมัน
     * ใช้คิดต้นทุนเฉลี่ยใหม่ให้ตรงกับที่ backend คิดจริง ไม่ใช่ `stock` ของประกาศเดียว
     */
    costQuantity: number;
    costTotal: number;
    sellingPrice: number;
    /** หน่วยต่อท้ายจำนวน เช่น "ใบ" */
    unit: string;
  };
  /** % ที่แพลตฟอร์มหักจากราคาขาย ใช้คำนวณกำไรต่อใบ */
  commissionPercent: number;
  form: {
    title: string;
    description: string;
    quantityLabel: string;
    totalCostLabel: string;
    totalCostHelper: string;
    receivedAtLabel: string;
    receivedAtPlaceholder: string;
    sourceLabel: string;
    sourceOptions: SelectOption[];
    referenceLabel: string;
    referenceHelper: string;
    noteLabel: string;
    notePlaceholder: string;
  };
  calculation: {
    title: string;
    previousLotLabel: string;
    newLotLabel: string;
    totalLabel: string;
    newAverageLabel: string;
    beforeLabel: string;
    afterLabel: string;
  };
  history: {
    title: string;
    exportLabel: string;
    columns: {
      receivedAt: string;
      quantity: string;
      unitCost: string;
      totalCost: string;
      source: string;
      averageCostAfter: string;
    };
    newBadgeLabel: string;
    emptyLabel: string;
    errorLabel: string;
    loadMoreLabel: string;
  };
  summary: {
    title: string;
    newStockLabel: string;
    averageCostLabel: string;
    sellingPriceLabel: string;
    profitPerUnitLabel: string;
  };
  profitWarning: {
    title: string;
    adjustPriceLabel: string;
  };
  info: {
    title: string;
    description: string;
  };
  initialDraft: RestockDraft;
};
