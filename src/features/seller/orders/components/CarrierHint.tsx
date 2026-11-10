import { Check, Info, TriangleAlert } from "lucide-react";

import { cn } from "@/lib/utils";

import { buyerCarrierCode, carrierLabel, type CarrierMatch } from "../orders.format";
import type { ShippingChoice } from "../orders.types";
import { useTranslate } from "@/lib/i18n";

type CarrierHintProps = {
  match: CarrierMatch;
  choice: ShippingChoice | null;
};

/** บรรทัดเล็กใต้ช่องขนส่ง บอกว่าค่าที่เลือกตรงกับที่ผู้ซื้อเลือกหรือไม่ */
export function CarrierHint({ match, choice }: CarrierHintProps) {
  const { t } = useTranslate("seller");
  if (match === null) return null;

  const buyerCode = buyerCarrierCode(choice);
  const { Icon, tone, text } = {
    matches: {
      Icon: Check,
      tone: "text-teal-600",
      text: t("orders.carrierHint.matches", "เลือกให้ตามที่ผู้ซื้อเลือก · เปลี่ยนได้ถ้าส่งด้วยขนส่งอื่น"),
    },
    differs: {
      Icon: TriangleAlert,
      tone: "text-[#b45309]",
      text: t("orders.carrierHint.differs", "ไม่ตรงกับที่ผู้ซื้อเลือก ({carrier}) — ผู้ซื้อจะเห็นขนส่งที่คุณยืนยัน", { carrier: buyerCode ? carrierLabel(buyerCode) : "" }),
    },
    unset: {
      Icon: Info,
      tone: "text-gray-500",
      text: t("orders.carrierHint.unset", "ตัวเลือกนี้ไม่ได้ระบุบริษัทขนส่ง — เลือกขนส่งที่ใช้จริงก่อนยืนยัน"),
    },
  }[match];

  return (
    <p className={cn("flex items-start gap-1 text-[11px]", tone)}>
      <Icon aria-hidden="true" className="mt-px size-3 shrink-0" />
      <span className="flex-1">{text}</span>
    </p>
  );
}
