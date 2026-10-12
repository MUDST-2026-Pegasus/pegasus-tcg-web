import { RotateCw, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { getErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";

type ErrorStateProps = {
  /** error ที่ได้จาก query/mutation — ถ้าเป็น `ApiError` จะหยิบข้อความจาก backend มาแสดง */
  error?: unknown;
  title?: string;
  /** ข้อความสำรอง ใช้เมื่อ error ไม่มีข้อความของตัวเอง */
  fallbackMessage?: string;
  /** ใส่เมื่อลองใหม่ได้จริง เช่น `refetch` ของ query — ไม่ใส่ = ไม่ต้องมีปุ่ม */
  onRetry?: () => void;
  retryLabel?: string;
  /** ปุ่มหรือลิงก์เพิ่มเติม วางต่อจากปุ่มลองใหม่ */
  children?: ReactNode;
  className?: string;
};

/**
 * หน้าจอ "โหลดไม่สำเร็จ" ที่ทุกหน้าใช้ร่วมกัน
 *
 * ใช้กับ error ที่ทำให้ทั้งบล็อกแสดงผลไม่ได้ ส่วน error ของฟอร์มหรือปุ่มเดี่ยว ๆ
 * ให้แปะไว้ใกล้ช่องที่ผิดแทน (`applyApiErrors` จาก `@/lib/form`)
 */
export function ErrorState({
  error,
  title = "โหลดข้อมูลไม่สำเร็จ",
  fallbackMessage = "ลองใหม่อีกครั้ง หรือรีเฟรชหน้านี้",
  onRetry,
  retryLabel = "ลองใหม่",
  children,
  className,
}: ErrorStateProps) {
  return (
    <Empty className={cn("min-h-[40svh] border", className)}>
      <EmptyHeader>
        <EmptyMedia variant="icon" className="text-destructive">
          <TriangleAlert />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>
          {getErrorMessage(error, fallbackMessage)}
        </EmptyDescription>
      </EmptyHeader>
      {(onRetry || children) && (
        <EmptyContent className="flex-row justify-center">
          {onRetry && (
            <Button variant="outline" onClick={onRetry}>
              <RotateCw data-icon="inline-start" /> {retryLabel}
            </Button>
          )}
          {children}
        </EmptyContent>
      )}
    </Empty>
  );
}
