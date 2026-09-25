import { useId } from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { usePublishPermission } from "./seller.queries";

type CreateListingButtonProps = {
  label: string;
};

/**
 * ปุ่ม "ลงขายสินค้า" ที่ใช้ทั้งแดชบอร์ดและหน้าจัดการสินค้า
 * ร้านที่ยังลงขายไม่ได้ (`canPublish = false`) เห็นปุ่มเป็นสีจางพร้อมเหตุผล
 * ปุ่มที่ disabled ไม่รับ hover/focus จึงให้ span ที่ห่อไว้เป็นตัวเปิด tooltip แทน
 */
export function CreateListingButton({ label }: CreateListingButtonProps) {
  const { canPublish, reason } = usePublishPermission();
  const reasonId = useId();

  if (canPublish) {
    return (
      <Button
        size="sm"
        className="rounded-md px-2.5"
        render={<Link to="/seller/products/new" />}
        nativeButton={false}
      >
        {label}
      </Button>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger
        render={<span tabIndex={0} aria-describedby={reasonId} />}
      >
        <Button size="sm" className="rounded-md px-2.5" disabled>
          {label}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{reason}</TooltipContent>
      <span id={reasonId} className="sr-only">
        {reason}
      </span>
    </Tooltip>
  );
}
