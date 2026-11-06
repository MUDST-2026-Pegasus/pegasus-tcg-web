import { cn } from "@/lib/utils";

/** จุดโทษไม่ชำระ — จุดแดงตามจำนวนครั้ง ที่เหลือสีเทา + "{n}/3" [TCG-635 · FE-9] */
export function StrikeDots({ count, limit }: { count: number; limit: number }) {
  const filled = Math.min(Math.max(count, 0), limit);
  return (
    <span className="inline-flex items-center gap-1.5" aria-label={`ไม่ชำระ ${filled} จาก ${limit} ครั้ง`}>
      <span aria-hidden className="flex items-center gap-1">
        {Array.from({ length: limit }, (_, index) => (
          <span
            key={index}
            data-filled={index < filled || undefined}
            className={cn("size-2 rounded-full", index < filled ? "bg-destructive" : "bg-border")}
          />
        ))}
      </span>
      <span aria-hidden className={cn("text-xs font-semibold tabular-nums", filled > 0 ? "text-destructive" : "text-muted-foreground")}>
        {filled}/{limit}
      </span>
    </span>
  );
}
