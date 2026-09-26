import { Badge } from "@/components/ui/badge";

import type { AttributeDataType } from "../catalog.types";
import { ATTRIBUTE_TYPE_BADGE } from "../taxonomy.format";

/**
 * ป้ายบอกชนิดข้อมูลของฟิลด์ (text / number / enum / boolean / date)
 * ใช้ทั้งในตาราง schema และในการ์ด "ประเภทฟิลด์ที่รองรับ" — ดีไซน์ใช้สไตล์เดียวกันทั้งสองที่
 */
export function FieldTypeBadge({ type }: { type: AttributeDataType }) {
  return (
    <Badge className="h-5 rounded-[5px] bg-[#e8f1fc] px-2 text-[10px] font-medium text-[#0058bc]">
      {ATTRIBUTE_TYPE_BADGE[type]}
    </Badge>
  );
}
