/**
 * ลอกมาจาก `dto/VerificationResponse.java`, `model/VerificationStatus.java`
 * และ `dto/RejectVerificationRequest.java` ใน `pegasus-tcg-api` ถ้าฝั่งนั้นแก้
 * ไฟล์นี้ต้องแก้ตาม
 *
 * รูปร่างเดียวกับ `features/seller/application/application.types.ts` แต่แยกไว้เป็น
 * ของ admin เอง จะได้ไม่ผูกสองฟีเจอร์เข้าด้วยกัน — คนละเจ้าของ คนละวงจร
 *
 * สิ่งที่ backend "ไม่" ส่งมา และเคยมีใน fixture: บัตรประชาชน, เซลฟี่, อีเมล,
 * เบอร์โทร, ชื่อร้าน — `SellerOnboardingService.java` จงใจไม่เก็บเอกสารยืนยันตัวตน
 * มีแค่ชื่อจริง บัญชีธนาคาร และรูปหน้าสมุดบัญชีไว้เทียบว่าชื่อบัญชีตรงกับที่กรอก
 */

export type VerificationStatus =
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED";

export type Verification = {
  id: number;
  sellerProfileId: number;
  legalFirstName: string;
  legalLastName: string;
  bankCode: string;
  bankName: string;
  /** PII — เลขบัญชีเต็ม ผู้ตรวจต้องเห็นเพื่อยืนยัน อย่า log/ใส่ URL/เก็บ localStorage */
  bankAccountNumber: string;
  /**
   * object key ใน MinIO ไม่ใช่ URL — `null` เฉพาะใบเก่าที่ส่งมาก่อนฟอร์มมีช่องรูป
   * (`V20260918_2220__fix_seller_verification_bank_book_image.sql`)
   */
  bankBookImageKey: string | null;
  /**
   * presigned GET อายุสั้น (`download-url-ttl` ฝั่ง backend ตั้งไว้ 15 นาที)
   * หมดอายุแล้วต้องดึงใบนี้ใหม่เพื่อขอ URL ใหม่ — ห้ามเก็บหรือส่งต่อ
   */
  bankBookImageUrl: string | null;
  status: VerificationStatus;
  submittedAt: string;
  /**
   * userId ของแอดมินที่รับตรวจ (`start-review`) หรือที่ตัดสิน — `null` ตอนยังไม่มีใครรับ
   * ใบ UNDER_REVIEW ที่ค่านี้ไม่ใช่เรา แปลว่าแอดมินคนอื่นจองไว้แล้ว
   */
  reviewedBy: number | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
};

/** body ของ `POST /{id}/reject` — ตรงกับ `RejectVerificationRequest.java` */
export type RejectVerificationPayload = {
  /** `@NotBlank @Size(max = 255)` ผู้ขายเห็นข้อความนี้ ต้องบอกว่าให้แก้อะไร */
  reason: string;
};
