import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { CodePickerDialog } from "@/features/promotions/CodePickerDialog";
import { claimAuthUrl } from "@/features/promotions/claim-redirect";
import { claimErrorMessage } from "@/features/promotions/claim.format";
import { useClaimByCode, useClaimPromotion } from "@/features/promotions/claim.queries";
import { checkoutMoney } from "../checkout.format";
import type { AvailablePromotion } from "../promotions.types";
import type { useCartPromotions } from "../useCartPromotions";
import { useTranslate } from "@/lib/i18n";

type CartPromotions = ReturnType<typeof useCartPromotions>;

export interface CartCodePickerProps {
  promotions: CartPromotions;
  sellerName?: string | null;
  sellerUsername?: string | null;
  isGuest: boolean;
}

/** C2-A/B/C/D: the shared picker wired to the cart, with collecting and typed codes. */
export function CartCodePicker({ promotions, sellerName, sellerUsername, isGuest }: CartCodePickerProps) {
  const { t } = useTranslate("promotions");
  const navigate = useNavigate();
  const claim = useClaimPromotion();
  const claimByCode = useClaimByCode();
  const owner = promotions.picker;

  const toLogin = (promotionId?: number) =>
    navigate(promotionId ? claimAuthUrl("/login", "/cart", promotionId) : "/login?next=%2Fcart");

  const handleClaim = (promotion: AvailablePromotion) => {
    if (isGuest) {
      toLogin(promotion.id);
      return;
    }
    claim.mutate({ id: promotion.id, code: promotion.code, source: "CART" }, {
      onSuccess: () => {
        // "กดเก็บ = เก็บ + เลือกใช้ทันที" when it already fits this cart.
        if (promotion.applicable && owner !== null) {
          promotions.setCode(owner, promotion.code);
          promotions.setPicker(null);
        }
        toast.add({ type: "success", title: t("cart.cartCodePicker.title", "เก็บ {code} แล้ว · ใช้ได้ในตะกร้า", { code: promotion.code }) });
      },
      onError: (error) => toast.add({ type: "error", title: claimErrorMessage(error) }),
    });
  };

  const saveTyped = (code: string, thenApply: boolean) => {
    claimByCode.mutate(code, {
      onSuccess: () => {
        toast.add({ type: "success", title: t("cart.cartCodePicker.title", "เก็บ {code} แล้ว · ใช้ได้ในตะกร้า", { code }) });
        if (thenApply && owner !== null) promotions.tryCode(owner, code);
      },
      onError: (error) => toast.add({ type: "error", title: claimErrorMessage(error) }),
    });
  };

  const applied = promotions.typedApplied?.owner === owner ? promotions.typedApplied : null;
  const notClaimedCode = promotions.typedError?.owner === owner && promotions.typedError.code === "PROMO_NOT_CLAIMED"
    ? promotions.typedError.promoCode : null;

  const inputFooter = applied ? (
    <div role="status" className="mt-2 flex items-center justify-between gap-2 rounded-lg bg-emerald-50 px-3 py-2">
      <span className="text-xs text-emerald-800">
        {t("cart.cartCodePicker.span", "ใช้โค้ด")} {applied.code} {t("cart.cartCodePicker.span2", "แล้ว")}{applied.discount ? t("cart.cartCodePicker.span3", " ลด {value}", { value: checkoutMoney(applied.discount) }) : ""}
      </span>
      {!isGuest && !promotions.claimedCodes.has(applied.code) && (
        <Button type="button" size="xs" variant="outline" className="rounded-full bg-background"
          disabled={claimByCode.isPending} onClick={() => saveTyped(applied.code, false)}>
          {claimByCode.isPending ? <Spinner /> : t("cart.cartCodePicker.button", "เก็บไว้ใช้ครั้งหน้า")}
        </Button>
      )}
    </div>
  ) : notClaimedCode ? (
    <div className="mt-2 flex justify-end">
      <Button type="button" size="xs" className="rounded-full" disabled={claimByCode.isPending}
        onClick={() => (isGuest ? toLogin() : saveTyped(notClaimedCode, true))}>
        {claimByCode.isPending ? <Spinner /> : isGuest ? t("cart.cartCodePicker.button2", "เข้าสู่ระบบเพื่อเก็บโค้ด") : t("cart.cartCodePicker.button3", "เก็บแล้วใช้เลย")}
      </Button>
    </div>
  ) : null;

  return (
    <CodePickerDialog
      open={owner !== null}
      onOpenChange={(open) => !open && promotions.setPicker(null)}
      owner={owner ?? "PLATFORM"}
      sellerName={sellerName}
      promotions={promotions.promotionList.data ?? []}
      selectedCode={owner === null ? null : owner === "PLATFORM"
        ? promotions.selection.platformCode
        : promotions.selection.sellerCodes[owner] ?? null}
      onSelect={(code) => { if (owner !== null) promotions.setCode(owner, code); }}
      onTryCode={(code) => { if (owner !== null) promotions.tryCode(owner, code); }}
      onClaim={handleClaim}
      claimingId={claim.isPending ? claim.variables?.id ?? null : null}
      inputFooter={inputFooter}
      error={promotions.typedError}
      loading={promotions.checking}
      isGuest={isGuest}
      onLogin={() => toLogin()}
      onRegister={() => navigate("/register?next=%2Fcart")}
      onNavigateHome={() => navigate("/")}
      onNavigateToStore={() => navigate(sellerUsername ? `/u/${encodeURIComponent(sellerUsername)}` : "/products")}
    />
  );
}
