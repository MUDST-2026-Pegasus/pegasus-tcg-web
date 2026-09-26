import type { ListingDraft, ReadinessId } from "./product-create.types";
import { toNumber } from "./products.format";

/** สถานะแต่ละข้อของการ์ด "พร้อมลงขายหรือยัง" */
export function getReadiness(draft: ListingDraft): Record<ReadinessId, boolean> {
  const price = toNumber(draft.price);
  const cost = toNumber(draft.cost);
  const quantity = toNumber(draft.quantity);

  return {
    // มาถึงขั้นนี้ได้แปลว่าเลือกการ์ดในขั้นแรกมาแล้ว
    card: true,
    condition: draft.condition !== null,
    pricing: price !== null && price > 0 && cost !== null,
    quantity: quantity !== null && Number.isInteger(quantity) && quantity > 0,
    // สองข้อนี้อยู่ในขั้น "รูปภาพ" กับ "ตรวจสอบ" ซึ่งยังไม่มีดีไซน์
    photos: false,
    review: false,
  };
}
