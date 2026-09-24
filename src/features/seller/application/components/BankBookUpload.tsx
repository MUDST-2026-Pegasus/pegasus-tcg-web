import { CircleCheck, CloudUpload, RotateCw } from "lucide-react";

import { FileDropzone } from "@/components/common";
import { Button } from "@/components/ui/button";
import { FieldError, FieldLabel } from "@/components/ui/field";
import { Progress } from "@/components/ui/progress";
import type { FileUploadState } from "@/hooks/use-file-upload";
import { formatFileSize } from "@/lib/upload";

import { BANK_BOOK_REQUIREMENTS } from "../application.constants";

type BankBookUploadProps = {
  id: string;
  /** `useFileUpload({ purpose: "SELLER_VERIFICATION" })` ของฟอร์ม */
  upload: FileUploadState;
  /** error ของฟอร์ม เช่น ยังไม่ได้แนบรูป หรือ backend ไม่รับ key */
  error?: string;
};

/**
 * ช่องวางรูปหน้าสมุดบัญชี + กล่องบอกว่าในรูปต้องเห็นอะไรบ้าง
 *
 * เลือกรูปแล้วอัปขึ้น object storage ทันทีผ่าน `useFileUpload()` ตอนกดส่งฟอร์ม
 * จึงมีแค่ object key ที่ต้องส่งไปกับคำขอ
 */
export function BankBookUpload({ id, upload, error }: BankBookUploadProps) {
  const item = upload.items[0];
  const message = item?.error ?? error;
  const percent = Math.round((item?.progress ?? 0) * 100);

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <FieldLabel
          htmlFor={id}
          className="text-xs font-medium text-foreground/80"
        >
          รูปหน้าสมุดบัญชี หรือ หน้าแอปธนาคาร *
        </FieldLabel>
        <span className="ml-auto text-[10px] text-muted-foreground/75">
          {upload.hint}
        </span>
      </div>

      <div className="flex flex-col gap-3.5 sm:flex-row">
        <FileDropzone
          id={id}
          accept={upload.accept}
          invalid={Boolean(message)}
          onFiles={upload.addFiles}
          className="flex min-h-46 min-w-0 flex-1 flex-col items-center justify-center gap-2 rounded-lg border-[1.5px] border-dashed border-teal-600 bg-teal-50/70 p-5 text-center transition-colors hover:bg-teal-50 data-dragging:bg-teal-100/70 data-dragging:hover:bg-teal-100/70 data-invalid:border-destructive data-invalid:bg-destructive/5 data-invalid:hover:bg-destructive/5"
        >
          {item ? (
            <>
              {item.previewUrl && (
                <img
                  src={item.previewUrl}
                  alt="ตัวอย่างรูปที่เลือก"
                  className="max-h-20 max-w-full rounded-md border border-border object-contain"
                />
              )}
              <p className="max-w-full truncate text-xs font-medium text-foreground">
                {item.file.name}
              </p>

              {item.status === "uploading" ? (
                <div className="flex w-full max-w-48 items-center gap-2">
                  <Progress
                    value={percent}
                    aria-label="กำลังอัปโหลดรูปหน้าสมุดบัญชี"
                    className="flex-1 [&_[data-slot=progress-track]]:h-1.5"
                  />
                  <span className="text-[10px] text-muted-foreground tabular-nums">
                    {percent}%
                  </span>
                </div>
              ) : item.status === "done" ? (
                <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <CircleCheck aria-hidden className="size-3 text-teal-600" />
                  อัปโหลดแล้ว · {formatFileSize(item.file.size)}
                </p>
              ) : (
                <p className="text-[10px] text-muted-foreground">
                  {formatFileSize(item.file.size)}
                </p>
              )}

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8.5 rounded-sm px-2.5"
                >
                  เปลี่ยนไฟล์
                </Button>
                {item.status === "error" && item.canRetry && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8.5 rounded-sm px-2.5"
                    onClick={(event) => {
                      event.stopPropagation();
                      upload.retry(item.id);
                    }}
                  >
                    <RotateCw data-icon="inline-start" />
                    ลองใหม่
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8.5 rounded-sm px-2.5 text-muted-foreground"
                  onClick={(event) => {
                    event.stopPropagation();
                    upload.remove(item.id);
                  }}
                >
                  {item.status === "uploading" ? "ยกเลิก" : "ลบไฟล์"}
                </Button>
              </div>
            </>
          ) : (
            <>
              <span className="flex size-6.5 items-center justify-center">
                <CloudUpload aria-hidden className="size-6 text-teal-600" />
              </span>
              <p className="text-xs font-medium text-teal-600">
                ลากรูปมาวางที่นี่ หรือ คลิกเพื่อเลือกไฟล์
              </p>
              <p className="text-[10px] text-muted-foreground">
                ถ่ายจากหน้าแอปธนาคารก็ได้ ไม่ต้องเป็นสมุดบัญชีเล่มจริง
              </p>
              {/* click วิ่งขึ้นไปที่กรอบให้เปิดตัวเลือกไฟล์ ปุ่มนี้มีไว้ให้กดผ่านคีย์บอร์ดได้ */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8.5 rounded-sm px-2.5"
              >
                เลือกไฟล์
              </Button>
            </>
          )}
        </FileDropzone>

        <div className="flex flex-col gap-2.25 rounded-lg border border-border bg-muted/30 px-3.5 py-4 sm:w-62.5">
          <p className="text-[11px] font-medium text-foreground/80">
            ในรูปต้องเห็นชัด
          </p>
          <ul className="flex flex-col gap-2.25">
            {BANK_BOOK_REQUIREMENTS.map((requirement) => (
              <li
                key={requirement}
                className="flex items-center gap-2 text-[11px] text-muted-foreground"
              >
                <CircleCheck
                  aria-hidden
                  className="size-3.5 shrink-0 text-teal-600"
                />
                {requirement}
              </li>
            ))}
          </ul>
          <p className="text-[10px] text-muted-foreground/75">
            ปิดหรือขีดฆ่าข้อมูลอื่นที่ไม่เกี่ยวข้องได้
          </p>
        </div>
      </div>

      {message && <FieldError className="text-xs">{message}</FieldError>}
    </div>
  );
}
