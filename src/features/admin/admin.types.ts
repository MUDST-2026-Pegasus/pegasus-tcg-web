import type { ProductCardData } from "@/components/common/ProductCard";

/* ── หน้า "ภาพรวมแพลตฟอร์ม" ─────────────────────────────────────── */

export type StatAccent = "primary" | "teal" | "green";

export type StatCardData = {
  id: string;
  label: string;
  value: string;
  delta: string;
  footnote: string;
  bars: number[];
  accent: StatAccent;
};

export type ActivityStatus = "pending" | "attention" | "success";

export type ActivityItem = {
  id: string;
  initials: string;
  avatarAccent: "teal" | "red" | "primary" | "green";
  name: string;
  time: string;
  message: string;
  status: ActivityStatus;
  statusLabel: string;
};

export type TopSeller = {
  id: string;
  name: string;
  amount: string;
  percent: number;
};

export type MonthlySalesPoint = {
  month: string;
  singles: number;
  sealed: number;
};

export type GameShareSlice = {
  id: string;
  name: string;
  value: number;
};

export type AdminOverviewData = {
  title: string;
  subtitle: string;
  stats: StatCardData[];
  monthlySales: {
    title: string;
    description: string;
    points: MonthlySalesPoint[];
  };
  activity: {
    title: string;
    description: string;
    items: ActivityItem[];
    actionLabel: string;
  };
  topSellers: {
    title: string;
    description: string;
    items: TopSeller[];
  };
  gameShare: {
    title: string;
    description: string;
    slices: GameShareSlice[];
    footnoteTitle: string;
    footnoteDescription: string;
  };
};

/* ── หน้า "จัดการแคตตาล็อก" ─────────────────────────────────────── */

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

/* ── หน้า "อนุมัติผู้ขาย" ────────────────────────────────────────── */

/**
 * สีพื้นวงกลมตัวย่อชื่อ — ชุดเดียวกับที่ใช้ในหน้าภาพรวม
 * ใช้ทั้งหน้า "อนุมัติผู้ขาย" และตารางหน้า "จัดการผู้ใช้"
 */
export type SellerAvatarAccent =
  | "teal"
  | "primary"
  | "amber"
  | "red"
  | "slate";

/** สีจุดนำหน้าตัวเลขสรุปด้านบน และสีของ badge สถานะคำขอ */
export type SellerApprovalTone = "pending" | "approved" | "rejected" | "total";

export type SellerApprovalStat = {
  id: string;
  label: string;
  value: string;
  tone: SellerApprovalTone;
  /** true = ช่องที่ต้องลงมือทำ ดีไซน์เน้นให้ตัวหนังสือเข้มกว่าช่องอื่น */
  emphasis?: boolean;
};

/** เอกสาร KYC หนึ่งใบที่ผู้สมัครแนบมา */
export type SellerDocument = {
  id: string;
  title: string;
  /** บรรทัดล่างของการ์ดเอกสาร เช่น "ด้านหน้า · 1.2 MB" */
  meta: string;
};

export type SellerApplication = {
  id: string;
  /** ชื่อผู้ใช้ที่ยื่นคำขอ เช่น "minmin_tcg" */
  handle: string;
  initials: string;
  avatarAccent: SellerAvatarAccent;
  /** เวลาที่ยื่นคำขอแบบข้อความ เช่น "ส่งเมื่อ 5 นาทีที่แล้ว" */
  submittedAt: string;
  /** ป้ายเอกสารที่แนบแล้ว โชว์บนการ์ดในคิวทางซ้าย */
  documentTags: string[];
  statusLabel: string;
  statusTone: SellerApprovalTone;
  /** บรรทัดใต้ชื่อในการ์ดรายละเอียด (วันสมัคร · อีเมล · เบอร์โทร) */
  contactLine: string;
  /** ข้อมูล KYC จัดเป็นตาราง 2 คอลัมน์ */
  details: { label: string; value: string }[];
  documents: SellerDocument[];
  /** สรุปผลตรวจเอกสาร โชว์ในแถบปุ่มด้านล่าง */
  review: string;
};

export type AdminSellerApprovalData = {
  title: string;
  subtitle: string;
  exportLabel: string;
  stats: SellerApprovalStat[];
  queue: {
    title: string;
    sortLabel: string;
    /** badge บนการ์ดที่กำลังเปิดดูอยู่ */
    viewingLabel: string;
  };
  documentsTitle: string;
  /** ข้อความบนการ์ดเอกสารตอนยังไม่ได้เปิดดูรูปจริง */
  documentHint: string;
  reviewTitle: string;
  actions: { requestMore: string; reject: string; approve: string };
  /** id ของคำขอที่เปิดดูอยู่ตอนเข้าหน้า */
  defaultApplicationId: string;
  applications: SellerApplication[];
};

/* ── หน้า "จัดการผู้ใช้" ─────────────────────────────────────────── */

/** บทบาทของบัญชี — กำหนดสีของ badge คอลัมน์ "บทบาท" */
export type AdminUserRole = "buyer" | "seller";

/** สถานะบัญชี — กำหนดสีของ badge คอลัมน์ "สถานะ" */
export type AdminUserStatus = "active" | "suspended" | "kycPending";

/** หนึ่งแถวในตารางผู้ใช้ */
export type AdminUser = {
  id: string;
  handle: string;
  email: string;
  initials: string;
  avatarAccent: SellerAvatarAccent;
  role: AdminUserRole;
  /** ข้อความบน badge บทบาท เช่น "ผู้ซื้อ" */
  roleLabel: string;
  /** จำนวนคำสั่งซื้อ จัดรูปแบบมาแล้ว */
  orders: string;
  /** ยอดใช้จ่ายสะสม จัดรูปแบบมาแล้ว เช่น "฿18,420" */
  spend: string;
  /** วันที่สมัครแบบข้อความ เช่น "12 ม.ค. 2568" */
  joinedAt: string;
  status: AdminUserStatus;
  statusLabel: string;
};

/** ตัวกรองที่ถูกเลือกไว้แล้ว โชว์เป็นชิปใต้แถบเครื่องมือ */
export type AdminUserFilterChip = {
  id: string;
  label: string;
};

export type AdminUsersData = {
  title: string;
  subtitle: string;
  /** ปุ่มมุมขวาบนของหน้า */
  actions: { exportLabel: string; addAdminLabel: string };
  toolbar: {
    searchPlaceholder: string;
    /** dropdown กรองบทบาท/สถานะ — โครงเดียวกับแถบเครื่องมือหน้าแคตตาล็อก */
    selects: CatalogFilterSelect[];
    advancedLabel: string;
    /** ป้ายนำหน้าแถวชิป เช่น "ตัวกรองที่ใช้:" */
    appliedLabel: string;
    chips: AdminUserFilterChip[];
    clearLabel: string;
  };
  table: {
    /** ป้ายหัวตาราง เรียงตามลำดับคอลัมน์ในดีไซน์ */
    columns: {
      user: string;
      role: string;
      orders: string;
      spend: string;
      joinedAt: string;
      status: string;
      /** ใช้เป็น aria-label ของปุ่ม ... ท้ายแถว (คอลัมน์นี้ไม่มีหัวตาราง) */
      actions: string;
    };
    /** aria-label ของ checkbox หัวตารางและของแต่ละแถว */
    selectAllLabel: string;
    selectRowLabel: string;
  };
  users: AdminUser[];
  pagination: {
    /** สรุปช่วงที่แสดง เช่น "แสดง 1–8 จาก 4,982 บัญชี" */
    summary: string;
    previousLabel: string;
    nextLabel: string;
    pages: string[];
    activePage: string;
    /** true = มีหน้าถัดไปอีก ดีไซน์โชว์ "…" คั่นก่อนปุ่มถัดไป */
    hasMore: boolean;
  };
};
