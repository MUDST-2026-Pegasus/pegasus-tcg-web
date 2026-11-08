import { useMemo, useState } from "react";
import type { useShippingQuotes } from "./cart.queries";
import type { CartItemResponse } from "./cart.types";

/**
 * Checkout items grouped by seller, each with its shipping quote and the chosen
 * delivery option (buyer's pick, else the quote default, else the first option).
 */
export function useShippingSelection(
  checkoutItems: CartItemResponse[],
  quotes: ReturnType<typeof useShippingQuotes>,
) {
  const [shippingChoices, setShippingChoices] = useState<Record<number, number>>({});
  const [selectionQuotes, setSelectionQuotes] = useState(quotes.data);

  // Reconcile only fresh quotes: a removed choice must not reappear on a later refresh.
  if (quotes.data !== selectionQuotes && !quotes.isPlaceholderData) {
    setSelectionQuotes(quotes.data);
    const nextChoices: Record<number, number> = {};
    for (const quote of quotes.data ?? []) {
      const selected =
        quote.options.find(
          (option) => option.id === shippingChoices[quote.sellerProfileId],
        ) ??
        quote.options.find((option) => option.id === quote.defaultOptionId);
      if (selected) nextChoices[quote.sellerProfileId] = selected.id;
    }
    setShippingChoices(nextChoices);
  }

  const sellerGroups = useMemo(() => {
    const groups = new Map<number | null, CartItemResponse[]>();
    for (const item of checkoutItems) {
      const group = groups.get(item.sellerProfileId) ?? [];
      group.push(item);
      groups.set(item.sellerProfileId, group);
    }
    return [...groups].map(([sellerId, items]) => ({
      sellerId,
      items,
      quote: quotes.data?.find((quote) => quote.sellerProfileId === sellerId),
    }));
  }, [checkoutItems, quotes.data]);

  const selectedOptions = sellerGroups.map(
    ({ sellerId, quote }) =>
      quote?.options.find(
        (option) =>
          option.id === (sellerId == null ? undefined : shippingChoices[sellerId]),
      ) ??
      quote?.options.find((option) => option.id === quote.defaultOptionId) ??
      quote?.options[0],
  );

  const shippingReady =
    !quotes.isPending &&
    !quotes.isFetching &&
    !quotes.isPlaceholderData &&
    !quotes.isError &&
    sellerGroups.length > 0 &&
    selectedOptions.every(Boolean);

  const shippingFee = selectedOptions.reduce(
    (sum, option) => sum + (option?.fee ?? 0),
    0,
  );

  const shippingOptionBySeller: Record<number, number> = useMemo(() => {
    const map: Record<number, number> = {};
    sellerGroups.forEach(({ sellerId }, index) => {
      if (sellerId != null && selectedOptions[index]) {
        map[sellerId] = selectedOptions[index]!.id;
      }
    });
    return map;
  }, [sellerGroups, selectedOptions]);

  return {
    sellerGroups,
    selectedOptions,
    shippingReady,
    shippingFee,
    shippingOptionBySeller,
    setShippingChoices,
  };
}

export type CheckoutSellerGroup = ReturnType<typeof useShippingSelection>["sellerGroups"][number];
