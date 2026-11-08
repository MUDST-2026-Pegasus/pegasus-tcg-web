import { CheckoutPlatformPromotionCard } from "./CheckoutPlatformPromotionCard";
import type { CheckoutPromotions } from "../useCheckoutPromotions";

/** Pegasus (platform) code card wired to the checkout promotion state. */
export function CheckoutPlatformPromotion({ promotions }: { promotions: CheckoutPromotions }) {
  const {
    promotionSelection,
    appliedPlatformPromotion,
    preview,
    promotionList,
    typedPlatformCode,
    setTypedPlatformCode,
    platformError,
    setPlatformError,
    promoPreview,
    setCode,
    setPromotionPicker,
  } = promotions;

  return (
    <CheckoutPlatformPromotionCard
      selectedCode={promotionSelection.platformCode}
      selectedPromotion={appliedPlatformPromotion ?? null}
      discount={preview?.platformDiscountTotal ?? 0}
      availableCount={
        promotionList.data?.filter(
          (promotion) => promotion.ownerType === "PLATFORM",
        ).length ?? 0
      }
      typedCode={typedPlatformCode}
      error={platformError}
      loading={promoPreview.isFetching}
      onTypedCodeChange={(code) => {
        setTypedPlatformCode(code);
        if (platformError) setPlatformError(null);
      }}
      onApplyTypedCode={() => {
        if (!typedPlatformCode.trim()) return;
        setCode("PLATFORM", typedPlatformCode);
        setTypedPlatformCode("");
      }}
      onRemoveCode={() => setCode("PLATFORM", null)}
      onOpenPicker={() => setPromotionPicker("PLATFORM")}
    />
  );
}
