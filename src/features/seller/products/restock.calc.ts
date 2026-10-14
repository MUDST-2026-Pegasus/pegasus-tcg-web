import { MAX_UNITS_PER_STOCK_IN } from "./listing-form.schema";
import type { NewUnitsPayload } from "./listing-form.types";
import { roundMoney, toNumber } from "./products.format";
import type { RestockData, RestockDraft } from "./restock.types";

const thaiShortDate = new Intl.DateTimeFormat("th-TH", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

/** "2026-08-14" → Date ตามเวลาเครื่อง (ไม่ใช้ new Date(iso) เพราะจะตีเป็น UTC แล้ววันเลื่อน) */
export function parseIsoDate(value: string): Date | undefined {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return undefined;
  return new Date(year, month - 1, day);
}

export function toIsoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/** "2026-08-14" → "14 ส.ค. 2569" */
export function formatThaiDate(value: string): string {
  const date = parseIsoDate(value);
  return date ? thaiShortDate.format(date) : "";
}

export type RestockCalculation = {
  /** กรอกจำนวน ต้นทุนรวม และวันที่ครบ บันทึกได้ */
  isValid: boolean;
  /** จำนวนเกินที่ backend รับได้ต่อครั้ง — แสดงใต้ช่องจำนวน */
  quantityError: string | null;
  quantity: number;
  totalCost: number;
  unitCost: number;
  /** ต้นทุนรวมของการ์ดที่มีอยู่แล้ว (ทุกใบที่ต้นทุนเฉลี่ยครอบคลุม ไม่ใช่แค่บนประกาศนี้) */
  previousValue: number;
  /** การ์ดพร้อมขายบนประกาศนี้หลังรับเข้า */
  newStock: number;
  /** การ์ดทั้งหมดที่ต้นทุนเฉลี่ยใหม่ครอบคลุม — ตัวหารของต้นทุนเฉลี่ยใหม่ */
  newCostQuantity: number;
  combinedValue: number;
  newAverageCost: number;
  previousProfit: number;
  newProfit: number;
  /** ราคาขายที่ทำให้กำไรต่อใบเท่าเดิม ปัดเป็นหลักสิบ */
  suggestedPrice: number;
};

/**
 * ต้นทุนเฉลี่ยถ่วงน้ำหนัก (Weighted Average Cost) — สูตรเดียวกับ `WeightedAverageCost.receive` ฝั่ง backend
 * (ต้นทุนรวมเดิม + ต้นทุนรวมล็อตใหม่) ÷ (การ์ดเดิม + จำนวนล็อตใหม่)
 *
 * "การ์ดเดิม" คือทุกใบที่ต้นทุนเฉลี่ยครอบคลุม (`costQuantity`) ไม่ใช่สต็อกของประกาศนี้
 * เพราะ backend เก็บต้นทุนต่อการ์ด + สภาพ รวมใบที่ติดจอง ใบในมือ และประกาศแฝด
 */
export function calculateRestock(
  product: RestockData["product"],
  commissionPercent: number,
  draft: RestockDraft,
): RestockCalculation {
  const parsedQuantity = toNumber(draft.quantity);
  const parsedTotalCost = toNumber(draft.totalCost);

  const quantityError =
    parsedQuantity !== null && parsedQuantity > MAX_UNITS_PER_STOCK_IN
      ? `รับเข้าได้ครั้งละไม่เกิน ${MAX_UNITS_PER_STOCK_IN} ใบ เกินนี้แบ่งบันทึกเป็นหลายล็อต`
      : null;

  const isValid =
    parsedQuantity !== null &&
    Number.isInteger(parsedQuantity) &&
    parsedQuantity > 0 &&
    quantityError === null &&
    parsedTotalCost !== null &&
    parsedTotalCost > 0 &&
    draft.receivedAt !== "";

  // ยังไม่มีจำนวนใบ = ยังไม่นับต้นทุนเข้าไป ไม่งั้นต้นทุนเฉลี่ยพุ่งทั้งที่สต็อกไม่เพิ่ม
  const quantity = parsedQuantity !== null && parsedQuantity > 0 ? parsedQuantity : 0;
  const totalCost = quantity > 0 ? (parsedTotalCost ?? 0) : 0;
  const unitCost = quantity > 0 ? roundMoney(totalCost / quantity) : 0;

  const previousValue = roundMoney(product.costTotal);
  const newStock = product.stock + quantity;
  const newCostQuantity = product.costQuantity + quantity;
  const combinedValue = roundMoney(previousValue + totalCost);
  const newAverageCost =
    newCostQuantity > 0 ? roundMoney(combinedValue / newCostQuantity) : product.averageCost;

  const commissionRate = commissionPercent / 100;
  const commission = roundMoney(product.sellingPrice * commissionRate);
  const previousProfit = roundMoney(
    product.sellingPrice - product.averageCost - commission,
  );
  const newProfit = roundMoney(product.sellingPrice - newAverageCost - commission);
  const suggestedPrice =
    Math.round((newAverageCost + previousProfit) / (1 - commissionRate) / 10) *
    10;

  return {
    isValid,
    quantityError,
    quantity,
    totalCost,
    unitCost,
    previousValue,
    newStock,
    newCostQuantity,
    combinedValue,
    newAverageCost,
    previousProfit,
    newProfit,
    suggestedPrice,
  };
}

/**
 * ฟอร์มที่ผ่านแล้ว → body ของ `POST .../units`
 * - ต้นทุนต่อใบปัดเป็นสตางค์ (`@Digits(fraction = 2)`) ตรงกับตัวเลขที่การ์ดคำนวณโชว์
 * - วันที่รับเข้าส่งเป็นเที่ยงคืนตามเวลาเครื่อง — วันนี้ก็ยังไม่ใช่อนาคต (`@PastOrPresent`)
 * - backend ไม่มีช่องแหล่งที่มา / เลขอ้างอิง จึงรวมกับบันทึกไว้ใน `unitNote` ของการ์ดทุกใบ
 */
export function toNewUnitsPayload(
  draft: RestockDraft,
  result: RestockCalculation,
  sourceLabel: string | undefined,
): NewUnitsPayload {
  const reference = draft.reference.trim();
  const note = [
    sourceLabel,
    reference ? `อ้างอิง ${reference}` : null,
    draft.note.trim(),
  ]
    .filter(Boolean)
    .join(" · ");

  return {
    quantity: result.quantity,
    unitCost: result.unitCost,
    acquiredAt: parseIsoDate(draft.receivedAt)?.toISOString(),
    unitNote: note || null,
  };
}
