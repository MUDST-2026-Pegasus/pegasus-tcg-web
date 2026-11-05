import { cn } from "@/lib/utils";

export type SaleBadgeType = "percent" | "flash" | "pegasus" | "shop";

const STYLE: Record<SaleBadgeType, string> = {
  percent: "bg-[#dc2626] font-bold text-white",
  flash: "bg-linear-to-r from-[#f97316] to-[#dc2626] font-black text-white",
  pegasus: "bg-[#e8f1fc] font-semibold text-[#0058bc]",
  shop: "bg-[#e6f6f4] font-semibold text-[#0f766e]",
};

const DEFAULT_LABEL: Record<Exclude<SaleBadgeType, "percent">, string> = {
  flash: "⚡ FLASH SALE",
  pegasus: "Pegasus ลดให้",
  shop: "ร้านลดเอง",
};

/**
 * Figma "SAL / Sale Badge" — Percent = "-N%" · Flash = แคมเปญ Flash Sale
 * Pegasus / Shop = ใครออกเงิน (แสดงฝั่งผู้ขาย/แอดมินเท่านั้น ผู้ซื้อไม่เห็น)
 */
export function SaleBadge({
  type,
  percent,
  label,
  className,
}: {
  type: SaleBadgeType;
  /** ใช้กับ `type="percent"` — ค่าจาก `pricing.discountPercent` */
  percent?: number | null;
  /** ข้อความแทนค่าเริ่มต้น เช่น "ลดทั้งหมวด" */
  label?: string;
  className?: string;
}) {
  const text = label ?? (type === "percent" ? `-${percent ?? 0}%` : DEFAULT_LABEL[type]);
  return (
    <span
      data-slot="sale-badge"
      data-type={type}
      className={cn(
        "inline-flex w-fit shrink-0 items-center rounded-full px-2 py-[3px] text-[11px] leading-none whitespace-nowrap",
        STYLE[type],
        className,
      )}
    >
      {text}
    </span>
  );
}
