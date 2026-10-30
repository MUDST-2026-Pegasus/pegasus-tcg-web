import { Trash2 } from "lucide-react";

import { FileUpload } from "@/components/common";
import { Button } from "@/components/ui/button";
import type { FileUploadState } from "@/hooks/use-file-upload";

type LogoUploadFieldProps = {
  /** ผลของ `useFileUpload({ purpose: "CATALOG_IMAGE" })` ที่ฟอร์มถือไว้ */
  upload: FileUploadState;
  /** id ของช่องเลือกไฟล์ ให้ `FieldLabel htmlFor` ชี้มา */
  id: string;
  /** ค่า `logoUrl` ในฟอร์มตอนนี้ — `""` = ไม่มีโลโก้ */
  value: string;
  /** โลโก้ที่บันทึกไว้แล้ว (ค่าดิบ + URL ที่เปิดได้) — ไม่ส่งมา = กำลังเพิ่มใหม่ */
  saved?: { logoUrl: string | null; logoImageUrl: string | null };
  onRemove: () => void;
};

/**
 * ช่องโลโก้ของเกม/ชุดการ์ด — อัปโหลดรูปแทนการวาง URL เหมือนรูปหมวดหมู่
 * ระหว่างที่ยังเป็นโลโก้เดิมโชว์รูปปัจจุบันพร้อมปุ่มเอาออก เลือกไฟล์ใหม่ได้หลังเอาออก
 */
export function LogoUploadField({
  upload,
  id,
  value,
  saved,
  onRemove,
}: LogoUploadFieldProps) {
  const showCurrent =
    Boolean(saved?.logoImageUrl) &&
    value !== "" &&
    value === saved?.logoUrl &&
    upload.items.length === 0;

  if (showCurrent) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-border p-2.5">
        <img
          src={saved?.logoImageUrl ?? undefined}
          alt=""
          className="size-14 rounded-md bg-white object-contain"
        />
        <p className="flex-1 text-xs text-muted-foreground">โลโก้ปัจจุบัน</p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-destructive"
          onClick={onRemove}
        >
          <Trash2 data-icon="inline-start" />
          เอารูปออก
        </Button>
      </div>
    );
  }

  return (
    <FileUpload
      upload={upload}
      id={id}
      title="ลากรูปมาวาง หรือคลิกเพื่อเลือกรูป"
    />
  );
}
