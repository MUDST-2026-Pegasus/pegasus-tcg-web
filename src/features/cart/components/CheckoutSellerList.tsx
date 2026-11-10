import { CheckoutSellerCard } from "./CheckoutSellerCard";
import type { ShippingQuoteOption } from "../checkout.types";
import type { CheckoutPromotions } from "../useCheckoutPromotions";
import type { CheckoutSellerGroup } from "../useShippingSelection";
import { useTranslate } from "@/lib/i18n";

interface CheckoutSellerListProps {
  sellerGroups: CheckoutSellerGroup[];
  selectedOptions: (ShippingQuoteOption | undefined)[];
  shippingLoading: boolean;
  shippingFailed: boolean;
  disabled: boolean;
  onSelectShipping: (sellerId: number, optionId: number) => void;
  promotions: CheckoutPromotions;
}

/** One card per seller: items, delivery choice, seller code and the seller's total. */
export function CheckoutSellerList({
  sellerGroups,
  selectedOptions,
  shippingLoading,
  shippingFailed,
  disabled,
  onSelectShipping,
  promotions,
}: CheckoutSellerListProps) {
  const { t } = useTranslate("buyer");
  const {
    promotionList,
    preview,
    previewReady,
    promotionSelection,
    sellerDiscounts,
    sellerErrors,
    setPromotionPicker,
  } = promotions;

  return sellerGroups.map(({ sellerId, items, quote }, index) => {
    const count =
      promotionList.data?.filter(
        (promotion) =>
          promotion.sellerProfileId === sellerId && promotion.applicable,
      ).length || 0;
    const sellerGrandTotal =
      sellerId == null
        ? null
        : preview?.sellers.find((s) => s.sellerProfileId === sellerId)
            ?.grandTotal ?? null;

    return (
      <CheckoutSellerCard
        key={sellerId ?? "unknown"}
        sellerId={sellerId}
        sellerName={quote?.sellerName || items[0]?.sellerName || t("cart.common.shop", "ร้านค้า")}
        items={items}
        quote={quote}
        selected={selectedOptions[index]}
        loading={shippingLoading}
        failed={shippingFailed}
        disabled={disabled}
        onSelect={(id) => {
          if (sellerId != null) onSelectShipping(sellerId, id);
        }}
        promotionCode={
          sellerId == null ? null : promotionSelection.sellerCodes[sellerId]
        }
        promotionDiscount={
          sellerId == null ? 0 : sellerDiscounts.get(sellerId) || 0
        }
        promotionCount={count}
        sellerGrandTotal={sellerGrandTotal}
        previewReady={previewReady}
        promotionError={
          sellerId == null ? null : sellerErrors[sellerId] ?? null
        }
        onOpenPromotions={
          sellerId == null ? undefined : () => setPromotionPicker(sellerId)
        }
      />
    );
  });
}
