import type { ProductCardData } from "@/components/common/ProductCard";

/** หนึ่งเกมในรายการ "เกมทั้งหมด" ของหน้าแคตตาล็อก */
export type CatalogGame = {
  id: string;
  name: string;
  /** จำนวนการ์ดในเกมนั้น แสดงเป็นข้อความจัดรูปแบบแล้ว */
  count: string;
};

/** ตัวเลือกในการ์ด "กรองตามชุด (Set)" */
export type CatalogSet = {
  id: string;
  name: string;
  defaultChecked?: boolean;
};

/** dropdown หนึ่งตัวบนแถบเครื่องมือ */
export type CatalogFilterSelect = {
  id: string;
  /** ข้อความที่โชว์ตอนยังไม่ได้เลือกอะไร เช่น "ความหายาก: ทั้งหมด" */
  placeholder: string;
  options: { value: string; label: string }[];
};

export type AdminCatalogData = {
  title: string;
  subtitle: string;
  games: {
    title: string;
    description: string;
    /** id ของเกมที่ถูกเลือกอยู่ */
    activeId: string;
    items: CatalogGame[];
  };
  sets: {
    title: string;
    items: CatalogSet[];
  };
  summary: {
    label: string;
    value: string;
    footnote: string;
  };
  toolbar: {
    /** ป้ายบอกจำนวนผลลัพธ์ เช่น "แสดง 8 จาก 8,420 ใบ" */
    resultLabel: string;
    searchPlaceholder: string;
    selects: CatalogFilterSelect[];
  };
  products: ProductCardData[];
  pagination: {
    label: string;
    previousLabel: string;
    nextLabel: string;
  };
};
