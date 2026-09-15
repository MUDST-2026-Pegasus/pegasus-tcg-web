import { CircleCheck, CloudUpload } from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";

import { Button } from "@/components/ui/button";
import { FieldError, FieldLabel } from "@/components/ui/field";
import { cn } from "@/lib/utils";

import {
  BANK_BOOK_REQUIREMENTS,
  BANK_BOOK_TYPES,
} from "../application.constants";

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type BankBookUploadProps = {
  id: string;
  file?: File;
  error?: string;
  onFileChange: (file: File | undefined) => void;
};

/** ช่องวางรูปหน้าสมุดบัญชี + กล่องบอกว่าในรูปต้องเห็นอะไรบ้าง */
export function BankBookUpload({
  id,
  file,
  error,
  onFileChange,
}: BankBookUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // URL สร้างตอนเลือกไฟล์ แล้วคืนหน่วยความจำเมื่อเปลี่ยนรูปหรือออกจากหน้า
  useEffect(() => {
    if (!previewUrl) {
      return;
    }
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const selectFile = (next: File | undefined) => {
    if (next?.type.startsWith("image/")) {
      const url = URL.createObjectURL(next);
      // blob: URLs are safe — reject anything else defensively
      setPreviewUrl(url.startsWith("blob:") ? url : null);
    } else {
      setPreviewUrl(null);
    }
    onFileChange(next);
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const picked = event.target.files?.[0];
    if (picked) {
      selectFile(picked);
    }
    // ล้างค่าไว้ ไม่งั้นเลือกไฟล์เดิมซ้ำจะไม่เกิด change
    event.target.value = "";
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    // ลากผ่าน element ลูกก็ยิง dragleave — นับเฉพาะตอนออกนอกกรอบจริง
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setIsDragging(false);
    }
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const dropped = event.dataTransfer.files[0];
    if (dropped) {
      selectFile(dropped);
    }
  };

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
          JPG · PNG · ไม่เกิน 5 MB
        </span>
      </div>

      {/* อยู่นอกกรอบวางไฟล์ ไม่งั้น click ที่สั่งผ่าน ref จะวิ่งกลับขึ้นมาเปิดซ้ำ */}
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={BANK_BOOK_TYPES.join(",")}
        aria-invalid={Boolean(error)}
        className="sr-only"
        onChange={handleInputChange}
      />

      <div className="flex flex-col gap-3.5 sm:flex-row">
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "flex min-h-46 min-w-0 flex-1 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-[1.5px] border-dashed border-teal-600 bg-teal-50/70 p-5 text-center transition-colors hover:bg-teal-50",
            isDragging && "bg-teal-100/70 hover:bg-teal-100/70",
            error && "border-destructive bg-destructive/5 hover:bg-destructive/5",
          )}
        >
          {file ? (
            <>
              {previewUrl && (
                <img
                  src={previewUrl}
                  alt="ตัวอย่างรูปที่เลือก"
                  className="max-h-20 max-w-full rounded-md border border-border object-contain"
                />
              )}
              <p className="max-w-full truncate text-xs font-medium text-foreground">
                {file.name}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {formatFileSize(file.size)}
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8.5 rounded-sm px-2.5"
                >
                  เปลี่ยนไฟล์
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8.5 rounded-sm px-2.5 text-muted-foreground"
                  onClick={(event) => {
                    event.stopPropagation();
                    selectFile(undefined);
                  }}
                >
                  ลบไฟล์
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
        </div>

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

      {error && <FieldError className="text-xs">{error}</FieldError>}
    </div>
  );
}
