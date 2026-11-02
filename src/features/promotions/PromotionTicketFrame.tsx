import type { ReactNode } from "react";
import notch from "@/assets/promotions/notch.svg";
import scallop from "@/assets/promotions/scallop.svg";
import { cn } from "@/lib/utils";

export type PromotionTicketFrameProps = {
  as?: "div" | "button";
  variant: "platform" | "shop";
  className?: string;
  stubClassName?: string;
  bodyClassName?: string;
  stub: ReactNode;
  body: ReactNode;
  scallopOffsets: number[];
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  "aria-pressed"?: boolean | "true" | "false" | "mixed";
  tabIndex?: number;
};

/** Shared coupon outline, notch and scallops for platform and shop codes. */
export function PromotionTicketFrame({
  as = "div",
  variant,
  className,
  stubClassName,
  bodyClassName,
  stub,
  body,
  scallopOffsets,
  onClick,
  disabled,
  type,
  "aria-pressed": ariaPressed,
  tabIndex,
}: PromotionTicketFrameProps) {
  const Component = as;
  const buttonProps =
    Component === "button"
      ? {
          type: type ?? "button",
          disabled,
          "aria-pressed": ariaPressed,
          tabIndex,
        }
      : { tabIndex };

  return (
    <Component
      onClick={onClick}
      {...buttonProps}
      className={cn(
        "relative flex h-[90px] w-full min-w-0 overflow-hidden rounded-[var(--radius-card)] border border-transparent bg-card text-left shadow-promotion-ticket ring-1 ring-promotion-ticket transition-colors",
        className,
      )}
    >
      <div
        className={cn(
          "flex w-[88px] shrink-0 flex-col items-center justify-center pl-2 pr-1 text-center text-white",
          variant === "shop"
            ? "bg-gradient-to-br from-promotion-shop-start via-promotion-shop-mid to-promotion-shop-end"
            : "bg-gradient-to-br from-promotion-platform-start via-promotion-platform-mid to-promotion-platform-end",
          stubClassName,
        )}
      >
        {stub}
      </div>
      <div
        className={cn(
          "flex min-w-0 flex-1 flex-col justify-center gap-1 border-l border-dashed border-border py-3 pr-3 pl-3.5",
          bodyClassName,
        )}
      >
        {body}
      </div>
      <img src={notch} alt="" className="pointer-events-none absolute -top-[9px] left-[79px] size-[18px]" />
      <img src={notch} alt="" className="pointer-events-none absolute -bottom-[9px] left-[79px] size-[18px]" />
      {scallopOffsets.map((offset) => (
        <img
          key={offset}
          src={scallop}
          alt=""
          className="pointer-events-none absolute -left-1 size-2"
          style={{ top: `calc(50% + ${offset}px)` }}
        />
      ))}
    </Component>
  );
}
