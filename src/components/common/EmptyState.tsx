import { Inbox, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title: string;
  description?: string;
  /** ไอคอนจาก `lucide-react` ส่งตัว component มาเลย ไม่ต้อง render เอง */
  icon?: LucideIcon;
  /** ปุ่มที่พาไปสร้างข้อมูลชิ้นแรก เช่น "เพิ่มที่อยู่" */
  children?: ReactNode;
  className?: string;
};

/**
 * "ยังไม่มีข้อมูล" — ต่างจาก `ErrorState` ตรงที่นี่คือผลลัพธ์ที่ถูกต้อง
 * ไม่ใช่ความผิดพลาด จึงควรบอกด้วยว่าจะเริ่มต้นยังไง
 *
 * คนละเรื่องกับ `PagePlaceholder` ที่แปลว่า "หน้านี้ยังไม่ได้ทำ"
 */
export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  children,
  className,
}: EmptyStateProps) {
  return (
    <Empty className={cn("min-h-[40svh] border", className)}>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Icon />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        {description && <EmptyDescription>{description}</EmptyDescription>}
      </EmptyHeader>
      {children && (
        <EmptyContent className="flex-row justify-center">
          {children}
        </EmptyContent>
      )}
    </Empty>
  );
}
