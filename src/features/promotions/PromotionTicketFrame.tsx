import type { ReactNode } from "react";
import notch from "@/assets/promotions/notch.svg";
import scallop from "@/assets/promotions/scallop.svg";
import { cn } from "@/lib/utils";

type Props = {
  variant: "platform" | "shop";
  className?: string;
  stubClassName?: string;
  bodyClassName?: string;
  stub: ReactNode;
  body: ReactNode;
  scallopOffsets: number[];
};

/** Shared coupon outline, notch and scallops for platform and shop codes. */
export function PromotionTicketFrame({
  variant, className, stubClassName, bodyClassName, stub, body, scallopOffsets,
}: Props) {
  return (
    <div className={cn(
      "relative flex h-[92px] w-full min-w-0 overflow-hidden rounded-xl bg-card shadow-sm ring-1 ring-border",
      className,
    )}>
      <div className={cn(
        "flex w-[88px] shrink-0 flex-col items-center justify-center px-1 text-center text-white",
        variant === "shop"
          ? "bg-gradient-to-br from-teal-800 via-teal-600 to-teal-400"
          : "bg-gradient-to-br from-blue-900 via-primary to-sky-500",
        stubClassName,
      )}>{stub}</div>
      <div className={cn(
        "flex min-w-0 flex-1 flex-col justify-center gap-1 border-l border-dashed border-border px-3 py-2",
        bodyClassName,
      )}>{body}</div>
      <img src={notch} alt="" className="pointer-events-none absolute -top-[9px] left-[79px] size-[18px]" />
      <img src={notch} alt="" className="pointer-events-none absolute -bottom-[9px] left-[79px] size-[18px]" />
      {scallopOffsets.map((offset) => (
        <img key={offset} src={scallop} alt="" className="pointer-events-none absolute -left-1 size-2"
          style={{ top: `calc(50% + ${offset}px)` }} />
      ))}
    </div>
  );
}
