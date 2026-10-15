import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";

import { renderWithProviders } from "@/test/utils";
import { ProfilePage } from "@/features/account/pages/ProfilePage";
import * as authQueries from "@/features/auth/auth.queries";
import * as addressQueries from "@/features/account/address.queries";
import * as orderQueries from "@/features/account/orders.queries";
import type { OrderDetails } from "@/features/account/orders.types";

const latestOrder = {
  id: 15,
  orderNumber: "ORD-15",
  status: "PAID",
  placedAt: "2026-10-15T10:00:00Z",
  grandTotal: 1050,
  sellerOrders: [{ status: "SHIPPED" }],
} as OrderDetails;

describe("ProfilePage latest order", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(authQueries, "useAuth").mockReturnValue({
      user: {
        id: 1,
        username: "buyer",
        email: "buyer@example.com",
        displayName: "Test Buyer",
        roles: ["BUYER"],
        avatarUrl: null,
        phone: null,
        bio: null,
        status: "ACTIVE",
        createdAt: "2026-01-01T00:00:00Z",
        lastLoginAt: null,
      },
      isLoading: false,
      isAuthenticated: true,
      roles: ["BUYER"],
      hasRole: (...wanted) => wanted.includes("BUYER"),
    });
    vi.spyOn(addressQueries, "useAddresses").mockReturnValue({
      data: [], isLoading: false, isError: false, error: null, refetch: vi.fn(),
    } as unknown as ReturnType<typeof addressQueries.useAddresses>);
  });

  it("shows the latest order's buyer-facing status and links to its details", () => {
    const ordersSpy = vi.spyOn(orderQueries, "useBuyerOrders").mockReturnValue({
      data: [latestOrder], isLoading: false, isError: false,
    } as unknown as ReturnType<typeof orderQueries.useBuyerOrders>);

    renderWithProviders(<ProfilePage />);

    expect(ordersSpy).toHaveBeenCalledWith(0, 1);
    expect(screen.getByText("Order #ORD-15")).toBeInTheDocument();
    expect(screen.getByText("In Transit")).toBeInTheDocument();
    expect(screen.getByText("฿1,050")).toBeInTheDocument();
    expect(screen.getByText("View Order Details").closest("a")).toHaveAttribute(
      "href", "/account/orders?orderId=15",
    );
  });

  it("shows the empty state only when there are no orders", () => {
    vi.spyOn(orderQueries, "useBuyerOrders").mockReturnValue({
      data: [], isLoading: false, isError: false,
    } as unknown as ReturnType<typeof orderQueries.useBuyerOrders>);

    renderWithProviders(<ProfilePage />);

    expect(screen.getByText("No recent orders")).toBeInTheDocument();
  });
});
