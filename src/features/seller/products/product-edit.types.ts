import type { ListingDraft, ProductCreateData } from "./product-create.types";

/**
 * หน้า "แก้ไขสินค้า" ยังไม่มีดีไซน์ใน Figma — ใช้การ์ดชุดเดียวกับหน้าลงขาย
 * ต่างกันที่ไม่มีแถบขั้นตอน เปลี่ยนการ์ดไม่ได้ และต้นทุน/จำนวนแก้ผ่านหน้าเติมสต็อกเท่านั้น
 */
export type ProductEditData = {
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
  catalogCard: Omit<ProductCreateData["catalogCard"], "changeLabel">;
  condition: ProductCreateData["condition"];
  pricing: Omit<ProductCreateData["pricing"], "market"> & {
    /** ไม่มี = ยังไม่มีข้อมูลราคาตลาดของสินค้านี้ */
    market?: ProductCreateData["pricing"]["market"];
  };
  stockLock: {
    costHelper: string;
    quantityHelper: string;
    restockLabel: string;
  };
  details: ProductCreateData["details"];
  preview: ProductCreateData["preview"];
  tip: ProductCreateData["tip"];
  /** ค่าปัจจุบันของประกาศ — ใช้เป็นค่าเริ่มต้นของฟอร์มและเทียบว่ามีการแก้ไขหรือยัง */
  initialDraft: ListingDraft;
};
