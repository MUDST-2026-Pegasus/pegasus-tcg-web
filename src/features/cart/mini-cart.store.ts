import { useSyncExternalStore } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { cartKeys } from "./cart.queries";
import type { CartResponse } from "./cart.types";

export type MiniCartOpening = {
  listingId: number;
  previousQuantity: number;
  trigger: HTMLElement | null;
};
const initial = {
  isOpen: false,
  listingId: 0,
  previousQuantity: 0,
  trigger: null as HTMLElement | null,
};
let snapshot = initial;
const listeners = new Set<() => void>();
const publish = () => listeners.forEach((listener) => listener());
export const miniCartStore = {
  getSnapshot: () => snapshot,
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  open: (opening: MiniCartOpening) => {
    snapshot = { ...opening, isOpen: true };
    publish();
  },
  close: () => {
    snapshot = { ...snapshot, isOpen: false };
    publish();
  },
};

/** Capture before POST, open after mutation/refetch. Never builds cart rows from listing data. */
export function useMiniCart() {
  const client = useQueryClient();
  const state = useSyncExternalStore(
    miniCartStore.subscribe,
    miniCartStore.getSnapshot,
    () => initial,
  );
  return {
    ...state,
    capture: (listingId: number, trigger?: HTMLElement): MiniCartOpening => ({
      listingId,
      previousQuantity:
        client
          .getQueryData<CartResponse>(cartKeys.all)
          ?.items.find((i) => i.listingId === listingId)?.quantity ?? 0,
      trigger:
        trigger ??
        (document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null),
    }),
    open: miniCartStore.open,
    close: miniCartStore.close,
  };
}
