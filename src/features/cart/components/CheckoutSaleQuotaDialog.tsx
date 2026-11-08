import { SaleQuotaDialog } from "@/features/sale/components/SaleBuyerDialogs";
import { useAcceptCartPrices, useRemoveCartItem } from "../cart.queries";
import type { CartItemResponse } from "../cart.types";

/** Flash price sold out while ordering: remove the item or keep it at the list price. */
export function CheckoutSaleQuotaDialog({
  item,
  onClose,
}: {
  item: CartItemResponse | null;
  onClose: () => void;
}) {
  const removeCartItem = useRemoveCartItem();
  const acceptPrices = useAcceptCartPrices();

  return (
    <SaleQuotaDialog
      open={item !== null}
      productName={item?.productName || "สินค้านี้"}
      salePrice={item?.pricing?.salePrice ?? null}
      listPrice={item?.pricing?.listPrice ?? null}
      pending={removeCartItem.isPending || acceptPrices.isPending}
      onClose={onClose}
      onRemove={() => item && removeCartItem.mutate(item.id, { onSettled: onClose })}
      onBuyAtListPrice={() => item && acceptPrices.mutate([item.id], { onSettled: onClose })}
    />
  );
}
