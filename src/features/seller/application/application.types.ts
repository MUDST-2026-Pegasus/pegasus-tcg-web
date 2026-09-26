/**
 * ลอกมาจาก `dto/VerificationRequest.java` และ `dto/VerificationResponse.java`
 * ใน `pegasus-tcg-api` ถ้าฝั่งนั้นแก้ ไฟล์นี้ต้องแก้ตาม
 */

export type VerificationStatus =
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED";

export type VerificationPayload = {
  legalFirstName: string;
  legalLastName: string;
  bankCode: string;
  bankName: string;
  /** พิมพ์มีขีดได้ backend ตัดเหลือแต่ตัวเลขก่อนเก็บ */
  bankAccountNumber: string;
  /** object key จาก `POST /uploads/presign` (purpose `SELLER_VERIFICATION`) */
  bankBookImageKey: string;
};

export type Verification = Omit<VerificationPayload, "bankBookImageKey"> & {
  id: number;
  /** `null` เฉพาะคำขอเก่าที่ส่งมาก่อนฟอร์มมีช่องรูป */
  bankBookImageKey: string | null;
  /** presigned GET อายุสั้น เปิดดูรูปได้ชั่วคราว — ห้ามเก็บไว้ใช้ภายหลัง */
  bankBookImageUrl: string | null;
  sellerProfileId: number;
  status: VerificationStatus;
  submittedAt: string;
  reviewedBy: number | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
};
