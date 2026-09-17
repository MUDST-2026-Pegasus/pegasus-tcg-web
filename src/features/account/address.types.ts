/**
 * ลอกมาจาก `model/Address.java` และ `dto/AddressRequest.java` ฝั่ง backend
 * ถ้าฝั่งนั้นแก้ ไฟล์นี้ต้องแก้ตาม
 */

/** หนึ่งรายการในสมุดที่อยู่ของผู้ใช้ที่ login อยู่ */
export type Address = {
  id: number;
  userId: number;
  /** ชื่อเล่นของที่อยู่ เช่น "บ้าน" หรือ "ที่ทำงาน" */
  label: string | null;
  recipientName: string;
  phone: string;
  line1: string;
  line2: string | null;
  subdistrict: string | null;
  district: string | null;
  province: string;
  postalCode: string;
  /** ตัวอักษรสองตัว backend เติม "TH" ให้เมื่อส่งมาว่าง */
  countryCode: string;
  defaultShipping: boolean;
  defaultBilling: boolean;
  createdAt: string;
};

/**
 * body เดียวกันทั้งตอนสร้างและตอนแก้ (`POST` กับ `PUT` รับหน้าตานี้เหมือนกัน)
 *
 * `PUT` เป็นการ **เขียนทับทั้งก้อน** ไม่ใช่ patch — ฟิลด์ไหนไม่ส่ง backend เขียนค่าว่าง
 * ทับให้ และ `defaultShipping`/`defaultBilling` ที่ไม่ส่งจะกลายเป็น `false`
 * เวลาแก้ที่อยู่เดิมจึงต้องประกอบ payload จากของเดิมให้ครบเสมอ (ดู `toAddressPayload`)
 */
export type AddressPayload = {
  label: string | null;
  recipientName: string;
  phone: string;
  line1: string;
  line2: string | null;
  subdistrict: string | null;
  district: string | null;
  province: string;
  postalCode: string;
  countryCode: string;
  defaultShipping: boolean;
  defaultBilling: boolean;
};
