import {
  api,
  ApiError,
  CLIENT_ERROR_CODES,
  getErrorMessage,
  hasErrorCode,
  isNetworkError,
} from "@/lib/api";

import {
  describeTypes,
  formatFileSize,
  UPLOAD_RULES,
  validateFile,
  type UploadRule,
} from "./upload.rules";
import type {
  PresignUploadPayload,
  PresignUploadResponse,
  UploadPurpose,
} from "./upload.types";

/**
 * ไฟล์ไม่ผ่าน API ของเรา — ขอ presigned URL จาก `POST /uploads/presign` แล้ว PUT
 * ขึ้น object storage ตรง ๆ ได้ `objectKey` กลับมาส่งต่อให้ endpoint เจ้าของข้อมูล
 *
 * ไฟล์นี้ไม่มี React — component ใช้ผ่าน `useFileUpload()` ใน `@/hooks/use-file-upload`
 */

/** object storage ตอบ 4xx/5xx ตอน PUT — ส่วนใหญ่คือ presigned URL หมดอายุ (403) */
export const STORAGE_REJECTED = "STORAGE_REJECTED";

export function presignUpload(
  payload: PresignUploadPayload,
  signal?: AbortSignal,
): Promise<PresignUploadResponse> {
  return api.post<PresignUploadResponse>("/uploads/presign", payload, {
    signal,
  });
}

type PutOptions = {
  /** 0–1 */
  onProgress?: (fraction: number) => void;
  signal?: AbortSignal;
};

/**
 * PUT ไฟล์ขึ้น presigned URL — ใช้ XHR เพราะ `fetch` ยังรายงาน progress ขาอัปโหลดไม่ได้
 * ไม่แนบ `Authorization` (URL เซ็นมาแล้ว) และต้องส่ง `Content-Type` ให้ตรงกับไฟล์
 * เพราะ backend ตรวจชนิดจาก object ที่ขึ้นไปจริงตอนแนบ key
 */
export function putToStorage(
  uploadUrl: string,
  file: File,
  { onProgress, signal }: PutOptions = {},
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(abortedError());
      return;
    }

    const xhr = new XMLHttpRequest();
    const onAbort = () => xhr.abort();
    signal?.addEventListener("abort", onAbort, { once: true });

    const settle = (error?: ApiError) => {
      signal?.removeEventListener("abort", onAbort);
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    };

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress?.(event.loaded / event.total);
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(1);
        settle();
        return;
      }
      settle(
        new ApiError({
          status: xhr.status,
          code: STORAGE_REJECTED,
          message: "อัปโหลดไฟล์ไม่สำเร็จ",
        }),
      );
    };
    xhr.onerror = () =>
      settle(
        new ApiError({
          status: 0,
          code: CLIENT_ERROR_CODES.NETWORK_ERROR,
          message: "เชื่อมต่อที่เก็บไฟล์ไม่ได้ ตรวจสอบอินเทอร์เน็ตแล้วลองใหม่",
        }),
      );
    xhr.onabort = () => settle(abortedError());

    xhr.open("PUT", uploadUrl);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.send(file);
  });
}

function abortedError(): ApiError {
  return new ApiError({
    status: 0,
    code: CLIENT_ERROR_CODES.ABORTED,
    message: "ยกเลิกการอัปโหลดแล้ว",
  });
}

/**
 * presign → PUT → คืน `objectKey`
 *
 * URL หมดอายุ (storage ตอบ 403): ขอ URL ใหม่แล้วลองอีกครั้งเดียว ไม่วนไม่รู้จบ
 * — ขอใหม่ทุกครั้งที่เริ่ม ตัว URL จึงไม่เคยถูกเก็บไว้ใช้ซ้ำ
 *
 * @throws ApiError — `UNSUPPORTED_FILE_TYPE` / `FILE_TOO_LARGE` ถ้าไฟล์ผิดกติกา
 *         (ตรวจก่อนยิง), `ABORTED` เมื่อถูกยกเลิก, หรือ error จาก backend/storage
 */
export async function uploadFile(
  file: File,
  purpose: UploadPurpose,
  { onProgress, signal }: PutOptions = {},
): Promise<string> {
  const invalid = validateFile(file, UPLOAD_RULES[purpose]);
  if (invalid) {
    throw new ApiError({
      status: 400,
      code:
        file.size > UPLOAD_RULES[purpose].maxBytes
          ? "FILE_TOO_LARGE"
          : "UNSUPPORTED_FILE_TYPE",
      message: invalid,
    });
  }

  const attempt = async () => {
    const target = await presignUpload(
      { purpose, contentType: file.type, sizeBytes: file.size },
      signal,
    );
    onProgress?.(0);
    await putToStorage(target.uploadUrl, file, { onProgress, signal });
    return target.objectKey;
  };

  try {
    return await attempt();
  } catch (error) {
    if (
      hasErrorCode(error, STORAGE_REJECTED) &&
      error.status === 403 &&
      !signal?.aborted
    ) {
      return attempt();
    }
    throw error;
  }
}

/**
 * แปลง error จาก `uploadFile` เป็นข้อความที่ผู้ใช้อ่านรู้เรื่อง — ข้อความจาก backend
 * เป็นภาษาอังกฤษ จึงแปลเองเฉพาะเคสที่รู้จัก
 */
export function uploadErrorMessage(
  error: unknown,
  file: File,
  rule: UploadRule,
): string {
  if (hasErrorCode(error, "UNSUPPORTED_FILE_TYPE")) {
    return `ไฟล์ "${file.name}" เป็นชนิดที่ไม่รองรับ ใช้ได้เฉพาะ ${describeTypes(rule)}`;
  }
  if (hasErrorCode(error, "FILE_TOO_LARGE")) {
    return `ไฟล์ "${file.name}" ใหญ่เกิน ${formatFileSize(rule.maxBytes)}`;
  }
  if (hasErrorCode(error, "ACCESS_DENIED")) {
    return "บัญชีนี้ไม่มีสิทธิ์อัปโหลดไฟล์ประเภทนี้";
  }
  if (hasErrorCode(error, STORAGE_REJECTED)) {
    return "ที่เก็บไฟล์ไม่รับไฟล์นี้ ลองใหม่อีกครั้ง";
  }
  if (isNetworkError(error)) {
    return "เชื่อมต่อไม่ได้ ตรวจสอบอินเทอร์เน็ตแล้วลองใหม่";
  }
  return getErrorMessage(error, "อัปโหลดไม่สำเร็จ ลองใหม่อีกครั้ง");
}
