/** ล็อตที่เคยรับเข้าแล้ว — แสดงในตารางประวัติ */
export type RestockLot = {
  id: string;
  /** วันที่แบบ ISO เช่น "2026-07-02" */
  receivedAt: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  sourceLabel: string;
  /** ต้นทุนเฉลี่ยของสินค้าหลังรับล็อตนี้ */
  averageCostAfter: number;
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
    stock: number;
    averageCost: number;
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
    /** จำนวนที่ขายไปแล้วทั้งหมด ใช้ในบรรทัดสรุปใต้หัวตาราง */
    soldCount: number;
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
    /** เรียงใหม่สุดก่อน */
    lots: RestockLot[];
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
