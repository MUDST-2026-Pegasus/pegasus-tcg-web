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

/** dropdown หนึ่งตัวบนแถบเครื่องมือของหน้าผู้ใช้ */
export type CatalogFilterSelect = {
  id: string;
  /** ข้อความที่โชว์ตอนยังไม่ได้เลือกอะไร เช่น "บทบาท: ทั้งหมด" */
  placeholder: string;
  options: { value: string; label: string }[];
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
    /** dropdown กรองบทบาท/สถานะ */
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

/* ── หน้า "ภาพรวมคำสั่งซื้อ" ─────────────────────────────────────── */

/** สถานะคำสั่งซื้อในหน้า Kanban — ใช้ทั้งกำหนดสีจุดหัวคอลัมน์และโทน badge */
export type OrderStatusTone =
  | "pending" // รอชำระเงิน — ส้ม
  | "packing" // ชำระแล้ว รอส่ง — น้ำเงิน
  | "shipping" // กำลังจัดส่ง — ม่วง
  | "success" // สำเร็จ — เขียว
  | "dispute"; // ข้อพิพาท — แดง

/** หนึ่งใบสั่งซื้อในคอลัมน์ */
export type OrderCard = {
  id: string;
  /** เลขคำสั่งซื้อ เช่น "ORD-10233" */
  code: string;
  /** ยอดรวม จัดรูปแบบมาแล้ว เช่น "฿1,180" */
  amount: string;
  /** ผู้ขาย (โชว์คู่ไอคอนร้าน) */
  seller: string;
  /** ผู้ซื้อ (โชว์คู่ไอคอนคน) */
  buyer: string;
  /** ข้อความบน badge ท้ายการ์ด — เนื้อหาต่างกันตามสถานะ
   *  รอชำระเงิน = "ค้าง N ชม.", รอส่ง = "รอแพ็ค N ชม.",
   *  จัดส่ง = เลขพัสดุ, สำเร็จ = สถานะรีวิว, ข้อพิพาท = สาเหตุ */
  contextLabel: string;
  /** จำนวนใบการ์ดในคำสั่งซื้อ เช่น "2 ใบ" */
  itemsLabel: string;
};

/** หนึ่งคอลัมน์ในหน้า Kanban */
export type OrderColumn = {
  id: string;
  tone: OrderStatusTone;
  title: string;
  /** จำนวนคำสั่งซื้อรวมของสถานะนี้ จัดรูปแบบมาแล้ว เช่น "1,398" */
  count: string;
  cards: OrderCard[];
  /** ถ้า false = ซ่อนปุ่ม "ดูเพิ่มเติม" (คอลัมน์ข้อพิพาทที่มีแค่ 2 ใบ) */
  showMore?: boolean;
};

export type AdminOrdersData = {
  title: string;
  subtitle: string;
  actions: { exportLabel: string; disputeLabel: string };
  /** แถบเตือนสีพีชด้านบน */
  notice: { title: string; description: string };
  columns: OrderColumn[];
  moreLabel: string;
};
