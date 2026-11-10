import { isOnSale } from "@/components/sale";
import { cartSaleTotals } from "@/features/sale/sale.cart";
import type { CartItemResponse } from "./cart.types";
import { translate } from "@/lib/i18n";

// @tolgee-key {"key": "cart.common.shop", "ns": "buyer", "defaultValue": "ร้านค้า"}

export function groupMiniCart(items: CartItemResponse[]) {
  const groups = new Map<
    string,
    { key: string; name: string; items: CartItemResponse[] }
  >();
  for (const item of items) {
    const key = String(
      item.sellerProfileId ??
        item.sellerUsername ??
        item.sellerName ??
        "unknown",
    );
    if (!groups.has(key))
      groups.set(key, {
        key,
        name: item.sellerName || item.sellerUsername || translate("buyer", "cart.common.shop", "ร้านค้า"),
        items: [],
      });
    groups.get(key)!.items.push(item);
  }
  return [...groups.values()];
}

export function miniCartSummary(
  items: CartItemResponse[],
  previousQuantity = 0,
) {
  const attention = items.filter(
    (item) => item.priceChanged || !item.purchasable,
  ).length;
  const purchasable = items.filter((item) => item.purchasable);
  const totals = cartSaleTotals(purchasable);
  const sale = purchasable.some((item) => isOnSale(item.pricing));
  const state = attention
    ? "attention"
    : previousQuantity > 0
      ? "updated"
      : sale
        ? "sale"
        : "added";
  return {
    ...totals,
    attention,
    state,
    sale,
    quantity: items.reduce((sum, item) => sum + item.quantity, 0),
    shops: groupMiniCart(items).length,
  };
}
