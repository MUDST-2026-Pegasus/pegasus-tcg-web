import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { hasErrorCode } from "@/lib/api";
import {
  acceptFor,
  describeRule,
  UPLOAD_RULES,
  uploadErrorMessage,
  uploadFile,
  validateFile,
  type UploadPurpose,
  type UploadRule,
} from "@/lib/upload";

export type UploadStatus = "uploading" | "done" | "error";

export type UploadItem = {
  id: string;
  file: File;
  /** `blob:` URL ไว้โชว์ตัวอย่าง — `null` เมื่อไม่ใช่รูป (เช่น PDF) */
  previewUrl: string | null;
  status: UploadStatus;
  /** 0–1 */
  progress: number;
  /** มีค่าเมื่อ `status === "done"` — ส่งค่านี้ให้ endpoint เจ้าของข้อมูล */
  objectKey: string | null;
  /** ข้อความภาษาไทยพร้อมโชว์ เมื่อ `status === "error"` */
  error: string | null;
  /** `false` เมื่อพังเพราะตัวไฟล์เอง (ชนิด/ขนาด) — กดลองใหม่ก็ไม่ผ่าน ต้องเลือกไฟล์ใหม่ */
  canRetry: boolean;
};

export type UseFileUploadOptions = {
  purpose: UploadPurpose;
  /** เลือกได้หลายไฟล์ — ค่าเริ่มต้น `false` คือเลือกใหม่แล้วแทนไฟล์เดิม */
  multiple?: boolean;
  /** ใช้กับ `multiple` เท่านั้น — ไฟล์ที่เกินจะขึ้นเป็นรายการ error ให้เห็นว่าไม่ถูกรับ */
  maxFiles?: number;
  /**
   * เรียกทุกครั้งที่ชุด object key ที่อัปเสร็จแล้วเปลี่ยน เรียงตามลำดับที่เลือก
   * ต่อเข้า react-hook-form ตรงนี้ (`field.onChange` / `setValue`)
   */
  onChange?: (objectKeys: string[]) => void;
};

export type FileUploadState = {
  items: UploadItem[];
  /** รับจาก `<input type="file">` หรือ drop event ได้เลย ไฟล์ผิดกติกาจะขึ้นเป็น error */
  addFiles: (files: FileList | File[]) => void;
  /** ยกเลิก (ถ้ากำลังอัปอยู่) แล้วเอาออกจากรายการ */
  remove: (id: string) => void;
  /** อัปใหม่ด้วย presigned URL ตัวใหม่ — ใช้กับรายการที่ `canRetry` */
  retry: (id: string) => void;
  /** ยกเลิกและล้างทุกรายการ */
  clear: () => void;
  /** key ของไฟล์ที่อัปเสร็จแล้ว เรียงตามลำดับที่เลือก */
  objectKeys: string[];
  isUploading: boolean;
  multiple: boolean;
  maxFiles: number | undefined;
  rule: UploadRule;
  /** ค่า `accept` ของ `<input type="file">` */
  accept: string;
  /** "JPG · PNG · WEBP · ไม่เกิน 5 MB" */
  hint: string;
};

let nextId = 0;

function keysOf(items: UploadItem[]): string[] {
  return items.flatMap((item) => (item.objectKey ? [item.objectKey] : []));
}

function sameKeys(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((key, index) => key === b[index]);
}

/**
 * อัปโหลดไฟล์ผ่าน presigned URL — presign → PUT ตรงไปที่ object storage → ได้ object key
 *
 * เริ่มอัปทันทีที่เลือกไฟล์ ตอนกดส่งฟอร์ม key จึงพร้อมแล้ว ไม่ต้องรออัปอีกรอบ
 * หลายไฟล์อัปพร้อมกัน แต่ละไฟล์มี progress และยกเลิกได้ของมันเอง
 * ตรวจชนิด/ขนาดตาม `UPLOAD_RULES[purpose]` ก่อนยิง และขอ URL ใหม่ให้เองเมื่อหมดอายุ
 *
 * ```tsx
 * const photos = useFileUpload({
 *   purpose: "LISTING_IMAGE",
 *   multiple: true,
 *   maxFiles: 8,
 *   onChange: (keys) => setValue("imageKeys", keys),
 * });
 * <FileUpload upload={photos} />
 * ```
 */
export function useFileUpload({
  purpose,
  multiple = false,
  maxFiles,
  onChange,
}: UseFileUploadOptions): FileUploadState {
  const rule = UPLOAD_RULES[purpose];
  const [items, setItems] = useState<UploadItem[]>([]);

  // callback ของการอัปวิ่งหลัง render ไปนานแล้ว ต้องอ่านรายการล่าสุดจากตรงนี้
  // ไม่ใช่จาก `items` ที่ติดมากับ closure ตอนเริ่มอัป
  const store = useRef({
    items: [] as UploadItem[],
    controllers: new Map<string, AbortController>(),
  });

  const onChangeRef = useRef(onChange);
  useLayoutEffect(() => {
    onChangeRef.current = onChange;
  });

  // ออกจากหน้าแล้ว ไม่ต้องอัปต่อ และคืนหน่วยความจำของรูปตัวอย่าง
  useEffect(() => {
    const current = store.current;
    return () => {
      current.controllers.forEach((controller) => controller.abort());
      current.controllers.clear();
      current.items.forEach(revokePreview);
      current.items = [];
    };
  }, []);

  const commit = (next: UploadItem[]) => {
    const previousKeys = keysOf(store.current.items);
    store.current.items = next;
    setItems(next);
    const nextKeys = keysOf(next);
    if (!sameKeys(previousKeys, nextKeys)) {
      onChangeRef.current?.(nextKeys);
    }
  };

  const patch = (id: string, changes: Partial<UploadItem>) => {
    // รายการอาจถูกลบไปแล้วระหว่างรอ — ไม่เจอก็ไม่ทำอะไร
    if (store.current.items.some((item) => item.id === id)) {
      commit(
        store.current.items.map((item) =>
          item.id === id ? { ...item, ...changes } : item,
        ),
      );
    }
  };

  const start = (item: UploadItem) => {
    const controller = new AbortController();
    store.current.controllers.set(item.id, controller);

    uploadFile(item.file, purpose, {
      signal: controller.signal,
      onProgress: (progress) => patch(item.id, { progress }),
    })
      .then((objectKey) =>
        patch(item.id, { status: "done", progress: 1, objectKey }),
      )
      .catch((error: unknown) => {
        if (hasErrorCode(error, "ABORTED")) {
          return;
        }
        patch(item.id, {
          status: "error",
          error: uploadErrorMessage(error, item.file, rule),
          canRetry: !hasErrorCode(
            error,
            "UNSUPPORTED_FILE_TYPE",
            "FILE_TOO_LARGE",
          ),
        });
      })
      .finally(() => {
        if (store.current.controllers.get(item.id) === controller) {
          store.current.controllers.delete(item.id);
        }
      });
  };

  const drop = (targets: UploadItem[]) => {
    for (const item of targets) {
      store.current.controllers.get(item.id)?.abort();
      store.current.controllers.delete(item.id);
      revokePreview(item);
    }
  };

  const addFiles = (input: FileList | File[]) => {
    const picked = Array.from(input);
    if (picked.length === 0) {
      return;
    }

    let kept = store.current.items;
    if (!multiple) {
      // เลือกไฟล์เดียว = แทนของเดิม ยกเลิกตัวที่ค้างอยู่ด้วย
      drop(kept);
      kept = [];
    }

    let room =
      multiple && maxFiles !== undefined
        ? maxFiles - kept.filter((item) => item.status !== "error").length
        : Number.POSITIVE_INFINITY;

    const added: UploadItem[] = (multiple ? picked : picked.slice(0, 1)).map(
      (file) => {
        const invalid = validateFile(file, rule);
        const overLimit = !invalid && room <= 0;
        if (!invalid && !overLimit) {
          room -= 1;
        }
        const error =
          invalid ??
          (overLimit
            ? `เลือกได้สูงสุด ${maxFiles} ไฟล์ "${file.name}" จึงไม่ถูกเพิ่ม`
            : null);

        return {
          id: `upload-${(nextId += 1)}`,
          file,
          previewUrl:
            !error && file.type.startsWith("image/")
              ? URL.createObjectURL(file)
              : null,
          status: error ? "error" : "uploading",
          progress: 0,
          objectKey: null,
          error,
          canRetry: false,
        };
      },
    );

    commit([...kept, ...added]);
    added.filter((item) => item.status === "uploading").forEach(start);
  };

  const remove = (id: string) => {
    const target = store.current.items.find((item) => item.id === id);
    if (!target) {
      return;
    }
    drop([target]);
    commit(store.current.items.filter((item) => item.id !== id));
  };

  const retry = (id: string) => {
    const target = store.current.items.find((item) => item.id === id);
    if (!target?.canRetry) {
      return;
    }
    const restarted: UploadItem = {
      ...target,
      status: "uploading",
      progress: 0,
      error: null,
      canRetry: false,
    };
    commit(
      store.current.items.map((item) => (item.id === id ? restarted : item)),
    );
    start(restarted);
  };

  const clear = () => {
    drop(store.current.items);
    commit([]);
  };

  return {
    items,
    addFiles,
    remove,
    retry,
    clear,
    objectKeys: keysOf(items),
    isUploading: items.some((item) => item.status === "uploading"),
    multiple,
    maxFiles,
    rule,
    accept: acceptFor(rule),
    hint: describeRule(rule),
  };
}

function revokePreview(item: UploadItem) {
  if (item.previewUrl) {
    URL.revokeObjectURL(item.previewUrl);
  }
}
