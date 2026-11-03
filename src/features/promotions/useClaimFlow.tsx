import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/toast";
import { useAuth } from "@/features/auth/auth.queries";
import { ClaimLoginDialog } from "./ClaimLoginDialog";
import type { ClaimTicketData } from "./ClaimTicket";
import { PromotionTermsDialog } from "./PromotionTermsDialog";
import { claimErrorMessage, copyPromotionCode } from "./claim.format";
import { useClaimPromotion } from "./claim.queries";
import type { ClaimResult, ClaimSource } from "./claim.types";

type Claimable = ClaimTicketData & { id: number };

export function useClaimToasts() {
  const navigate = useNavigate();
  return {
    success: (result: ClaimResult) =>
      toast.add({
        type: "success",
        title: result.alreadyClaimed
          ? `เก็บ ${result.claim.code} ไว้แล้ว · ใช้ได้ในตะกร้า`
          : `เก็บ ${result.claim.code} แล้ว · ใช้ได้ในตะกร้า`,
        actionProps: { children: "โค้ดของฉัน", onClick: () => navigate("/account/coupons") },
      }),
    error: (error: unknown) => toast.add({ type: "error", title: claimErrorMessage(error) }),
  };
}

/**
 * Pressing เก็บโค้ด or a ticket anywhere on the buyer side: guests get the
 * sign-in modal, buyers claim straight away, and the ticket opens its terms.
 */
export function useClaimFlow(source?: ClaimSource, options: { ownerView?: boolean } = {}) {
  const { isAuthenticated } = useAuth();
  const claimMutation = useClaimPromotion();
  const toasts = useClaimToasts();
  const [loginFor, setLoginFor] = useState<Claimable | null>(null);
  const [termsCode, setTermsCode] = useState<string | null>(null);

  const claimingId = claimMutation.isPending ? claimMutation.variables?.id ?? null : null;

  const claim = (promotion: Claimable) => {
    if (!isAuthenticated) {
      setTermsCode(null);
      setLoginFor(promotion);
      return;
    }
    claimMutation.mutate(
      { id: promotion.id, code: promotion.code, source },
      { onSuccess: toasts.success, onError: toasts.error },
    );
  };

  const dialogs = (
    <>
      <PromotionTermsDialog
        code={termsCode}
        onOpenChange={(open) => !open && setTermsCode(null)}
        ownerView={options.ownerView}
        claiming={claimMutation.isPending}
        onCopy={copyPromotionCode}
        onClaim={(terms) => claim({ ...terms, claimed: terms.claimed })}
      />
      <ClaimLoginDialog promotion={loginFor} onOpenChange={(open) => !open && setLoginFor(null)} />
    </>
  );

  return { claim, claimingId, openTerms: setTermsCode, dialogs };
}
