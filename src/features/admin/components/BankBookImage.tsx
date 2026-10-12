import { ImageOff, Maximize2, RefreshCw } from "lucide-react";
import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";

type BankBookImageProps = {
  /** presigned GET อายุสั้นจาก `bankBookImageUrl` — `null` = ใบนี้ไม่มีรูป */
  url: string | null;
  /**
   * เรียกตอนรูปโหลดไม่ขึ้น (เกือบทุกครั้งคือ signed URL หมดอายุ) ให้ผู้เรียกดึงใบนี้ใหม่
   * แล้วส่ง `url` ตัวใหม่ลงมา
   */
  onExpired: () => Promise<unknown>;
};

/**
 * รูปหน้าสมุดบัญชีที่ผู้สมัครแนบมา ให้ผู้ตรวจเทียบกับชื่อ-เลขบัญชีที่กรอก
 *
 * กดแล้วขยายใน dialog ไม่เปิดแท็บใหม่ — signed URL จะได้ไม่ไปค้างในแถบที่อยู่
 * หรือประวัติของเบราว์เซอร์ (PII)
 *
 * URL หมดอายุ: ลองขอใหม่ให้เองหนึ่งครั้งต่อ URL ถ้ายังไม่ขึ้นค่อยโชว์ปุ่มให้กดเอง
 * ไม่วนขอใหม่ไม่รู้จบตอนไฟล์หายจริง
 */
export function BankBookImage({ url, onExpired }: BankBookImageProps) {
  const [expanded, setExpanded] = useState(false);
  const [retriedUrl, setRetriedUrl] = useState<string | null>(null);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refresh = (current: string) => {
    setIsRefreshing(true);
    onExpired()
      .catch(() => undefined)
      // ได้ URL ใหม่มา ตัวเดิมจะไม่ตรงกับ `url` อีก รูปใหม่จึง render ต่อได้เอง
      // ถ้าได้ตัวเดิมกลับมา (ใบนั้นย้ายสถานะไปแล้ว) ก็ตกไปที่หน้าจอ "โหลดไม่สำเร็จ"
      .finally(() => {
        setFailedUrl(current);
        setIsRefreshing(false);
      });
  };

  const handleError = () => {
    if (!url) {
      return;
    }
    if (retriedUrl === url) {
      setFailedUrl(url);
      return;
    }
    setRetriedUrl(url);
    refresh(url);
  };

  if (!url) {
    return (
      <Placeholder>
        <ImageOff className="size-5" aria-hidden />
        คำขอนี้ส่งมาก่อนระบบรับรูปสมุดบัญชี จึงไม่มีรูปแนบ
      </Placeholder>
    );
  }

  if (isRefreshing) {
    return (
      <Placeholder>
        <Spinner className="size-5" />
        กำลังขอรูปใหม่…
      </Placeholder>
    );
  }

  if (failedUrl === url) {
    return (
      <Placeholder>
        <ImageOff className="size-5" aria-hidden />
        โหลดรูปไม่สำเร็จ
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-md px-2.5"
          onClick={() => refresh(url)}
        >
          <RefreshCw data-icon="inline-start" />
          ลองอีกครั้ง
        </Button>
      </Placeholder>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="group relative flex h-48 w-full items-center justify-center overflow-hidden rounded-lg border border-border bg-muted/40"
      >
        <img
          src={url}
          alt="รูปหน้าสมุดบัญชีที่ผู้สมัครแนบมา"
          referrerPolicy="no-referrer"
          onError={handleError}
          className="max-h-full max-w-full object-contain"
        />
        <span className="absolute right-2 bottom-2 flex items-center gap-1 rounded-md bg-background/90 px-2 py-1 text-[11px] text-muted-foreground shadow-sm group-hover:text-foreground">
          <Maximize2 className="size-3" aria-hidden />
          คลิกเพื่อดูขนาดเต็ม
        </span>
      </button>

      <Dialog open={expanded} onOpenChange={setExpanded}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>รูปหน้าสมุดบัญชี</DialogTitle>
            <DialogDescription>
              เทียบชื่อบัญชีและเลขบัญชีในรูปกับข้อมูลที่ผู้สมัครกรอก
            </DialogDescription>
          </DialogHeader>
          <img
            src={url}
            alt="รูปหน้าสมุดบัญชีที่ผู้สมัครแนบมา ขนาดเต็ม"
            referrerPolicy="no-referrer"
            onError={handleError}
            className="max-h-[70svh] w-full rounded-md object-contain"
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

function Placeholder({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-48 w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 p-4 text-center text-xs text-muted-foreground">
      {children}
    </div>
  );
}
