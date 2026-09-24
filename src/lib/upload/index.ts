/**
 * ชั้นอัปโหลดไฟล์ผ่าน presigned URL — ส่วนใหญ่ใช้ผ่าน `useFileUpload()` จาก
 * `@/hooks/use-file-upload` ก็พอ ดูวิธีใช้ใน `CONTRIBUTING.md` หัวข้อ "อัปโหลดไฟล์"
 */

export {
  presignUpload,
  putToStorage,
  STORAGE_REJECTED,
  uploadErrorMessage,
  uploadFile,
} from "./upload.api";
export {
  acceptFor,
  describeRule,
  describeTypes,
  formatFileSize,
  isAllowedType,
  normaliseContentType,
  UPLOAD_RULES,
  validateFile,
  type UploadRule,
} from "./upload.rules";
export type {
  PresignUploadPayload,
  PresignUploadResponse,
  UploadPurpose,
} from "./upload.types";
