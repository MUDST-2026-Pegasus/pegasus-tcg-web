import type { SellerReturnRequest } from "../after-sales.types";

export type ReturnResolution = "FULL_REFUND" | "PARTIAL_REFUND";

/** What the seller has picked on a return card but not submitted yet. */
export type ReturnDraft = {
  resolution: ReturnResolution;
  partialAmount: string;
  shipBack: boolean;
  restock: boolean;
};

export const DEFAULT_RETURN_DRAFT: ReturnDraft = {
  resolution: "FULL_REFUND",
  partialAmount: "",
  shipBack: true,
  restock: true,
};

export function getRefundAmount(item: SellerReturnRequest, draft: ReturnDraft): number {
  return draft.resolution === "FULL_REFUND"
    ? item.sellerOrderGrandTotal
    : parseFloat(draft.partialAmount || "0");
}
