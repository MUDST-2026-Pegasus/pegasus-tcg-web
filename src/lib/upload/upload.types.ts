/**
 * ลอกมาจาก `storage/UploadPurpose.java`, `dto/PresignUploadRequest.java`
 * และ `dto/PresignUploadResponse.java` ใน `pegasus-tcg-api` ถ้าฝั่งนั้นแก้ ไฟล์นี้ต้องแก้ตาม
 */

/** ไฟล์นี้เอาไปใช้ทำอะไร — ตัดสินทั้งโฟลเดอร์ปลายทาง ใครอัปได้ ชนิดไฟล์ และขนาดสูงสุด */
export type UploadPurpose =
  /** รูปการ์ดทางการในแคตตาล็อก — ADMIN */
  | "CATALOG_IMAGE"
  /** รูปการ์ดจริงของประกาศขาย — SELLER */
  | "LISTING_IMAGE"
  /** สลิปโอนเงินของผู้ซื้อ (รับ PDF ด้วย) */
  | "PAYMENT_SLIP"
  /** สลิปที่แอดมินแนบกับการจ่ายเงินผู้ขาย (รับ PDF ด้วย) — ADMIN */
  | "PAYOUT_SLIP"
  /** รูปของที่ได้รับ แนบกับคำขอคืนสินค้า (สูงสุด 10 MB) */
  | "RETURN_EVIDENCE"
  /** หลักฐานการส่งของ — SELLER */
  | "SHIPMENT_PROOF"
  /** รูปการ์ดในคอลเลกชันของตัวเอง */
  | "COLLECTION_IMAGE"
  /** รูปหน้าสมุดบัญชีตอนสมัครผู้ขาย — ผู้สมัครยังไม่มี role SELLER จึงไม่ล็อก role */
  | "SELLER_VERIFICATION";

/** body ของ `POST /uploads/presign` */
export type PresignUploadPayload = {
  purpose: UploadPurpose;
  /** `file.type` ของเบราว์เซอร์ */
  contentType: string;
  /** `file.size` ของเบราว์เซอร์ — backend ปฏิเสธก่อนออก URL ถ้าใหญ่เกิน */
  sizeBytes: number;
};

export type PresignUploadResponse = {
  /** ค่าที่ต้องส่งต่อให้ endpoint เจ้าของข้อมูล — เก็บค่านี้ ไม่ใช่ URL */
  objectKey: string;
  /** presigned PUT ไปที่ object storage ตรง ๆ หมดอายุตาม `expiresInSeconds` */
  uploadUrl: string;
  expiresInSeconds: number;
  maxBytes: number;
};
