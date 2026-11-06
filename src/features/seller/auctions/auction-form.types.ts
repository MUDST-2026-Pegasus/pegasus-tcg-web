/**
 * ค่าในฟอร์มเปิดประมูล (S2a → S2 → ยืนยัน) [TCG-633 · FE-7]
 *
 * ตัวเลขเก็บเป็นข้อความตามที่พิมพ์ (`AmountInput`) แล้วค่อยแปลงตอนส่ง
 * วันและเวลาปิดเก็บแยกกันเป็นเวลาประเทศไทย ไม่ขึ้นกับ timezone ของเครื่อง
 */
export type AuctionFormValues = {
  /** การ์ดใบที่เลือกจากสต็อก — `null` = ยังไม่เลือก */
  unitUid: string | null;
  startingPrice: string;
  bidIncrement: string;
  /** `YYYY-MM-DD` ตามปฏิทินไทย (GMT+7) */
  closeDate: string;
  /** `HH:mm` แบบ 24 ชม. */
  closeTime: string;
  buyNowEnabled: boolean;
  buyNowPrice: string;
  sellerNote: string;
};

export type AuctionFormField = keyof AuctionFormValues;

/**
 * ข้อผิดพลาดหนึ่งข้อ (S3-E) — `message` เป็นหัวข้อ `detail` เป็นบรรทัดอธิบาย
 * ใต้ช่องแสดงทั้งสองบรรทัด
 */
export type AuctionFormIssue = {
  path: AuctionFormField;
  message: string;
  detail?: string;
};

/** ปุ่ม "ตั้งเร็ว:" ใต้ช่องเวลาปิด */
export type CloseTimeShortcut = {
  label: string;
  hours: number;
};
