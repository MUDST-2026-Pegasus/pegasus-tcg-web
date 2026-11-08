import { useNavigate } from "react-router-dom";
import { CodePickerDialog } from "@/features/promotions/CodePickerDialog";
import { PromotionChangedDialog } from "./PromotionChangedDialog";
import type { CheckoutPromotions } from "../useCheckoutPromotions";
import type { CheckoutSellerGroup } from "../useShippingSelection";
import type { PromotionChange } from "../useCheckoutErrorHandler";

interface CheckoutPromotionDialogsProps {
  promotions: CheckoutPromotions;
  sellerGroups: CheckoutSellerGroup[];
  promotionChanged: PromotionChange | null;
  onClosePromotionChanged: () => void;
  onConfirmNewTotal: () => void;
}

/** Code picker (platform or one seller) and the "total changed" confirmation. */
export function CheckoutPromotionDialogs({
  promotions,
  sellerGroups,
  promotionChanged,
  onClosePromotionChanged,
  onConfirmNewTotal,
}: CheckoutPromotionDialogsProps) {
  const navigate = useNavigate();
  const {
    promotionSelection,
    promotionPicker,
    setPromotionPicker,
    platformError,
    sellerErrors,
    pendingTypedCode,
    setPendingTypedCode,
    promotionList,
    promoPreview,
    preview,
    previewReady,
    setCode,
  } = promotions;

  const promotionStoreUsername =
    promotionPicker == null || promotionPicker === "PLATFORM"
      ? undefined
      : sellerGroups
          .find((group) => group.sellerId === promotionPicker)
          ?.items.find((item) => item.sellerUsername)?.sellerUsername ?? undefined;

  return (
    <>
      <CodePickerDialog
        open={promotionPicker !== null}
        onOpenChange={(open) => {
          if (!open) setPromotionPicker(null);
        }}
        owner={promotionPicker ?? "PLATFORM"}
        sellerName={
          sellerGroups.find((group) => group.sellerId === promotionPicker)?.quote
            ?.sellerName ||
          sellerGroups.find((group) => group.sellerId === promotionPicker)?.items[0]
            ?.sellerName ||
          undefined
        }
        promotions={promotionList.data || []}
        selectedCode={
          promotionPicker === "PLATFORM"
            ? promotionSelection.platformCode
            : promotionPicker == null
              ? null
              : promotionSelection.sellerCodes[promotionPicker] ?? null
        }
        onSelect={(code) => {
          if (promotionPicker !== null) {
            setCode(promotionPicker, code);
          }
        }}
        onTryCode={(code) => {
          if (promotionPicker !== null) {
            setPendingTypedCode({ owner: promotionPicker, code });
            setCode(promotionPicker, code);
          }
        }}
        error={
          promotionPicker === "PLATFORM"
            ? platformError
            : promotionPicker != null
              ? sellerErrors[promotionPicker]
              : null
        }
        onNavigateHome={() => navigate("/")}
        onNavigateToStore={
          promotionStoreUsername
            ? () => navigate(`/u/${encodeURIComponent(promotionStoreUsername)}`)
            : undefined
        }
        loading={
          pendingTypedCode?.owner === promotionPicker &&
          (!previewReady || promoPreview.isFetching)
        }
      />

      <PromotionChangedDialog
        open={promotionChanged !== null}
        onOpenChange={(open) => {
          if (!open) onClosePromotionChanged();
        }}
        previousTotal={promotionChanged?.previous ?? 0}
        newTotal={preview?.grandTotal ?? promotionChanged?.next ?? 0}
        droppedCode={promotionChanged?.code}
        droppedOwner={promotionChanged?.owner}
        droppedReason={
          promotionChanged?.owner === "PLATFORM"
            ? platformError
            : promotionChanged?.owner != null
              ? sellerErrors[promotionChanged.owner]
              : null
        }
        sellerDiscountTotal={preview?.sellerDiscountTotal ?? 0}
        platformDiscountTotal={preview?.platformDiscountTotal ?? 0}
        loading={promoPreview.isFetching}
        onChooseAnotherCode={(owner) => {
          onClosePromotionChanged();
          setPromotionPicker(owner ?? "PLATFORM");
        }}
        onConfirmNewTotal={() => {
          onClosePromotionChanged();
          onConfirmNewTotal();
        }}
      />
    </>
  );
}
