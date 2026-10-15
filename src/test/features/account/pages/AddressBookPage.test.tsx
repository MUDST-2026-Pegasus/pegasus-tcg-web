import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithProviders } from "@/test/utils";
import { AddressBookPage } from "@/features/account/pages/AddressBookPage";
import * as addressApi from "@/features/account/address.api";
import * as authQueries from "@/features/auth/auth.queries";
import type { Address } from "@/features/account/address.types";
import type { UserProfile } from "@/features/auth/auth.types";

vi.mock("@/features/account/address.api", () => ({
  getAddresses: vi.fn(),
  getAddress: vi.fn(),
  createAddress: vi.fn(),
  updateAddress: vi.fn(),
  deleteAddress: vi.fn(),
}));

const mockUser: UserProfile = {
  id: 1,
  email: "ash@pokemon.com",
  username: "ashketchum",
  displayName: "Ash Ketchum",
  roles: ["BUYER"],
  status: "ACTIVE",
  bio: "Pokemon master",
  phone: "0812345678",
  avatarUrl: null,
  createdAt: "2026-01-01T00:00:00Z",
  lastLoginAt: null,
};

const mockAddresses: Address[] = [
  {
    id: 1,
    userId: 1,
    label: "Home",
    recipientName: "Ash Ketchum",
    phone: "0812345678",
    line1: "123 Pallet Town",
    line2: null,
    district: "Kanto",
    subdistrict: "Pallet",
    province: "Bangkok",
    postalCode: "10110",
    countryCode: "TH",
    defaultShipping: true,
    defaultBilling: true,
    createdAt: "2026-01-01T00:00:00Z",
  },
  {
    id: 2,
    userId: 1,
    label: "Gym",
    recipientName: "Misty Waterflower",
    phone: "0898765432",
    line1: "456 Cerulean Gym",
    line2: null,
    district: "Cerulean",
    subdistrict: "Gym",
    province: "Bangkok",
    postalCode: "10120",
    countryCode: "TH",
    defaultShipping: false,
    defaultBilling: false,
    createdAt: "2026-01-01T00:00:00Z",
  },
];

describe("AddressBookPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(authQueries, "useAuth").mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
    } as any);
  });

  afterEach(() => {
    cleanup();
    document.body.innerHTML = "";
  });

  it("renders empty state when there are no addresses", async () => {
    vi.mocked(addressApi.getAddresses).mockResolvedValue([]);

    renderWithProviders(<AddressBookPage />);

    expect(await screen.findByText("No saved addresses yet")).toBeInTheDocument();
    expect(screen.getByText("Save a shipping destination now and checkout will be one step shorter.")).toBeInTheDocument();
  });

  it("renders address cards when addresses are loaded", async () => {
    vi.mocked(addressApi.getAddresses).mockResolvedValue(mockAddresses);

    renderWithProviders(<AddressBookPage />);

    expect(await screen.findByRole("heading", { name: "Address Book" })).toBeInTheDocument();
    expect(await screen.findByText("Misty Waterflower")).toBeInTheDocument();
    expect(screen.getByText(/123 Pallet Town/)).toBeInTheDocument();
  });

  it("opens add new address dialog when Add New Address is clicked", async () => {
    vi.mocked(addressApi.getAddresses).mockResolvedValue(mockAddresses);
    const user = userEvent.setup();

    renderWithProviders(<AddressBookPage />);

    expect(await screen.findByText("Misty Waterflower")).toBeInTheDocument();

    const addButtons = screen.getAllByRole("button", { name: /Add New Address/i });
    await user.click(addButtons[0]);

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Add New Address" })).toBeInTheDocument();
  });

  it("opens delete confirmation dialog when Delete is clicked on an address card", async () => {
    vi.mocked(addressApi.getAddresses).mockResolvedValue(mockAddresses);
    const user = userEvent.setup();

    renderWithProviders(<AddressBookPage />);

    expect(await screen.findByText("Misty Waterflower")).toBeInTheDocument();

    const deleteButtons = screen.getAllByRole("button", { name: "Delete" });
    await user.click(deleteButtons[0]);

    const dialog = await screen.findByRole("alertdialog");
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText("Delete this address?")).toBeInTheDocument();
    expect(screen.getByText(/Past orders keep their own copy/)).toBeInTheDocument();
  });
});
