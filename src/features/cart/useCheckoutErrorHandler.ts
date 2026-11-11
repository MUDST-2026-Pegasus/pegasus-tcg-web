import { useState, type Dispatch, type RefObject, type SetStateAction } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api/errors";
import { addressKeys } from "@/features/account/address.queries";
import { notifyBuyerLimit, quotaListingId } from "@/features/sale/sale.notify";
import { cartKeys } from "./cart.queries";
import { findPromotionOwnerForCode } from "./checkout.format";
import type { CartItemResponse } from "./cart.types";
import type { PromotionSelection } from "./promotions.types";
import type { CheckoutSellerGroup } from "./useShippingSelection";
import type { CheckoutPayload } from "./useCheckoutSubmit";
import { translateError, useTranslate } from "@/lib/i18n";

export interface PromotionChange {
  previous: number;
  next: number;
  code?: string;
  owner?: "PLATFORM" | number;
}

/**
 * Turns a failed checkout into the right next step: refresh shipping, confirm a new
 * promotion total, pick the address again, Flash quota/limit notices, back to cart on a
 * price change, or a toast. Also holds the notices those steps show.
 */
export function useCheckoutErrorHandler({
  sellerGroups,
  checkoutItems,
  promotionSelection,
  setShippingChoices,
  refetchQuotes,
  refetchPreview,
  setSelectedAddressId,
  setAddressPickerOpen,
  hasRedirectedRef,
}: {
  sellerGroups: CheckoutSellerGroup[];
  checkoutItems: CartItemResponse[];
  promotionSelection: PromotionSelection;
  setShippingChoices: Dispatch<SetStateAction<Record<number, number>>>;
  refetchQuotes: () => Promise<unknown>;
  refetchPreview: () => Promise<unknown>;
  setSelectedAddressId: (id: number | null) => void;
  setAddressPickerOpen: (open: boolean) => void;
  hasRedirectedRef: RefObject<boolean>;
}) {
  const { t } = useTranslate("buyer");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [shippingNotice, setShippingNotice] = useState<string | null>(null);
  const [promotionChanged, setPromotionChanged] = useState<PromotionChange | null>(null);
  const [quotaItem, setQuotaItem] = useState<CartItemResponse | null>(null);

  const handleError = async (error: unknown, payload: CheckoutPayload) => {
    if (!(error instanceof ApiError)) {
      toast.add({
        title: t("checkout.toast.failed", "สั่งซื้อไม่สำเร็จ"),
        description: t("checkout.error.connection", "กรุณาตรวจสอบการเชื่อมต่อและลองอีกครั้ง"),
        type: "error",
      });
      return;
    }
    if (
      error.code === "SHIPPING_OPTION_INVALID" ||
      error.code === "SELLER_SHIPPING_UNAVAILABLE"
    ) {
      const changedSeller = sellerGroups.find(
        (group) => group.sellerId === Number(error.details?.sellerProfileId),
      );
      const sellerNames = changedSeller
        ? changedSeller.quote?.sellerName ||
          changedSeller.items[0]?.sellerName ||
          t("cart.common.shop", "ร้านค้า")
        : sellerGroups
            .map(
              (group) =>
                group.quote?.sellerName ||
                group.items[0]?.sellerName ||
                t("cart.common.shop", "ร้านค้า"),
            )
            .join(", ");
      setShippingNotice(
        error.code === "SHIPPING_OPTION_INVALID" ? sellerNames : null,
      );
      setShippingChoices((previous) => {
        if (changedSeller?.sellerId == null) return {};
        const next = { ...previous };
        delete next[changedSeller.sellerId];
        return next;
      });
      await refetchQuotes();
    } else if (
      error.code === "PROMO_CHANGED" ||
      (error.code === "PROMO_USED_UP" && hasGrandTotal(error))
    ) {
      const details = error.details as Record<string, unknown> | undefined;
      const droppedCode =
        typeof details?.code === "string" ? details.code : undefined;
      const targetOwner =
        findPromotionOwnerForCode(droppedCode, promotionSelection) ?? "PLATFORM";

      setPromotionChanged({
        previous: payload.expectedGrandTotal,
        next: Number(details?.grandTotal) || payload.expectedGrandTotal,
        code: droppedCode,
        owner: targetOwner,
      });
      await refetchPreview();
    } else if (error.code?.startsWith("PROMO_")) {
      // The order refused a code (ended, paused, limit reached, …) [TCG-770]. A fresh
      // preview reports it too, so the code drops out with its reason on its slot and
      // the total updates; the next tap goes through without it.
      toast.add({
        title: t("checkout.toast.codeRefused", "โค้ดส่วนลดใช้ไม่ได้แล้ว"),
        description: translateError(error, error.message),
        type: "warning",
      });
      await refetchPreview();
    } else if (
      error.code === "SHIPPING_ADDRESS_REQUIRED" ||
      error.code === "ADDRESS_NOT_FOUND"
    ) {
      setSelectedAddressId(null);
      await queryClient.invalidateQueries({ queryKey: addressKeys.all });
      setAddressPickerOpen(true);
      toast.add({
        title: t("checkout.toast.addressAgain", "กรุณาเลือกที่อยู่จัดส่งอีกครั้ง"),
        description: t("checkout.toast.addressAgainHint", "ที่อยู่เดิมไม่พร้อมใช้งาน"),
        type: "warning",
      });
    } else if (error.code === "SALE_QUOTA_REACHED") {
      // โควตาราคา Flash เต็มระหว่างทาง → modal ให้เลือกนำออกหรือซื้อราคาปกติ (Figma SAL-M1)
      const listingId = quotaListingId(error);
      setQuotaItem(
        checkoutItems.find((item) => item.listingId === listingId) ??
          checkoutItems.find((item) => item.pricing?.sale?.type === "FLASH_SALE") ??
          null,
      );
      void queryClient.invalidateQueries({ queryKey: cartKeys.all });
    } else if (error.code === "SALE_BUYER_LIMIT_REACHED") {
      const item =
        checkoutItems.find((row) => row.listingId === quotaListingId(error)) ??
        checkoutItems.find((row) => row.pricing?.sale?.perBuyerLimit != null);
      notifyBuyerLimit(item?.pricing?.sale?.perBuyerLimit ?? 1, item?.pricing?.listPrice ?? 0);
      void queryClient.invalidateQueries({ queryKey: cartKeys.all });
    } else if (
      error.code === "PRICE_CHANGED" ||
      error.code === "CART_PRICE_CHANGED"
    ) {
      void queryClient.invalidateQueries({ queryKey: cartKeys.all });
      hasRedirectedRef.current = true;
      toast.add({
        title: t("checkout.toast.priceChanged", "ราคาสินค้ามีการเปลี่ยนแปลง"),
        description: t("checkout.toast.priceChangedAgain", "กรุณาตรวจสอบและยอมรับราคาใหม่ในตะกร้าอีกครั้ง"),
        type: "warning",
      });
      navigate("/cart");
    } else {
      toast.add({
        title:
          error.code === "INSUFFICIENT_STOCK"
            ? t("checkout.toast.insufficientStock", "สินค้าไม่เพียงพอ")
            : t("checkout.toast.failed", "สั่งซื้อไม่สำเร็จ"),
        description: translateError(error, error.message),
        type: "error",
      });
    }
  };

  return {
    handleError,
    shippingNotice,
    promotionChanged,
    setPromotionChanged,
    quotaItem,
    setQuotaItem,
  };
}

/** A PROMO_USED_UP with a new total gets the "total changed" dialog; one without is a refused code. */
function hasGrandTotal(error: ApiError): boolean {
  const details = error.details as Record<string, unknown> | undefined;
  return details?.grandTotal != null && Number.isFinite(Number(details.grandTotal));
}
