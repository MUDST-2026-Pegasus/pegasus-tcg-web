import type { UploadPurpose } from "./upload.types";

/**
 * กติกาชนิด/ขนาดไฟล์ของแต่ละ purpose — ลอกจาก `storage/UploadPurpose.java`
 * ตรวจฝั่งเว็บก่อนขอ presign ผู้ใช้จะได้รู้ทันทีโดยไม่ต้องเสียรอบไป backend
 * (backend ยังตรวจซ้ำเองทั้งตอน presign และตอนแนบ key เสมอ)
 */

const MB = 1024 * 1024;

const IMAGES = ["image/jpeg", "image/png", "image/webp"] as const;
const DOCUMENTS = [...IMAGES, "application/pdf"] as const;

export type UploadRule = {
  contentTypes: readonly string[];
  maxBytes: number;
};

export const UPLOAD_RULES: Record<UploadPurpose, UploadRule> = {
  CATALOG_IMAGE: { contentTypes: IMAGES, maxBytes: 5 * MB },
  LISTING_IMAGE: { contentTypes: IMAGES, maxBytes: 5 * MB },
  PAYMENT_SLIP: { contentTypes: DOCUMENTS, maxBytes: 5 * MB },
  PAYOUT_SLIP: { contentTypes: DOCUMENTS, maxBytes: 5 * MB },
  RETURN_EVIDENCE: { contentTypes: IMAGES, maxBytes: 10 * MB },
  SHIPMENT_PROOF: { contentTypes: IMAGES, maxBytes: 5 * MB },
  COLLECTION_IMAGE: { contentTypes: IMAGES, maxBytes: 5 * MB },
  SELLER_VERIFICATION: { contentTypes: IMAGES, maxBytes: 5 * MB },
  AVATAR_IMAGE: { contentTypes: IMAGES, maxBytes: 5 * MB },
};

const TYPE_LABELS: Record<string, string> = {
  "image/jpeg": "JPG",
  "image/png": "PNG",
  "image/webp": "WEBP",
  "application/pdf": "PDF",
};

/** เหมือน `UploadPurpose.normalise` — ตัด `; charset=…` แล้วทำเป็นตัวเล็ก */
export function normaliseContentType(contentType: string): string {
  return contentType.split(";")[0].trim().toLowerCase();
}

export function formatFileSize(bytes: number): string {
  if (bytes < MB) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }
  return `${(bytes / MB).toFixed(1).replace(/\.0$/, "")} MB`;
}

/** "JPG, PNG หรือ WEBP" */
export function describeTypes(rule: UploadRule): string {
  const labels = rule.contentTypes.map((type) => TYPE_LABELS[type] ?? type);
  return labels.length > 1
    ? `${labels.slice(0, -1).join(", ")} หรือ ${labels.at(-1)}`
    : labels.join("");
}

/** "JPG · PNG · WEBP · ไม่เกิน 5 MB" — บรรทัดใบ้ข้างช่องอัปโหลด */
export function describeRule(rule: UploadRule): string {
  const labels = rule.contentTypes.map((type) => TYPE_LABELS[type] ?? type);
  return [...labels, `ไม่เกิน ${formatFileSize(rule.maxBytes)}`].join(" · ");
}

/** ค่า `accept` ของ `<input type="file">` */
export function acceptFor(rule: UploadRule): string {
  return rule.contentTypes.join(",");
}

export function isAllowedType(rule: UploadRule, contentType: string): boolean {
  return rule.contentTypes.includes(normaliseContentType(contentType));
}

/**
 * @returns ข้อความภาษาไทยที่บอกว่าผิดตรงไหนและต้องแก้ยังไง หรือ `null` ถ้าไฟล์ผ่าน
 */
export function validateFile(file: File, rule: UploadRule): string | null {
  if (!isAllowedType(rule, file.type)) {
    return `ไฟล์ "${file.name}" เป็นชนิดที่ไม่รองรับ ใช้ได้เฉพาะ ${describeTypes(rule)}`;
  }
  if (file.size === 0) {
    return `ไฟล์ "${file.name}" ว่างเปล่า ลองเลือกไฟล์ใหม่`;
  }
  if (file.size > rule.maxBytes) {
    return `ไฟล์ "${file.name}" ขนาด ${formatFileSize(file.size)} ใหญ่เกิน ${formatFileSize(rule.maxBytes)}`;
  }
  return null;
}
