import { useLanguage } from "@/lib/language";
import { Flag } from "lucide-react";

import { cn } from "@/lib/utils";

/** ชิป amber ไอคอน Flag เช่น "บิดผิดปกติ", "ถูกรายงาน 3" [TCG-635 · FE-9] */
export function RiskFlag({ label, className }: { label: string; className?: string }) {
  useLanguage();
  return (
    <span
      className={cn(
        "inline-flex h-[18px] w-fit shrink-0 items-center gap-1 rounded-full bg-amber-100 px-2 text-[10px] leading-none font-semibold whitespace-nowrap text-amber-800",
        className,
      )}
    >
      <Flag aria-hidden className="size-3" />
      {label}
    </span>
  );
}
