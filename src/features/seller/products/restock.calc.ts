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
  quantity: number;
  totalCost: number;
  unitCost: number;
  previousValue: number;
  newStock: number;
  combinedValue: number;
  newAverageCost: number;
  previousProfit: number;
  newProfit: number;
  /** ราคาขายที่ทำให้กำไรต่อใบเท่าเดิม ปัดเป็นหลักสิบ */
  suggestedPrice: number;
};

/**
 * ต้นทุนเฉลี่ยถ่วงน้ำหนัก (Weighted Average Cost)
 * (สต็อกเดิม × ต้นทุนเฉลี่ยเดิม + ต้นทุนรวมล็อตใหม่) ÷ (สต็อกเดิม + จำนวนล็อตใหม่)
 */
export function calculateRestock(
  product: RestockData["product"],
  commissionPercent: number,
  draft: RestockDraft,
): RestockCalculation {
  const parsedQuantity = toNumber(draft.quantity);
  const parsedTotalCost = toNumber(draft.totalCost);

  const isValid =
    parsedQuantity !== null &&
    Number.isInteger(parsedQuantity) &&
    parsedQuantity > 0 &&
    parsedTotalCost !== null &&
    parsedTotalCost > 0 &&
    draft.receivedAt !== "";

  // ยังไม่มีจำนวนใบ = ยังไม่นับต้นทุนเข้าไป ไม่งั้นต้นทุนเฉลี่ยพุ่งทั้งที่สต็อกไม่เพิ่ม
  const quantity = parsedQuantity !== null && parsedQuantity > 0 ? parsedQuantity : 0;
  const totalCost = quantity > 0 ? (parsedTotalCost ?? 0) : 0;
  const unitCost = quantity > 0 ? roundMoney(totalCost / quantity) : 0;

  const previousValue = roundMoney(product.stock * product.averageCost);
  const newStock = product.stock + quantity;
  const combinedValue = roundMoney(previousValue + totalCost);
  const newAverageCost =
    newStock > 0 ? roundMoney(combinedValue / newStock) : product.averageCost;

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
    quantity,
    totalCost,
    unitCost,
    previousValue,
    newStock,
    combinedValue,
    newAverageCost,
    previousProfit,
    newProfit,
    suggestedPrice,
  };
}
