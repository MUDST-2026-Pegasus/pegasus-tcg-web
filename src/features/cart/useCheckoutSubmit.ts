import { useRef, useState, type RefObject } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api/errors";
import { checkoutApi } from "./checkout.api";
import { cartKeys } from "./cart.queries";
import { clearPromotionSelection } from "./promotions.storage";

export interface CheckoutPayload {
  cartItemIds: number[];
  shippingAddressId: number;
  shippingOptionBySeller: Record<number, number>;
  platformCode: string | null;
  sellerCodes: Record<number, string>;
  expectedGrandTotal: number;
}

/**
 * Places the order once per click: a second click while one is in flight is ignored.
 * The Idempotency-Key stays the same while the payload is unchanged and the last failure
 * was uncertain (network / 5xx), so a retry cannot create a duplicate order. A changed
 * payload or a 4xx answer starts a new key. Failures go to `onError`.
 */
export function useCheckoutSubmit({
  canPurchase,
  buildPayload,
  completedRef,
  onError,
}: {
  /** Everything is ready to order; the hook adds its own "not already submitting" check. */
  canPurchase: boolean;
  buildPayload: () => CheckoutPayload;
  completedRef: RefObject<boolean>;
  onError: (error: unknown, payload: CheckoutPayload) => Promise<void>;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const submitting = useRef(false);
  const attempt = useRef<{ signature: string; key: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async () => {
    if (!canPurchase || isSubmitting || submitting.current) return;
    submitting.current = true;
    setIsSubmitting(true);
    const payload = buildPayload();
    const signature = JSON.stringify(payload);

    // Preserve the key after uncertain network failures so retrying cannot place a duplicate order.
    if (attempt.current?.signature !== signature) {
      attempt.current = { signature, key: crypto.randomUUID() };
    }

    try {
      const response = await checkoutApi.checkout(payload, attempt.current.key);
      completedRef.current = true;
      clearPromotionSelection();
      toast.add({
        title: "สร้างคำสั่งซื้อสำเร็จ",
        description: `คำสั่งซื้อ ${response.orderNumber}`,
        type: "success",
      });
      navigate(`/payment?orderId=${response.orderId}`, {
        state: { orderId: response.orderId, order: response },
      });
      void queryClient.invalidateQueries({ queryKey: cartKeys.all });
    } catch (error) {
      if (error instanceof ApiError && error.status > 0 && error.status < 500) {
        attempt.current = null;
      }
      await onError(error, payload);
    } finally {
      submitting.current = false;
      setIsSubmitting(false);
    }
  };

  return { submit, isSubmitting };
}
