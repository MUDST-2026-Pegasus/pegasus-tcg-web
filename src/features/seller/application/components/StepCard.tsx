import type { ReactNode } from "react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StepCardProps = {
  step: number;
  title: string;
  hint: string;
  className?: string;
  children: ReactNode;
};

/** การ์ดหนึ่งขั้นของฟอร์ม — เลขขั้นกับหัวข้อชิดซ้าย คำอธิบายสั้น ๆ ชิดขวา */
export function StepCard({
  step,
  title,
  hint,
  className,
  children,
}: StepCardProps) {
  return (
    <Card
      className={cn(
        "gap-4 rounded-xl border border-border p-5 shadow-none ring-0",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-2.5">
        <span
          aria-hidden
          className="flex size-6 shrink-0 items-center justify-center rounded-full bg-teal-600 text-[11px] font-bold text-white"
        >
          {step}
        </span>
        <h2 className="text-[15px] font-semibold text-foreground">{title}</h2>
        <p className="ml-auto text-[11px] text-muted-foreground/75">{hint}</p>
      </div>
      {children}
    </Card>
  );
}
