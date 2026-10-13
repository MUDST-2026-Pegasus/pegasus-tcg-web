/* ── หน้า "คุณสมบัติการ์ด" ───────────────────────────────────────── */

/** ชนิดข้อมูลของฟิลด์ — ค่าเดียวกับที่โชว์บน badge ในตาราง */
export type CardFieldType = "text" | "number" | "enum" | "boolean";

/** หนึ่งแถวในตาราง schema */
export type CardSchemaField = {
  id: string;
  label: string;
  type: CardFieldType;
  /** ค่าตัวอย่าง ใช้บอกผู้ดูแลว่าฟิลด์นี้เก็บอะไร เช่น "60 / 120 / 340" */
  sample: string;
  /** true = ผู้ขายต้องกรอกฟิลด์นี้ตอนลงประกาศขาย */
  required: boolean;
  /** true = ฟิลด์นี้ถูกนำไปสร้างตัวกรองในหน้าค้นหา */
  filterable: boolean;
};

/** schema ของเกมหนึ่งเกม = รายการทางซ้าย + ตารางทางขวา */
export type CardSchemaGame = {
  id: string;
  name: string;
  /** จำนวนการ์ดในเกมนั้น แสดงเป็นข้อความจัดรูปแบบแล้ว เช่น "8,420" */
  cardCount: string;
  fields: CardSchemaField[];
};

export type AdminCardAttributesData = {
  title: string;
  subtitle: string;
  /** ปุ่มมุมขวาบนของหน้า */
  actions: { viewJsonLabel: string; saveLabel: string };
  /** แถบแจ้งเตือนสีฟ้าใต้หัวข้อ */
  notice: string;
  gamePicker: { title: string };
  fieldTypes: {
    title: string;
    items: { type: CardFieldType; description: string }[];
  };
  table: {
    addFieldLabel: string;
    /** ป้ายหัวตาราง เรียงตามลำดับคอลัมน์ในดีไซน์ */
    columns: {
      name: string;
      type: string;
      sample: string;
      required: string;
      filterable: string;
      /** ใช้เป็น aria-label ของปุ่ม ... ท้ายแถว (คอลัมน์นี้ไม่มีหัวตาราง) */
      actions: string;
    };
  };
  /** id ของเกมที่เลือกไว้ตอนเปิดหน้า */
  defaultGameId: string;
  games: CardSchemaGame[];
};

/* ── ตัวย่อชื่อผู้ใช้ (ใช้ร่วมหลายหน้า) ───────────────────────────── */

/**
 * สีพื้นวงกลมตัวย่อชื่อ — ชุดเดียวกับที่ใช้ในหน้าภาพรวม
 * ใช้ทั้งหน้า "อนุมัติผู้ขาย" และตารางหน้า "จัดการผู้ใช้"
 *
 * หมายเหตุ: type ของหน้า "อนุมัติผู้ขาย" (คำขอ/เอกสาร/สถิติ) ย้ายไปอยู่กับ
 * data layer จริงแล้วที่ `verification.types.ts` — หน้านั้นเลิกใช้ fixture
 */
export type SellerAvatarAccent =
  | "teal"
  | "primary"
  | "amber"
  | "red"
  | "slate";

/* ── หน้า "ค่าคอมมิชชั่น" ────────────────────────────────────────── */

/** หนึ่งหมวดหมู่ในการ์ด "อัตราเฉพาะหมวดหมู่" */
export type CommissionCategory = {
  id: string;
  name: string;
  /** คำอธิบายบรรทัดล่าง เช่น "การ์ดเดี่ยวและกล่องสุ่ม" */
  description: string;
  /** อัตราค่าคอมของหมวดนี้ เก็บเป็น string เพื่อเสิร์ฟเข้า input ตรง ๆ */
  rate: string;
  /** true = ใช้อัตราของตัวเองแทนอัตราเริ่มต้น (สวิตช์เปิด) */
  useCustom: boolean;
  /** ข้อความบอกสถานะข้างสวิตช์ */
  customLabel: string;
  defaultLabel: string;
};

/** หนึ่งแถวใน "ตัวอย่างการคำนวณ" ทางขวา */
export type CalcRow = {
  id: string;
  label: string;
  value: string;
};

/** หนึ่งกฎในการ์ด "กฎการเก็บค่าธรรมเนียม" */
export type FeeRule = {
  id: string;
  label: string;
  /** true = เปิดใช้กฎ */
  active: boolean;
};

export type AdminCommissionData = {
  title: string;
  subtitle: string;
  actions: { historyLabel: string; saveLabel: string };
  defaultRate: {
    title: string;
    description: string;
    /** อัตราเริ่มต้น เก็บเป็น string จัดรูปแบบแล้ว เช่น "5.0" */
    value: string;
    /** ปลายซ้าย/ขวาของแถบเลื่อน (0% / 15%) */
    minLabel: string;
    maxLabel: string;
    /** ข้อความช่วงที่แนะนำ ตำแหน่งอิงจากช่วงที่แนะนำในแถบ */
    recommendedLabel: string;
    /** ค่ามากสุดของแถบ ใช้คำนวณตำแหน่ง handle ปัจจุบัน */
    max: number;
  };
  categories: {
    title: string;
    description: string;
    addLabel: string;
    items: CommissionCategory[];
  };
  calculation: {
    title: string;
    rows: CalcRow[];
    totalLabel: string;
    totalValue: string;
  };
  rules: {
    title: string;
    items: FeeRule[];
  };
  impact: {
    title: string;
    description: string;
  };
};
