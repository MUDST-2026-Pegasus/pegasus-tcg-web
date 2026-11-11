import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

import { toast } from "@/components/ui/toast";
import { afterSalesApi } from "@/features/finance/after-sales.api";
import type { SellerReturnRequest } from "@/features/finance/after-sales.types";
import { useReturnActions } from "@/features/finance/seller-returns/useReturnActions";

const item: SellerReturnRequest = {
  id: 27,
  sellerOrderId: 88,
  sellerOrderNumber: "ORD-88",
  buyer: { username: "buyer", displayName: "Buyer" },
  sellerOrderGrandTotal: 120,
  deliveredAt: null,
  autoCompleteAt: null,
  reasonCode: "DAMAGED",
  description: "Bent card",
  status: "REQUESTED",
  resolution: null,
  refundAmount: null,
  evidenceKeys: [],
  returnTrackingNumber: null,
  requestedAt: "2026-11-01T00:00:00Z",
  reviewedAt: null,
  receivedAt: null,
  closedAt: null,
  items: [],
};

function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { ...renderHook(() => useReturnActions(), { wrapper }), client };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useReturnActions", () => {
  it("merges per-return draft choices and submits approve, reject, and receive decisions", async () => {
    vi.spyOn(afterSalesApi, "approveReturn").mockResolvedValue({} as never);
    vi.spyOn(afterSalesApi, "rejectReturn").mockResolvedValue({} as never);
    vi.spyOn(afterSalesApi, "receiveReturn").mockResolvedValue({} as never);
    const { result } = setup();

    expect(result.current.getDraft(item.id)).toMatchObject({ resolution: "FULL_REFUND", shipBack: true, restock: true });
    act(() => result.current.updateDraft(item.id, { resolution: "PARTIAL_REFUND", partialAmount: "45", shipBack: false, restock: false }));
    expect(result.current.getDraft(item.id)).toMatchObject({ resolution: "PARTIAL_REFUND", partialAmount: "45", shipBack: false, restock: false });

    act(() => result.current.setApproveModalItem(item));
    await act(async () => result.current.handleApproveConfirm());
    expect(afterSalesApi.approveReturn).toHaveBeenCalledWith(27, "PARTIAL_REFUND", 45, false);
    expect(result.current.approveModalItem).toBeNull();

    act(() => result.current.setRejectModalItem(item));
    await act(async () => result.current.handleRejectConfirm());
    expect(afterSalesApi.rejectReturn).toHaveBeenCalledWith(27);
    expect(result.current.rejectModalItem).toBeNull();

    act(() => result.current.setReceiveModalItem(item));
    await act(async () => result.current.handleReceiveConfirm());
    expect(afterSalesApi.receiveReturn).toHaveBeenCalledWith(27, false);
    expect(result.current.receiveModalItem).toBeNull();
    expect(result.current.busyId).toBeNull();
  });

  it("does nothing without an open modal and clears busy state after an API error", async () => {
    const toastSpy = vi.spyOn(toast, "add").mockImplementation(vi.fn());
    const reject = vi.spyOn(afterSalesApi, "rejectReturn").mockRejectedValue(new Error("offline"));
    const { result } = setup();

    await act(async () => {
      await result.current.handleApproveConfirm();
      await result.current.handleRejectConfirm();
      await result.current.handleReceiveConfirm();
    });
    expect(reject).not.toHaveBeenCalled();

    act(() => result.current.setRejectModalItem(item));
    await act(async () => result.current.handleRejectConfirm());
    expect(reject).toHaveBeenCalledWith(27);
    expect(toastSpy).toHaveBeenCalledWith(expect.objectContaining({ type: "error" }));
    expect(result.current.rejectModalItem).toEqual(item);
    expect(result.current.busyId).toBeNull();
  });
});
