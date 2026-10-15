import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithProviders } from "@/test/utils";
import { ProfilePage } from "@/features/account/pages/ProfilePage";
import * as authQueries from "@/features/auth/auth.queries";
import * as addressQueries from "@/features/account/address.queries";
import * as orderQueries from "@/features/account/orders.queries";
import type { Address } from "@/features/account/address.types";
import type { AuthUser } from "@/features/auth/auth.types";
import type { OrderDetails } from "@/features/account/orders.types";

const mockUser: AuthUser = {
  id: 1,
  username: "johndoe",
  email: "john@example.com",
  displayName: "John Doe",
  roles: ["BUYER"],
  status: "ACTIVE",
  phone: "0812345678",
  bio: "Trading card enthusiast",
  avatarUrl: null,
  createdAt: "2026-01-01T00:00:00Z",
  lastLoginAt: "2026-10-15T10:00:00Z",
};

const mockAddresses: Address[] = [
  {
    id: 1,
    userId: 1,
    label: "บ้าน",
    recipientName: "John Doe",
    phone: "0812345678",
    line1: "123 Sukhumvit Road",
    line2: null,
    subdistrict: "Khlong Toei",
    district: "Khlong Toei",
    province: "Bangkok",
    postalCode: "10110",
    countryCode: "TH",
    defaultShipping: true,
    defaultBilling: true,
    createdAt: "2026-01-01T00:00:00Z",
  },
];

const latestOrder = {
  id: 15,
  orderNumber: "ORD-15",
  status: "PAID",
  placedAt: "2026-10-15T10:00:00Z",
  grandTotal: 1050,
  sellerOrders: [{ status: "SHIPPED" }],
} as OrderDetails;

describe("ProfilePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(authQueries, "useAuth").mockReturnValue({
      user: mockUser,
      isLoading: false,
      isAuthenticated: true,
      roles: ["BUYER"],
      hasRole: (...wanted) => wanted.includes("BUYER"),
    });
    vi.spyOn(addressQueries, "useAddresses").mockReturnValue({
      data: mockAddresses,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof addressQueries.useAddresses>);
    vi.spyOn(orderQueries, "useBuyerOrders").mockReturnValue({
      data: [latestOrder],
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof orderQueries.useBuyerOrders>);
  });

  it("renders profile summary, order status card, and default address", async () => {
    renderWithProviders(<ProfilePage />, { route: "/account/profile" });

    // Profile header and user details
    expect(screen.getByText("My Profile")).toBeInTheDocument();
    expect(screen.getAllByText("John Doe").length).toBeGreaterThan(0);
    expect(screen.getAllByText("john@example.com").length).toBeGreaterThan(0);
    expect(screen.getByText("0812345678")).toBeInTheDocument();
    expect(screen.getByText("Trading card enthusiast")).toBeInTheDocument();

    // Order status card
    expect(screen.getByText("Order #ORD-15")).toBeInTheDocument();

    // Address card
    expect(await screen.findByText(/123 Sukhumvit Road/i)).toBeInTheDocument();
  });

  it("opens edit profile dialog when Edit Profile is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ProfilePage />, { route: "/account/profile" });

    const editBtn = screen.getByRole("button", { name: /Edit Profile/i });
    await user.click(editBtn);

    expect(
      await screen.findByText("Update your personal information and profile display."),
    ).toBeInTheDocument();
  });

  it("shows the latest order's buyer-facing status and links to its details", () => {
    const ordersSpy = vi.spyOn(orderQueries, "useBuyerOrders").mockReturnValue({
      data: [latestOrder],
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof orderQueries.useBuyerOrders>);

    renderWithProviders(<ProfilePage />);

    expect(ordersSpy).toHaveBeenCalledWith(0, 1);
    expect(screen.getByText("Order #ORD-15")).toBeInTheDocument();
    expect(screen.getByText("In Transit")).toBeInTheDocument();
    expect(screen.getByText("฿1,050")).toBeInTheDocument();
    expect(screen.getByText("View Order Details").closest("a")).toHaveAttribute(
      "href",
      "/account/orders?orderId=15",
    );
  });

  it("shows the empty state only when there are no orders", () => {
    vi.spyOn(orderQueries, "useBuyerOrders").mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof orderQueries.useBuyerOrders>);

    renderWithProviders(<ProfilePage />);

    expect(screen.getByText("No recent orders")).toBeInTheDocument();
  });
});
