/** สถานะของสินค้าที่ลงขาย — ใช้ทั้งกับ badge ในตารางและชิปตัวกรองด้านบน */
export type ProductStatus = "active" | "low_stock" | "out_of_stock" | "draft";

/** "all" = ไม่กรอง นอกนั้นตรงกับ ProductStatus */
export type ProductFilterId = "all" | ProductStatus;

export type ProductFilter = {
  id: ProductFilterId;
  label: string;
  /** จำนวนสินค้าทั้งคลังของสถานะนี้ (ไม่ใช่จำนวนแถวในหน้านี้) */
  count: number;
};

export type ProductRow = {
  id: string;
  name: string;
  /** บรรทัดรองใต้ชื่อสินค้า เช่น "Pokémon · Near Mint" */
  meta: string;
  price: string;
  cost: string;
  stock: number;
  sold: number;
  status: ProductStatus;
  statusLabel: string;
};

export type ProductsData = {
  title: string;
  subtitle: string;
  actions: {
    importLabel: string;
    createLabel: string;
  };
  filters: ProductFilter[];
  toolbar: {
    searchPlaceholder: string;
    sortPlaceholder: string;
    sortOptions: { value: string; label: string }[];
  };
  /** ปุ่มในแถบสีเขียวที่โผล่มาเมื่อเลือกสินค้า */
  bulkActions: { id: string; label: string }[];
  table: {
    columns: {
      product: string;
      price: string;
      cost: string;
      stock: string;
      sold: string;
      status: string;
      /** ไม่มีหัวคอลัมน์ในดีไซน์ ใช้เป็น aria-label ของปุ่มท้ายแถว */
      actions: string;
    };
    /** หน่วยต่อท้ายจำนวนสต็อก เช่น "ใบ" */
    stockUnit: string;
    selectAllLabel: string;
    selectRowLabel: string;
    editLabel: string;
    moreLabel: string;
  };
  rows: ProductRow[];
  pagination: {
    previousLabel: string;
    nextLabel: string;
    pages: number[];
    currentPage: number;
  };
};
