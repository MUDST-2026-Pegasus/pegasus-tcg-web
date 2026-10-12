/** สภาพการ์ดที่ผู้ขายเลือกได้ตอนลงขาย */
export type CardCondition = "mint" | "near_mint" | "lightly_played" | "damaged";

export type ConditionOption = {
  id: CardCondition;
  /** เช่น "Near Mint (NM)" */
  label: string;
  description: string;
  /** ป้ายบนการ์ดตัวอย่างที่ผู้ซื้อเห็น เช่น "NEAR MINT" */
  badgeLabel: string;
};

export type CreateStep = {
  id: string;
  label: string;
};

export type ListingOptionId = "accept_offers" | "allow_trade";

export type ListingOption = {
  id: ListingOptionId;
  title: string;
  description: string;
  /** false = ฟีเจอร์ยังไม่เปิดให้ใช้ (เช่น รอ Phase 2) สวิตช์กดไม่ได้ */
  available: boolean;
};

/** ข้อในการ์ด "พร้อมลงขายหรือยัง" — ติ๊กแล้วหรือยังคำนวณจากค่าที่กรอกในฟอร์ม */
export type ReadinessId =
  | "card"
  | "condition"
  | "pricing"
  | "quantity"
  | "photos"
  | "review";

export type ReadinessItem = {
  id: ReadinessId;
  doneLabel: string;
  pendingLabel: string;
};

/**
 * ค่าที่ผู้ขายกรอกในขั้น "สภาพและราคา"
 * ตัวเลขเก็บเป็นข้อความตามที่พิมพ์ (ไม่มีคอมมา) แปลงเป็นตัวเลขตอนคำนวณ
 */
export type ListingDraft = {
  condition: CardCondition | null;
  price: string;
  cost: string;
  quantity: string;
  description: string;
  options: Record<ListingOptionId, boolean>;
};

export type ProductCreateData = {
  breadcrumb: {
    rootLabel: string;
    currentLabel: string;
  };
  title: string;
  subtitle: string;
  actions: {
    cancelLabel: string;
    saveDraftLabel: string;
    publishLabel: string;
  };
  steps: CreateStep[];
  /** index ของขั้นที่กำลังทำใน steps — ตอนนี้ดีไซน์มีเฉพาะขั้น "สภาพและราคา" */
  currentStepIndex: number;
  catalogCard: {
    title: string;
    changeLabel: string;
    name: string;
    /** ชิปใต้ชื่อการ์ด เช่น เกม / เลขการ์ด / ความหายาก / ภาษา */
    tags: string[];
  };
  condition: {
    title: string;
    description: string;
    options: ConditionOption[];
  };
  pricing: {
    title: string;
    description: string;
    priceLabel: string;
    costLabel: string;
    costHelper: string;
    quantityLabel: string;
    quantityHelper: string;
    /** % ที่แพลตฟอร์มหักจากราคาขาย */
    commissionPercent: number;
    summary: {
      priceLabel: string;
      costLabel: string;
      commissionLabel: string;
      profitPerUnitLabel: string;
      totalProfitLabel: string;
      unit: string;
    };
    market: {
      currentMedianLabel: string;
      compareLabel: string;
      listingsLabel: string;
      aboveLabel: string;
      belowLabel: string;
      equalLabel: string;
      lowLabel: string;
      medianLabel: string;
      highLabel: string;
      /** จำนวนประกาศของการ์ดใบเดียวกันที่ขายอยู่ในตลาดตอนนี้ */
      listingCount: number;
      low: number;
      median: number;
      high: number;
    };
  };
  details: {
    title: string;
    placeholder: string;
    options: ListingOption[];
  };
  preview: {
    title: string;
  };
  readiness: {
    title: string;
    items: ReadinessItem[];
  };
  tip: {
    title: string;
    description: string;
  };
  navigation: {
    backLabel: string;
    nextLabel: string;
  };
  initialDraft: ListingDraft;
};
