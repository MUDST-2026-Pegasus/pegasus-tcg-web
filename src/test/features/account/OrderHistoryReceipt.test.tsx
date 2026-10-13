import { beforeEach, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithProviders } from "@/test/utils";
import { OrderHistoryPage } from "@/features/account/pages/OrderHistoryPage";
import { ordersApi } from "@/features/account/orders.api";
import type { OrderDetails } from "@/features/account/orders.types";

const useBuyerOrders = vi.fn();

vi.mock("@/features/account/orders.queries", () => ({ useBuyerOrders: () => useBuyerOrders() }));
vi.mock("@/features/auth/auth.queries", () => ({ useAuth: () => ({ user: null }) }));
vi.mock("@/features/account/orders.api", () => ({ ordersApi: { confirmReceived: vi.fn() } }));
vi.mock("@/components/ui/toast", () => ({ toast: { add: vi.fn() } }));

const order = {
  id: 12,
  orderNumber: "PGS-12",
  buyerId: 1,
  status: "PAID",
  currency: "THB",
  placedAt: "2026-10-13T00:00:00Z",
  paidAt: "2026-10-13T00:00:00Z",
  completedAt: null,
  cancelledAt: null,
  shippingAddressId: null,
  shippingAddressSnapshot: null,
  buyerNote: null,
  itemsSubtotal: 1000,
  shippingTotal: 50,
  discountTotal: 0,
  grandTotal: 1050,
  sellerOrders: [{
    id: 30, salesOrderId: 12, sellerProfileId: 2, sellerName: "TCG Corner",
    sellerOrderNumber: "PGS-12-S1", status: "SHIPPED", itemsSubtotal: 1000,
    shippingFee: 50, discountAmount: 0, grandTotal: 1050, commissionAmount: 0,
    sellerNetAmount: 1000, acceptedAt: null, shippedAt: "2026-10-13T00:00:00Z",
    deliveredAt: null, autoCompleteAt: null, completedAt: null, cancelledAt: null,
    cancelReason: null, createdAt: "2026-10-13T00:00:00Z", items: [], shipments: [], statusHistory: [],
  }],
} satisfies OrderDetails;

beforeEach(() => {
  vi.clearAllMocks();
  useBuyerOrders.mockReturnValue({ data: [order], isLoading: false, error: null, refetch: vi.fn() });
});

it("confirms shipped seller orders through the parent order and updates the dialog", async () => {
  const completed = { ...order, sellerOrders: [{ ...order.sellerOrders[0], status: "COMPLETED" }] };
  vi.mocked(ordersApi.confirmReceived).mockResolvedValue(completed);
  const nativeConfirm = vi.spyOn(window, "confirm");
  const user = userEvent.setup();

  renderWithProviders(<OrderHistoryPage />, { route: "/account/orders" });
  await user.click(screen.getByRole("button", { name: "View Details" }));
  await user.click(screen.getByRole("button", { name: "Confirm receipt" }));
  expect(screen.getByRole("alertdialog", { name: "Confirm receipt?" })).toBeInTheDocument();
  expect(ordersApi.confirmReceived).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button", { name: "Confirm receipt" }));

  await waitFor(() => expect(ordersApi.confirmReceived).toHaveBeenCalledWith(12));
  expect(nativeConfirm).not.toHaveBeenCalled();
  await waitFor(() => expect(screen.queryByRole("button", { name: "Confirm receipt" })).not.toBeInTheDocument());
  expect(screen.getByText("สถานะพัสดุ: เสร็จสิ้น")).toBeInTheDocument();
});

it("does not offer receipt confirmation before a seller ships", async () => {
  useBuyerOrders.mockReturnValue({
    data: [{ ...order, sellerOrders: [{ ...order.sellerOrders[0], status: "PAID" }] }],
    isLoading: false, error: null, refetch: vi.fn(),
  });
  const user = userEvent.setup();

  renderWithProviders(<OrderHistoryPage />, { route: "/account/orders" });
  await user.click(screen.getByRole("button", { name: "View Details" }));

  expect(screen.queryByRole("button", { name: "Confirm receipt" })).not.toBeInTheDocument();
});
