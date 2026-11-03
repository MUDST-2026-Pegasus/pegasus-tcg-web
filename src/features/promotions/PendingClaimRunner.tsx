import { useEffect, useRef } from "react";
import { useAuth } from "@/features/auth/auth.queries";
import { takePendingClaim } from "./claim-redirect";
import { useClaimPromotion } from "./claim.queries";
import { useClaimToasts } from "./useClaimFlow";

/**
 * Finishes a claim a guest started before signing in (`/login?claim=`), on
 * whichever buyer page they come back to. Mounted once in PublicLayout.
 */
export function PendingClaimRunner() {
  const { isAuthenticated } = useAuth();
  const claimMutation = useClaimPromotion();
  const toasts = useClaimToasts();
  const started = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || started.current) return;
    const id = takePendingClaim();
    if (id == null) return;
    started.current = true;
    claimMutation.mutate({ id }, {
      onSuccess: toasts.success,
      onError: toasts.error,
      onSettled: () => { started.current = false; },
    });
  }, [isAuthenticated, claimMutation, toasts]);

  return null;
}
