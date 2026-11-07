import { formatSaleBaht } from "@/components/sale";
import { toast } from "@/components/ui/toast";
import { notifyAddedAtSalePrice } from "@/features/sale/sale.notify";
import { cartUnitPrice } from "@/features/sale/sale.cart";
import type { CartItemResponse } from "./cart.types";
import { addToCartErrorMessage } from "./cart.format";
import { miniCartText as t } from "./mini-cart.messages";

export function notifyQuickAdded(
  item: CartItemResponse,
  onViewCart: () => void,
) {
  const options = { imageUrl: item.imageUrl, onViewCart };
  if (
    notifyAddedAtSalePrice(
      item.productName || "",
      item.quantity,
      item.pricing,
      options,
    )
  )
    return;
  toast.add({
    title: t.added,
    description: `${item.productName || ""} · ${formatSaleBaht(cartUnitPrice(item) * item.quantity)}`,
    type: "success",
    timeout: 4000,
    data: { quickCart: true, imageUrl: item.imageUrl },
    actionProps: { children: t.view, onClick: onViewCart },
  });
}

export function notifyQuickAddError(error: unknown) {
  toast.add({
    title: t.addFailed,
    description: addToCartErrorMessage(error),
    type: "error",
    timeout: 4000,
    data: { quickCart: true },
  });
}
