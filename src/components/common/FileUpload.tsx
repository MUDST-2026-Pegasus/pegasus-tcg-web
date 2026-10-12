import {
  CircleAlert,
  CircleCheck,
  CloudUpload,
  FileText,
  RotateCw,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { FileUploadState, UploadItem } from "@/hooks/use-file-upload";
import { formatFileSize } from "@/lib/upload";
import { cn } from "@/lib/utils";

import { FileDropzone } from "./FileDropzone";

type FileUploadProps = {
  /** ผลของ `useFileUpload()` — state อยู่ที่ผู้เรียก component นี้แค่วาดให้ */
  upload: FileUploadState;
  /** id ของ `<input type="file">` ให้ `FieldLabel htmlFor` ชี้มา */
  id?: string;
  title?: string;
  description?: string;
  invalid?: boolean;
  disabled?: boolean;
  className?: string;
};

/**
 * ช่องอัปโหลดไฟล์สำเร็จรูป — ลากวาง, ตัวอย่างรูป, progress, ยกเลิก, ลองใหม่, หลายไฟล์
 * ครอบ `useFileUpload()` ไว้ ถ้าต้องการหน้าตาเฉพาะให้ใช้ hook กับ `FileDropzone` เอง
 */
export function FileUpload({
  upload,
  id,
  title = "ลากไฟล์มาวางที่นี่ หรือ คลิกเพื่อเลือกไฟล์",
  description,
  invalid,
  disabled,
  className,
}: FileUploadProps) {
  const limit =
    upload.multiple && upload.maxFiles !== undefined
      ? ` · สูงสุด ${upload.maxFiles} ไฟล์`
      : "";

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <FileDropzone
        id={id}
        accept={upload.accept}
        multiple={upload.multiple}
        disabled={disabled}
        invalid={invalid}
        onFiles={upload.addFiles}
        className="flex min-h-36 flex-col items-center justify-center gap-2 rounded-lg border-[1.5px] border-dashed border-border bg-muted/30 p-5 text-center transition-colors hover:bg-muted/50 data-dragging:border-primary data-dragging:bg-primary/5 data-invalid:border-destructive data-invalid:bg-destructive/5"
      >
        <CloudUpload aria-hidden className="size-6 text-muted-foreground" />
        <p className="text-xs font-medium text-foreground">{title}</p>
        <p className="text-[11px] text-muted-foreground">
          {description ? `${description} · ` : ""}
          {upload.hint}
          {limit}
        </p>
        {/* click วิ่งขึ้นไปที่กรอบให้เปิดตัวเลือกไฟล์ ปุ่มนี้มีไว้ให้กดผ่านคีย์บอร์ดได้ */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          className="rounded-md px-2.5"
        >
          เลือกไฟล์
        </Button>
      </FileDropzone>

      {upload.items.length > 0 && (
        <ul className="flex flex-col gap-2">
          {upload.items.map((item) => (
            <FileUploadRow
              key={item.id}
              item={item}
              onRemove={() => upload.remove(item.id)}
              onRetry={() => upload.retry(item.id)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function FileUploadRow({
  item,
  onRemove,
  onRetry,
}: {
  item: UploadItem;
  onRemove: () => void;
  onRetry: () => void;
}) {
  const percent = Math.round(item.progress * 100);

  return (
    <li
      className={cn(
        "flex items-center gap-3 rounded-lg border border-border bg-background p-2.5",
        item.status === "error" && "border-destructive/40 bg-destructive/5",
      )}
    >
      <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted/40">
        {item.previewUrl ? (
          <img
            src={item.previewUrl}
            alt=""
            className="size-full object-cover"
          />
        ) : (
          <FileText aria-hidden className="size-5 text-muted-foreground" />
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="truncate text-xs font-medium text-foreground">
          {item.file.name}
        </p>
        {item.status === "uploading" && (
          <div className="flex items-center gap-2">
            <Progress
              value={percent}
              aria-label={`กำลังอัปโหลด ${item.file.name}`}
              className="flex-1 [&_[data-slot=progress-track]]:h-1.5"
            />
            <span className="text-[11px] text-muted-foreground tabular-nums">
              {percent}%
            </span>
          </div>
        )}
        {item.status === "done" && (
          <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <CircleCheck aria-hidden className="size-3.5 text-primary" />
            อัปโหลดแล้ว · {formatFileSize(item.file.size)}
          </p>
        )}
        {item.status === "error" && (
          <p
            role="alert"
            className="flex items-start gap-1 text-[11px] text-destructive"
          >
            <CircleAlert aria-hidden className="mt-px size-3.5 shrink-0" />
            {item.error}
          </p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {item.status === "error" && item.canRetry && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="rounded-md px-2"
            onClick={onRetry}
          >
            <RotateCw data-icon="inline-start" />
            ลองใหม่
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={
            item.status === "uploading"
              ? `ยกเลิกการอัปโหลด ${item.file.name}`
              : `ลบ ${item.file.name}`
          }
          onClick={onRemove}
        >
          <X />
        </Button>
      </div>
    </li>
  );
}
