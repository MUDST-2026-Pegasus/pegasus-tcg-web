import {
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils";

type FileDropzoneProps = {
  /** id ของ `<input type="file">` — ให้ `FieldLabel htmlFor` ชี้มาที่นี่ */
  id?: string;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  onFiles: (files: File[]) => void;
  /**
   * กรอบวางไฟล์ — ตอนลากไฟล์ค้างอยู่เหนือกรอบจะมี `data-dragging`
   * ใช้ `data-dragging:bg-…` แต่งสีได้จาก className ของผู้เรียก
   */
  className?: string;
  children: ReactNode;
};

/**
 * กรอบลากวาง + คลิกเพื่อเลือกไฟล์ ไม่มีหน้าตาของตัวเอง — ผู้เรียกใส่ลูกและ className เอง
 * ใช้เป็นฐานของ `FileUpload` และช่องอัปโหลดที่มีดีไซน์เฉพาะ (เช่น `BankBookUpload`)
 *
 * ปุ่มข้างในกรอบไม่ต้องมี onClick — click วิ่งขึ้นมาที่กรอบแล้วเปิดตัวเลือกไฟล์ให้
 * ส่วนปุ่มที่ไม่อยากให้เปิด (เช่น "ลบไฟล์") ต้อง `event.stopPropagation()` เอง
 */
export function FileDropzone({
  id,
  accept,
  multiple,
  disabled,
  invalid,
  onFiles,
  className,
  children,
}: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(event.target.files ?? []);
    if (picked.length > 0) {
      onFiles(picked);
    }
    // ล้างค่าไว้ ไม่งั้นเลือกไฟล์เดิมซ้ำจะไม่เกิด change
    event.target.value = "";
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
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
    if (disabled) {
      return;
    }
    const dropped = Array.from(event.dataTransfer.files);
    if (dropped.length > 0) {
      onFiles(multiple ? dropped : dropped.slice(0, 1));
    }
  };

  return (
    <>
      {/* อยู่นอกกรอบวางไฟล์ ไม่งั้น click ที่สั่งผ่าน ref จะวิ่งกลับขึ้นมาเปิดซ้ำ */}
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        className="sr-only"
        onChange={handleInputChange}
      />
      <div
        onClick={() => {
          if (!disabled) {
            inputRef.current?.click();
          }
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        data-dragging={isDragging || undefined}
        data-invalid={invalid || undefined}
        data-disabled={disabled || undefined}
        data-testid="dropzone-container"
        className={cn(
          "cursor-pointer data-disabled:cursor-not-allowed data-disabled:opacity-60",
          className,
        )}
      >
        {children}
      </div>
    </>
  );
}
