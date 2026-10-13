import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

/** แถวดาว 5 ดวง เติมสีตามคะแนน (ปัดลงสำหรับค่าเฉลี่ย) */
export function ReviewStars({
  rating,
  className,
  starClassName = "size-[13px]",
}: {
  rating: number;
  className?: string;
  starClassName?: string;
}) {
  const filled = Math.floor(rating);
  return (
    <span role="img" aria-label={`${rating} จาก 5 ดาว`} className={cn("flex items-center gap-0.5", className)}>
      {[1, 2, 3, 4, 5].map((value) => (
        <Star
          key={value}
          aria-hidden="true"
          className={cn(
            starClassName,
            value <= filled ? "fill-[#f59e0a] text-[#f59e0a]" : "fill-[#e3e7e8] text-[#e3e7e8]",
          )}
        />
      ))}
    </span>
  );
}
