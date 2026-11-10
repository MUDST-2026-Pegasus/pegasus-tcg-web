import { useMutation, useQuery, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/auth.queries";
import type { PromotionOwner } from "@/features/cart/promotions.types";
import { hasErrorCode } from "@/lib/api";
import { claimApi } from "./claim.api";
import type { ClaimableCode, ClaimSource, WalletTab } from "./claim.types";

/** Guest and buyer see different `claimed` flags, so the strips are keyed by who is asking. */
export const promotionKeys = {
  all: ["promotions"] as const,
  featured: (userId?: number) => [...promotionKeys.all, "featured", userId ?? null] as const,
  store: (username: string, userId?: number) =>
    [...promotionKeys.all, "store", username, userId ?? null] as const,
  terms: (code: string, userId?: number) =>
    [...promotionKeys.all, "terms", code, userId ?? null] as const,
  wallet: () => [...promotionKeys.all, "wallet"] as const,
  walletTab: (tab: WalletTab, owner?: PromotionOwner) =>
    [...promotionKeys.wallet(), tab, owner ?? "ALL"] as const,
};

const stripKeys = [
  [...promotionKeys.all, "featured"],
  [...promotionKeys.all, "store"],
] as const;

export function useFeaturedPromotions() {
  const { user, isLoading } = useAuth();
  return useQuery({
    queryKey: promotionKeys.featured(user?.id),
    queryFn: claimApi.featured,
    enabled: !isLoading,
  });
}

export function useStorePromotions(username: string | undefined) {
  const { user, isLoading } = useAuth();
  return useQuery({
    queryKey: promotionKeys.store(username ?? "", user?.id),
    queryFn: () => claimApi.storeCodes(username!),
    enabled: !!username && !isLoading,
  });
}

export function usePromotionTerms(code: string | null) {
  const { user } = useAuth();
  return useQuery({
    queryKey: promotionKeys.terms(code ?? "", user?.id),
    queryFn: () => claimApi.terms(code!),
    enabled: !!code,
  });
}

export function useWallet(tab: WalletTab, owner?: PromotionOwner) {
  return useQuery({
    queryKey: promotionKeys.walletTab(tab, owner),
    queryFn: () => claimApi.wallet(tab, owner),
  });
}

function patchStrips(
  queryClient: ReturnType<typeof useQueryClient>,
  id: number,
  patch: Partial<ClaimableCode>,
) {
  for (const key of stripKeys) {
    queryClient.setQueriesData<ClaimableCode[]>({ queryKey: key }, (codes) =>
      codes?.map((code) => (code.id === id ? { ...code, ...patch } : code)),
    );
  }
}

/** Everything that lists a buyer's codes: the strips, the wallet and the cart picker. */
async function refreshAfterClaim(queryClient: ReturnType<typeof useQueryClient>) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: promotionKeys.all }),
    queryClient.invalidateQueries({ queryKey: ["checkout-promotions"] }),
    queryClient.invalidateQueries({ queryKey: ["checkout-promo-preview"] }),
  ]);
}

/**
 * Shows the ticket as "เก็บแล้ว" straight away and puts it back if the claim fails.
 * Claiming twice is fine: the BE answers with the first claim and `alreadyClaimed`.
 */
export function useClaimPromotion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, source }: { id: number; code?: string; source?: ClaimSource }) =>
      claimApi.claim(id, source),
    onMutate: async ({ id }) => {
      await Promise.all(stripKeys.map((queryKey) => queryClient.cancelQueries({ queryKey })));
      const snapshots = stripKeys.flatMap((queryKey) =>
        queryClient.getQueriesData<ClaimableCode[]>({ queryKey }),
      );
      patchStrips(queryClient, id, { claimed: true });
      return { snapshots };
    },
    onError: (error, { id }, context) => {
      for (const [key, data] of context?.snapshots ?? []) {
        queryClient.setQueryData<ClaimableCode[]>(key as QueryKey, data);
      }
      if (hasErrorCode(error, "PROMO_CLAIM_FULL")) {
        patchStrips(queryClient, id, { remainingClaims: 0 });
      }
    },
    onSettled: () => refreshAfterClaim(queryClient),
  });
}

export function useClaimByCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => claimApi.claimByCode(code),
    onSuccess: () => refreshAfterClaim(queryClient),
  });
}
