import { translate, useLanguage } from "@/lib/language";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CartItemResponse } from "./cart.types";
import { useCheckoutPromotionList, useCheckoutPromotionPreview } from "./cart.queries";
import { formatPromotionError, normalizePromotionCode } from "./checkout.format";
import {
  readPromotionManual,
  readPromotionSelection,
  savePromotionManual,
  savePromotionSelection,
} from "./promotions.storage";
import type { PromoPreview, PromotionSelection, PromotionUiError } from "./promotions.types";

export type PromotionOwnerKey = "PLATFORM" | number;

const EMPTY_SELECTION: PromotionSelection = { platformCode: null, sellerCodes: {} };
const NO_SHIPPING: Record<number, number> = {};

/** bestPick comes back with string seller ids; the cart keys them by number. */
function normalizePick(pick: PromoPreview["bestPick"]): PromotionSelection {
  const sellerCodes: Record<number, string> = {};
  for (const [key, code] of Object.entries(pick?.sellerCodes ?? {})) {
    if (code) sellerCodes[Number(key)] = normalizePromotionCode(code);
  }
  return { platformCode: pick?.platformCode ? normalizePromotionCode(pick.platformCode) : null, sellerCodes };
}

function sameSelection(a: PromotionSelection | null, b: PromotionSelection | null) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function withCode(selection: PromotionSelection, owner: PromotionOwnerKey, code: string | null): PromotionSelection {
  if (owner === "PLATFORM") return { ...selection, platformCode: code };
  const sellerCodes = { ...selection.sellerCodes };
  if (code) sellerCodes[owner] = code;
  else delete sellerCodes[owner];
  return { ...selection, sellerCodes };
}

function ownerOf(outcome: PromoPreview["codes"][number]): PromotionOwnerKey | null {
  return outcome.ownerType === "PLATFORM" ? "PLATFORM" : outcome.sellerProfileId;
}

interface CartPromotionsOptions {
  /** The ticked items — discounts are worked out on these only. */
  items: CartItemResponse[];
  enabled: boolean;
  userId?: number;
  cartId?: number;
  onAutoPicked?: (saving: number) => void;
}

/**
 * Codes in the cart (C1/C2). Until the buyer picks a code the BE's bestPick
 * is used and refreshed whenever the ticked items change; once they pick or
 * clear one, their choice stands and codes that stop working drop out with a
 * notice (C2-E). The selection is stored for CheckoutPage.
 */
export function useCartPromotions({ items, enabled, userId, cartId, onAutoPicked }: CartPromotionsOptions) {
  useLanguage();
  const [manual, setManual] = useState(readPromotionManual);
  const [selection, setSelection] = useState<PromotionSelection>(readPromotionSelection);
  const [debounced, setDebounced] = useState(selection);
  const [autoSelection, setAutoSelection] = useState<PromotionSelection | null>(null);
  const [picker, setPicker] = useState<PromotionOwnerKey | null>(null);
  const [notices, setNotices] = useState<Partial<Record<string, string>>>({});
  const [typed, setTyped] = useState<{ owner: PromotionOwnerKey; code: string } | null>(null);
  /** `promoCode` is what was typed; `code` is why it failed (PROMO_NOT_CLAIMED, …). */
  const [typedError, setTypedError] = useState<(PromotionUiError & { promoCode: string }) | null>(null);
  const [typedApplied, setTypedApplied] = useState<{ owner: PromotionOwnerKey; code: string; discount: number | null } | null>(null);

  const cartItemIds = useMemo(() => items.map((item) => item.id), [items]);
  const itemsKey = useMemo(
    () => items.map((item) => [item.id, item.quantity, item.currentPrice ?? item.unitPriceAtAdd]),
    [items],
  );
  const sellerIds = useMemo(
    () => new Set(items.map((item) => item.sellerProfileId).filter((id): id is number => id != null)),
    [items],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(selection), 180);
    return () => window.clearTimeout(timer);
  }, [selection]);

  // Codes for a shop with nothing ticked stay remembered but are not sent.
  const requested = useMemo<PromotionSelection>(() => ({
    platformCode: debounced.platformCode,
    sellerCodes: Object.fromEntries(
      Object.entries(debounced.sellerCodes).filter(([id]) => sellerIds.has(Number(id))),
    ),
  }), [debounced, sellerIds]);

  const active = enabled && items.length > 0;
  const promotionList = useCheckoutPromotionList(cartItemIds, { userId, cartId, enabled: active, itemsKey });
  const promoPreview = useCheckoutPromotionPreview({
    cartItemIds,
    shippingOptionBySeller: NO_SHIPPING,
    selection: manual ? requested : EMPTY_SELECTION,
    autoPick: !manual,
    itemsKey,
    keepPrevious: true,
    userId,
    cartId,
    enabled: active && (!manual || debounced === selection),
  });

  const preview = promoPreview.data;
  const settled = !!preview && !promoPreview.isFetching && !promoPreview.isPlaceholderData;

  const pick = !manual && settled && preview.bestPick !== undefined ? normalizePick(preview.bestPick) : null;
  if (pick && !sameSelection(pick, autoSelection)) setAutoSelection(pick);

  const effective = manual ? selection : autoSelection ?? EMPTY_SELECTION;

  useEffect(() => {
    savePromotionSelection(effective);
  }, [effective]);

  // "เลือกโค้ดที่ลดมากที่สุดให้แล้ว" once per pick, not on every re-preview.
  const announced = useRef<string | null>(null);
  useEffect(() => {
    if (manual || !autoSelection || !preview) return;
    const key = JSON.stringify(autoSelection);
    const hasCode = !!autoSelection.platformCode || Object.keys(autoSelection.sellerCodes).length > 0;
    if (!hasCode || announced.current === key) return;
    announced.current = key;
    onAutoPicked?.(preview.platformDiscountTotal + preview.sellerDiscountTotal);
  }, [manual, autoSelection, preview, onAutoPicked]);

  const claimedCodes = useMemo(
    () => new Set((promotionList.data ?? []).filter((p) => p.source === "CLAIMED").map((p) => p.code)),
    [promotionList.data],
  );

  // Manual codes that stopped working drop out. A code just typed in shows its
  // error in the picker; anything else gets the C2-E notice on its card.
  useEffect(() => {
    if (!manual || !settled || debounced !== selection) return;
    const timer = window.setTimeout(() => {
      const failed = preview.codes.filter((code) => code.status !== "APPLIED" && !code.pendingShipping);

      if (typed) {
        const outcome = preview.codes.find((code) => code.code === typed.code && ownerOf(code) === typed.owner);
        if (outcome?.status === "APPLIED") {
          setTypedApplied({ ...typed, discount: outcome.discount });
          if (claimedCodes.has(typed.code)) setPicker(null);
        } else if (outcome) {
          setTypedError({
            owner: typed.owner,
            promoCode: typed.code,
            code: outcome.status,
            message: formatPromotionError(outcome.status, { sellerName: outcome.sellerName, shortfall: outcome.shortfall }),
          });
        }
        setTyped(null);
      }

      const dropped = failed.filter((code) => {
        const owner = ownerOf(code);
        if (owner === null) return false;
        const chosen = owner === "PLATFORM" ? selection.platformCode : selection.sellerCodes[owner];
        return chosen === code.code;
      });
      if (!dropped.length) return;

      const nextNotices: Record<string, string> = {};
      for (const code of dropped) {
        if (typed && code.code === typed.code) continue;
        const reason = formatPromotionError(code.status, { sellerName: code.sellerName, shortfall: code.shortfall });
        nextNotices[String(ownerOf(code))] =
          translate(`นำ ${code.code} ออกแล้ว: ${reason}${claimedCodes.has(code.code) ? translate(" (ยังอยู่ในกระเป๋าโค้ด)", " (still in your coupon wallet)") : ""}`, `${code.code} removed: ${reason}${claimedCodes.has(code.code) ? translate(" (ยังอยู่ในกระเป๋าโค้ด)", " (still in your coupon wallet)") : ""}`);
      }
      setNotices((previous) => ({ ...previous, ...nextNotices }));
      setSelection((previous) => dropped.reduce((next, code) => withCode(next, ownerOf(code)!, null), previous));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [manual, settled, preview, debounced, selection, typed, claimedCodes]);

  const setCode = (owner: PromotionOwnerKey, code: string | null) => {
    const normalized = code ? normalizePromotionCode(code) : null;
    setNotices((previous) => ({ ...previous, [String(owner)]: undefined }));
    setTypedError((previous) => (previous?.owner === owner ? null : previous));
    setTypedApplied((previous) => (previous?.owner === owner ? null : previous));
    if (!manual) {
      setManual(true);
      savePromotionManual();
    }
    // Picking for the first time starts from what auto-pick chose, not from scratch.
    setSelection((previous) => withCode(manual ? previous : effective, owner, normalized));
  };

  const tryCode = (owner: PromotionOwnerKey, code: string) => {
    setCode(owner, code);
    setTyped({ owner, code: normalizePromotionCode(code) });
  };

  const sellerDiscount = (sellerId: number) =>
    preview?.sellers.find((seller) => seller.sellerProfileId === sellerId)?.sellerDiscount ?? 0;

  const appliedCode = (owner: PromotionOwnerKey) => {
    const chosen = owner === "PLATFORM" ? effective.platformCode : effective.sellerCodes[owner];
    if (!chosen || !preview) return null;
    const outcome = preview.codes.find((code) => code.code === chosen && ownerOf(code) === owner);
    return outcome && (outcome.status === "APPLIED" || outcome.pendingShipping) ? outcome : null;
  };

  return {
    selection: effective,
    autoPicked: !manual && !!autoSelection,
    manual,
    picker,
    setPicker,
    notices,
    typedError,
    typedApplied,
    /** A typed code is still being checked. */
    checking: typed !== null,
    promotionList,
    preview,
    previewError: promoPreview.isError ? promoPreview.error : null,
    claimedCodes,
    setCode,
    tryCode,
    sellerDiscount,
    appliedCode,
  };
}
