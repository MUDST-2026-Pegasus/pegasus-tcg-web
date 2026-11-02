import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { CartItemResponse } from "./cart.types";
import { checkoutApi } from "./checkout.api";
import { formatPromotionError, normalizePromotionCode } from "./checkout.format";
import {
  readPromotionSelection,
  savePromotionSelection,
  type PromotionSelection,
} from "./promotions.types";

interface CheckoutPromotionsOptions {
  checkoutItems: CartItemResponse[];
  cartItemIds: number[];
  cartNeedsReview: boolean;
  shippingOptionBySeller: Record<number, number>;
  shippingReady: boolean;
}

export function useCheckoutPromotions({
  checkoutItems,
  cartItemIds,
  cartNeedsReview,
  shippingOptionBySeller,
  shippingReady,
}: CheckoutPromotionsOptions) {
  const [promotionSelection, setPromotionSelection] = useState<PromotionSelection>(
    readPromotionSelection,
  );
  const [debouncedSelection, setDebouncedSelection] = useState(promotionSelection);
  const [promotionPicker, setPromotionPicker] = useState<"PLATFORM" | number | null>(null);
  const [typedPlatformCode, setTypedPlatformCode] = useState("");
  const [platformError, setPlatformError] = useState<string | null>(null);
  const [sellerErrors, setSellerErrors] = useState<Record<number, string>>({});
  const [pendingTypedCode, setPendingTypedCode] = useState<{
    owner: "PLATFORM" | number;
    code: string;
  } | null>(null);

  useEffect(() => {
    if (!checkoutItems.length) return;
    const timer = window.setTimeout(() => {
      const currentSellerIds = new Set(
        checkoutItems
          .map((item) => item.sellerProfileId)
          .filter((id): id is number => id != null),
      );
      setPromotionSelection((previous) => {
        const sellerCodes: Record<number, string> = {};
        let changed = false;
        for (const [key, code] of Object.entries(previous.sellerCodes)) {
          const sellerId = Number(key);
          if (currentSellerIds.has(sellerId)) sellerCodes[sellerId] = code;
          else changed = true;
        }
        return changed ? { ...previous, sellerCodes } : previous;
      });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [checkoutItems]);

  useEffect(() => {
    savePromotionSelection(promotionSelection);
    const timer = window.setTimeout(() => setDebouncedSelection(promotionSelection), 180);
    return () => window.clearTimeout(timer);
  }, [promotionSelection]);

  const promotionList = useQuery({
    queryKey: ["checkout-promotions", cartItemIds],
    queryFn: () => checkoutApi.getPromotions(cartItemIds),
    enabled: checkoutItems.length > 0 && !cartNeedsReview,
  });

  const promoPreview = useQuery({
    queryKey: [
      "checkout-promo-preview",
      cartItemIds,
      shippingOptionBySeller,
      debouncedSelection,
    ],
    queryFn: ({ signal }) =>
      checkoutApi.previewPromotions(
        { cartItemIds, shippingOptionBySeller, ...debouncedSelection },
        signal,
      ),
    enabled: shippingReady && debouncedSelection === promotionSelection,
    retry: false,
  });

  const preview = promoPreview.data;
  const previewReady =
    !!preview &&
    !promoPreview.isFetching &&
    !promoPreview.isError &&
    debouncedSelection === promotionSelection;

  const appliedPlatformCode = preview?.codes.find(
    (code) => code.ownerType === "PLATFORM" && code.status === "APPLIED",
  )?.code;

  const appliedPlatformPromotion = useMemo(() => {
    if (!promotionSelection.platformCode) return null;
    return promotionList.data?.find(
      (promotion) =>
        promotion.code === promotionSelection.platformCode &&
        promotion.ownerType === "PLATFORM",
    );
  }, [promotionSelection.platformCode, promotionList.data]);

  const sellerDiscounts = new Map(
    preview?.sellers.map((seller) => [
      seller.sellerProfileId,
      seller.sellerDiscount,
    ]),
  );

  const clearOwnerError = (owner: "PLATFORM" | number) => {
    if (owner === "PLATFORM") {
      setPlatformError(null);
    } else {
      setSellerErrors((previous) => {
        const next = { ...previous };
        delete next[owner];
        return next;
      });
    }
  };

  const setCode = (owner: "PLATFORM" | number, code: string | null) => {
    clearOwnerError(owner);
    const normalized = code ? normalizePromotionCode(code) : null;
    setPromotionSelection((previous) => {
      if (owner === "PLATFORM") {
        return { ...previous, platformCode: normalized };
      }
      const sellerCodes = { ...previous.sellerCodes };
      if (normalized) sellerCodes[owner] = normalized;
      else delete sellerCodes[owner];
      return { ...previous, sellerCodes };
    });
  };

  useEffect(() => {
    if (!preview || !previewReady) return;
    const timer = window.setTimeout(() => {
      const invalidOutcomes = preview.codes.filter(
        (code) => code.status !== "APPLIED" && !code.pendingShipping,
      );

      if (invalidOutcomes.length) {
        let removePlatform = false;
        const sellerIdsToRemove = new Set<number>();
        const nextSellerErrors: Record<number, string> = {};

        for (const invalid of invalidOutcomes) {
          const message = formatPromotionError(invalid.status, {
            sellerName: invalid.sellerName,
            shortfall: invalid.shortfall,
          });
          if (
            invalid.ownerType === "PLATFORM" &&
            promotionSelection.platformCode === invalid.code
          ) {
            removePlatform = true;
            setPlatformError(message);
          } else if (
            invalid.sellerProfileId != null &&
            promotionSelection.sellerCodes[invalid.sellerProfileId] === invalid.code
          ) {
            sellerIdsToRemove.add(invalid.sellerProfileId);
            nextSellerErrors[invalid.sellerProfileId] = message;
          }
        }

        if (removePlatform || sellerIdsToRemove.size) {
          setSellerErrors((previous) => ({ ...previous, ...nextSellerErrors }));
          setPromotionSelection((previous) => {
            const sellerCodes = { ...previous.sellerCodes };
            for (const sellerId of sellerIdsToRemove) delete sellerCodes[sellerId];
            return {
              platformCode: removePlatform ? null : previous.platformCode,
              sellerCodes,
            };
          });
        }

        if (
          pendingTypedCode &&
          invalidOutcomes.some((outcome) => outcome.code === pendingTypedCode.code)
        ) {
          setPendingTypedCode(null);
        }
        return;
      }

      if (pendingTypedCode) {
        const applied = preview.codes.some((outcome) => {
          if (outcome.code !== pendingTypedCode.code || outcome.status !== "APPLIED") {
            return false;
          }
          return pendingTypedCode.owner === "PLATFORM"
            ? outcome.ownerType === "PLATFORM"
            : outcome.sellerProfileId === pendingTypedCode.owner;
        });
        if (applied) {
          setPendingTypedCode(null);
          setPromotionPicker(null);
        }
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [pendingTypedCode, preview, previewReady, promotionSelection]);

  return {
    promotionSelection,
    promotionPicker,
    setPromotionPicker,
    typedPlatformCode,
    setTypedPlatformCode,
    platformError,
    setPlatformError,
    sellerErrors,
    pendingTypedCode,
    setPendingTypedCode,
    promotionList,
    promoPreview,
    preview,
    previewReady,
    appliedPlatformCode,
    appliedPlatformPromotion,
    sellerDiscounts,
    setCode,
  };
}
