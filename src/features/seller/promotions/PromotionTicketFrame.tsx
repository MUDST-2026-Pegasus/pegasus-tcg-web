import type { ReactNode } from "react";
import notch from "@/assets/promotions/notch.svg";
import scallop from "@/assets/promotions/scallop.svg";

type Props = {
  className: string;
  stubClassName: string;
  bodyClassName: string;
  stub: ReactNode;
  body: ReactNode;
  scallopOffsets: number[];
  scallopClassName?: string;
};

/** Coupon shape for the seller promotion card and form preview. */
export function PromotionTicketFrame({ className, stubClassName, bodyClassName, stub, body, scallopOffsets, scallopClassName = "pointer-events-none absolute -left-1 size-2" }: Props) {
  return <div className={className}>
    <div className={stubClassName}>{stub}</div>
    <div className={bodyClassName}>{body}</div>
    <img src={notch} alt="" className="pointer-events-none absolute -top-[9px] left-[79px] size-[18px]" />
    <img src={notch} alt="" className="pointer-events-none absolute -bottom-[9px] left-[79px] size-[18px]" />
    {scallopOffsets.map((offset) => <img key={offset} src={scallop} alt="" className={scallopClassName} style={{ top: `calc(50% + ${offset}px)` }} />)}
  </div>;
}
