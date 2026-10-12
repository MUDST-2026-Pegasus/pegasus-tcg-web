import { useState } from "react";

import { ImageOff, RefreshCw, Star, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

import type { CatalogImage } from "../catalog.types";

type CatalogImageTileProps = {
  image: CatalogImage;
  alt: string;
  /** ชื่อ variant เมื่อรูปนี้เป็นของ variant เดียว — `null` = ใช้ร่วมกันทุก variant */
  variantLabel: string | null;
  /** กำลังตั้งรูปหลัก/ลบรูปนี้อยู่ */
  isBusy: boolean;
  onMakePrimary: () => void;
  onDelete: () => void;
  /**
   * รูปโหลดไม่ขึ้น (เกือบทุกครั้งคือ signed URL หมดอายุ) — ผู้เรียกดึงสินค้าใหม่
   * แล้วส่ง `image.url` ตัวใหม่ลงมา
   */
  onExpired: () => Promise<unknown>;
};

/**
 * รูปหนึ่งใบในแท็บรูปภาพ พร้อมปุ่มตั้งเป็นรูปหลักและลบ
 *
 * URL หมดอายุ: ขอใหม่ให้เองหนึ่งครั้งต่อ URL ถ้ายังไม่ขึ้นค่อยโชว์ปุ่มให้กดเอง
 * ไม่วนขอใหม่ไม่รู้จบตอนไฟล์หายจริง (แบบเดียวกับ `BankBookImage`)
 */
export function CatalogImageTile({
  image,
  alt,
  variantLabel,
  isBusy,
  onMakePrimary,
  onDelete,
  onExpired,
}: CatalogImageTileProps) {
  const [retriedUrl, setRetriedUrl] = useState<string | null>(null);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refresh = () => {
    const current = image.url;
    setIsRefreshing(true);
    onExpired()
      .catch(() => undefined)
      .finally(() => {
        // ได้ URL ใหม่ = ไม่ตรงกับ `failedUrl` รูปใหม่ render ต่อได้เอง
        setFailedUrl(current);
        setIsRefreshing(false);
      });
  };

  const handleError = () => {
    if (retriedUrl === image.url) {
      setFailedUrl(image.url);
      return;
    }
    setRetriedUrl(image.url);
    refresh();
  };

  return (
    <li
      className={cn(
        "flex flex-col overflow-hidden rounded-lg border border-border bg-background",
        image.primary && "border-primary ring-1 ring-primary",
      )}
    >
      <div className="relative aspect-square bg-muted">
        {isRefreshing ? (
          <div className="flex size-full items-center justify-center">
            <Spinner className="size-5" />
          </div>
        ) : failedUrl === image.url ? (
          <div className="flex size-full flex-col items-center justify-center gap-2 p-3 text-center text-xs text-muted-foreground">
            <ImageOff className="size-5" aria-hidden />
            โหลดรูปไม่สำเร็จ
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-md px-2.5"
              onClick={refresh}
            >
              <RefreshCw data-icon="inline-start" />
              ลองใหม่
            </Button>
          </div>
        ) : (
          <img
            src={image.url}
            alt={image.altText ?? alt}
            onError={handleError}
            className="size-full object-contain"
          />
        )}

        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
          {image.primary ? (
            <Badge className="rounded-full">รูปหลัก</Badge>
          ) : null}
          {variantLabel ? (
            <Badge variant="secondary" className="rounded-full">
              {variantLabel}
            </Badge>
          ) : null}
        </div>
      </div>

      <div className="flex items-center justify-between gap-1 border-t border-border p-1.5">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="rounded-md px-2 text-xs"
          disabled={image.primary || isBusy}
          onClick={onMakePrimary}
        >
          {isBusy ? (
            <Spinner data-icon="inline-start" />
          ) : (
            <Star data-icon="inline-start" />
          )}
          {image.primary ? "รูปหลักอยู่แล้ว" : "ตั้งเป็นรูปหลัก"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="ลบรูปนี้"
          className="text-destructive hover:text-destructive"
          disabled={isBusy}
          onClick={onDelete}
        >
          <Trash2 />
        </Button>
      </div>
    </li>
  );
}
