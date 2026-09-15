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
};

export type Verification = VerificationPayload & {
  id: number;
  sellerProfileId: number;
  status: VerificationStatus;
  submittedAt: string;
  reviewedBy: number | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
};
