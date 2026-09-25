/**
 * ลอกมาจาก `model/SellerStatus.java` และ `dto/SellerProfileResponse.java`
 * ใน `pegasus-tcg-api` ถ้าฝั่งนั้นแก้ ไฟล์นี้ต้องแก้ตาม
 */

export type SellerStatus =
  /** ยังไม่เคยสมัคร เป็นผู้ซื้ออย่างเดียว */
  | "NOT_APPLIED"
  /** ส่งเอกสารแล้ว รอแอดมินตรวจ */
  | "PENDING"
  /** ได้บทบาท SELLER และลงขายได้ [RQ-1] */
  | "VERIFIED"
  | "REJECTED"
  /** แอดมินระงับ ประกาศทั้งหมดถูกซ่อนจนกว่าจะยกเลิก */
  | "SUSPENDED";

/**
 * ฝั่งการขายของบัญชี — ไม่ใช่ร้าน ไม่มีชื่อร้าน/รูปโดยตั้งใจ เพราะโปรไฟล์ผู้ใช้คือหน้าร้าน [RQ-2]
 * ชื่อและรูปอ่านจาก `useAuth()` ผ่าน `toSellerIdentity()` ใน `seller.format.ts`
 */
export type SellerProfile = {
  id: number;
  userId: number;
  status: SellerStatus;
  /** คำตอบของ "ตอนนี้ลงขายได้ไหม" — backend คิดให้แล้ว อย่าคิดเองจาก `status` */
  canPublish: boolean;
  verifiedAt: string | null;
  suspendedReason: string | null;
  /** จำนวนวันทำการที่ใช้แพ็คของก่อนส่ง */
  handlingDays: number;
  /** ซ่อนประกาศทุกใบของผู้ขายพร้อมกัน โดยไม่แตะ `status` ของประกาศ */
  vacationMode: boolean;
  autoAcceptOrders: boolean;
  createdAt: string;
};

/** สถานะคำสั่งซื้อฝั่งผู้ขาย — ใช้ทั้งการ์ดคำสั่งซื้อล่าสุดในแดชบอร์ดและหน้าจัดการคำสั่งซื้อ */
export type OrderStatus =
  | "awaiting_pack"
  | "shipped"
  | "awaiting_payment"
  | "completed"
  | "cancelled";
