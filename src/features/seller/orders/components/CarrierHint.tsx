import { Check, Info, TriangleAlert } from "lucide-react";

import { cn } from "@/lib/utils";

import { buyerCarrierCode, carrierLabel, type CarrierMatch } from "../orders.format";
import type { ShippingChoice } from "../orders.types";

type CarrierHintProps = {
  match: CarrierMatch;
  choice: ShippingChoice | null;
};

/** บรรทัดเล็กใต้ช่องขนส่ง บอกว่าค่าที่เลือกตรงกับที่ผู้ซื้อเลือกหรือไม่ */
export function CarrierHint({ match, choice }: CarrierHintProps) {
  if (match === null) return null;

  const buyerCode = buyerCarrierCode(choice);
  const { Icon, tone, text } = {
    matches: {
      Icon: Check,
      tone: "text-teal-600",
      text: "เลือกให้ตามที่ผู้ซื้อเลือก · เปลี่ยนได้ถ้าส่งด้วยขนส่งอื่น",
    },
    differs: {
      Icon: TriangleAlert,
      tone: "text-[#b45309]",
      text: `ไม่ตรงกับที่ผู้ซื้อเลือก (${buyerCode ? carrierLabel(buyerCode) : ""}) — ผู้ซื้อจะเห็นขนส่งที่คุณยืนยัน`,
    },
    unset: {
      Icon: Info,
      tone: "text-gray-500",
      text: "ตัวเลือกนี้ไม่ได้ระบุบริษัทขนส่ง — เลือกขนส่งที่ใช้จริงก่อนยืนยัน",
    },
  }[match];

  return (
    <p className={cn("flex items-start gap-1 text-[11px]", tone)}>
      <Icon aria-hidden="true" className="mt-px size-3 shrink-0" />
      <span className="flex-1">{text}</span>
    </p>
  );
}
