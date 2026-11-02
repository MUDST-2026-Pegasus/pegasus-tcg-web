import type { PromotionSelection } from "./promotions.types";

export const PROMOTION_SELECTION_KEY = "pegasus.checkout.promotions";

export function readPromotionSelection(): PromotionSelection {
  try {
    const raw = sessionStorage.getItem(PROMOTION_SELECTION_KEY);
    if (!raw) return { platformCode: null, sellerCodes: {} };
    const parsed = JSON.parse(raw) as Partial<PromotionSelection> | null;
    const platformCode =
      typeof parsed?.platformCode === "string" && parsed.platformCode.trim()
        ? parsed.platformCode.trim().toUpperCase()
        : null;
    const sellerCodes: Record<number, string> = {};
    if (parsed?.sellerCodes && typeof parsed.sellerCodes === "object") {
      for (const [key, val] of Object.entries(parsed.sellerCodes)) {
        const numKey = Number(key);
        if (Number.isInteger(numKey) && typeof val === "string" && val.trim()) {
          sellerCodes[numKey] = val.trim().toUpperCase();
        }
      }
    }
    return { platformCode, sellerCodes };
  } catch {
    return { platformCode: null, sellerCodes: {} };
  }
}

export function savePromotionSelection(selection: PromotionSelection) {
  sessionStorage.setItem(PROMOTION_SELECTION_KEY, JSON.stringify(selection));
}

export function clearPromotionSelection() {
  sessionStorage.removeItem(PROMOTION_SELECTION_KEY);
}
