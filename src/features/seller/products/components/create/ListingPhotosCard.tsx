import {
  CircleAlert,
  CloudUpload,
  ImageIcon,
  RotateCw,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { useFormState, useWatch, type UseFormReturn } from "react-hook-form";

import { FileDropzone } from "@/components/common";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FieldError } from "@/components/ui/field";
import { Progress } from "@/components/ui/progress";
import type { FileUploadState } from "@/hooks/use-file-upload";
import { cn } from "@/lib/utils";

import {
  MAX_LISTING_PHOTOS,
  type ListingFormValues,
} from "../../listing-form.schema";
import type { ListingPhoto } from "../../products.types";

type ListingPhotosCardProps = {
  form: UseFormReturn<ListingFormValues>;
  /** `useFileUpload({ purpose: "LISTING_IMAGE" })` ของหน้า — อยู่ที่หน้าเพื่อไม่ให้หลุดตอนเปลี่ยนขั้น */
  upload: FileUploadState;
  /** หน้าแก้ไข: รูปที่อยู่บนประกาศแล้ว (key → URL ที่เปิดดูได้) */
  existing?: ListingPhoto[];
};

/**
 * รูปจริงของการ์ดใบที่ขาย — อัปโหลดแล้วได้ object key (`LISTING_IMAGE`) เก็บใน `imageKeys`
 * ลำดับใน `imageKeys` คือลำดับบนหน้าประกาศ รูปแรกเป็นรูปหลัก (`ListingRequest`)
 *
 * หน้าแก้ไขต้องส่ง key ของรูปเดิมที่จะเก็บไว้กลับไปด้วย (`ListingDetailsRequest` เขียนทับทั้งชุด)
 */
export function ListingPhotosCard({
  form,
  upload,
  existing = [],
}: ListingPhotosCardProps) {
  const imageKeys = useWatch({ control: form.control, name: "imageKeys" });
  const { errors, isSubmitted } = useFormState({ control: form.control });
  const error = errors.imageKeys;

  const sourceOf = (key: string): string | null =>
    existing.find((photo) => photo.imageKey === key)?.url ??
    upload.items.find((item) => item.objectKey === key)?.previewUrl ??
    null;

  const pending = upload.items.filter((item) => item.status !== "done");
  const isFull = imageKeys.length >= MAX_LISTING_PHOTOS;

  function setKeys(next: string[]) {
    form.setValue("imageKeys", next, {
      shouldDirty: true,
      shouldValidate: isSubmitted,
    });
  }

  function removeKey(key: string) {
    const item = upload.items.find((candidate) => candidate.objectKey === key);
    setKeys(imageKeys.filter((candidate) => candidate !== key));
    if (item) upload.remove(item.id);
  }

  function makePrimary(key: string) {
    setKeys([key, ...imageKeys.filter((candidate) => candidate !== key)]);
  }

  return (
    <Card className="w-full gap-4 rounded-xl border border-border p-5 shadow-none ring-0">
      <div className="flex flex-col gap-[3px]">
        <h2 className="text-base font-semibold text-foreground">รูปการ์ดจริง</h2>
        <p className="text-xs text-gray-500">
          ถ่ายใบที่จะส่งจริง หน้า-หลัง และมุมที่มีตำหนิ · รูปแรกเป็นรูปหลักบนหน้าประกาศ ·
          สูงสุด {MAX_LISTING_PHOTOS} รูป
        </p>
      </div>

      {imageKeys.length > 0 ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {imageKeys.map((key, index) => {
            const src = sourceOf(key);
            const isPrimary = index === 0;
            return (
              <li
                key={key}
                className={cn(
                  "flex flex-col overflow-hidden rounded-lg border border-border bg-background",
                  isPrimary && "border-teal-600 ring-1 ring-teal-600",
                )}
              >
                <div className="relative aspect-square bg-muted">
                  {src ? (
                    <img
                      src={src}
                      alt={`รูปที่ ${index + 1}`}
                      className="size-full object-cover"
                    />
                  ) : (
                    <span className="flex size-full items-center justify-center">
                      <ImageIcon aria-hidden="true" className="size-5 text-slate-400" />
                    </span>
                  )}
                  {isPrimary ? (
                    <Badge className="absolute top-1.5 left-1.5 rounded-full">
                      รูปหลัก
                    </Badge>
                  ) : null}
                </div>
                <div className="flex items-center justify-between gap-1 p-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 rounded-md px-1.5 text-[11px]"
                    disabled={isPrimary}
                    onClick={() => makePrimary(key)}
                  >
                    <Star data-icon="inline-start" />
                    {isPrimary ? "รูปหลัก" : "ตั้งเป็นหลัก"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`เอารูปที่ ${index + 1} ออก`}
                    className="text-destructive hover:text-destructive"
                    onClick={() => removeKey(key)}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}

      {pending.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {pending.map((item) => {
            const percent = Math.round(item.progress * 100);
            return (
              <li
                key={item.id}
                className={cn(
                  "flex items-center gap-3 rounded-lg border border-border bg-background p-2.5",
                  item.status === "error" && "border-destructive/40 bg-destructive/5",
                )}
              >
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <p className="truncate text-xs font-medium text-foreground">
                    {item.file.name}
                  </p>
                  {item.status === "uploading" ? (
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
                  ) : (
                    <p role="alert" className="flex items-start gap-1 text-[11px] text-destructive">
                      <CircleAlert aria-hidden className="mt-px size-3.5 shrink-0" />
                      {item.error}
                    </p>
                  )}
                </div>
                {item.status === "error" && item.canRetry ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="rounded-md px-2"
                    onClick={() => upload.retry(item.id)}
                  >
                    <RotateCw data-icon="inline-start" />
                    ลองใหม่
                  </Button>
                ) : null}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={
                    item.status === "uploading"
                      ? `ยกเลิกการอัปโหลด ${item.file.name}`
                      : `เอา ${item.file.name} ออก`
                  }
                  onClick={() => upload.remove(item.id)}
                >
                  <X />
                </Button>
              </li>
            );
          })}
        </ul>
      ) : null}

      <FileDropzone
        id="listingPhotos"
        accept={upload.accept}
        multiple
        disabled={isFull}
        invalid={Boolean(error)}
        onFiles={upload.addFiles}
        className="flex min-h-32 flex-col items-center justify-center gap-2 rounded-lg border-[1.5px] border-dashed border-border bg-muted/30 p-5 text-center transition-colors hover:bg-muted/50 data-dragging:border-primary data-dragging:bg-primary/5 data-invalid:border-destructive"
      >
        <CloudUpload aria-hidden className="size-6 text-muted-foreground" />
        <p className="text-xs font-medium text-foreground">
          {isFull
            ? `ครบ ${MAX_LISTING_PHOTOS} รูปแล้ว เอารูปเดิมออกก่อนถ้าจะเพิ่ม`
            : "ลากรูปมาวางที่นี่ หรือ คลิกเพื่อเลือกรูป"}
        </p>
        <p className="text-[11px] text-muted-foreground">{upload.hint}</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isFull}
          className="rounded-md px-2.5"
        >
          เลือกรูป
        </Button>
      </FileDropzone>

      <FieldError errors={[error]} />
    </Card>
  );
}
