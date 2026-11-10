import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import * as catalogApi from "@/features/admin/catalog.api";
import type {
  AdminCardListing,
  AdminCardListingPage,
  CatalogVariant,
} from "@/features/admin/catalog.types";
import { CatalogListingsTab } from "@/features/admin/components/CatalogListingsTab";
import { ApiError } from "@/lib/api";
import { renderWithProviders } from "@/test/utils";

vi.mock("@/features/admin/catalog.api", () => ({
  getCardListings: vi.fn(),
  blockListing: vi.fn(),
  unblockListing: vi.fn(),
}));

const variant = {
  id: 7,
  language: "JP",
  finish: "HOLO",
  edition: "UNLIMITED",
  printNote: null,
  active: true,
} as unknown as CatalogVariant;

const onSale: AdminCardListing = {
  id: 48213,
  catalogVariantId: 7,
  condition: "NM",
  gradingCompany: null,
  gradeValue: null,
  price: 1290,
  salePrice: null,
  saleEndsAt: null,
  pricingMode: "MANUAL",
  quantityAvailable: 4,
  quantityReserved: 1,
  quantityTotal: 5,
  status: "ACTIVE",
  lotLabel: "กล่อง A-12",
  publicNote: null,
  publishedAt: "2026-10-14T03:22:00Z",
  updatedAt: "2026-11-06T11:05:00Z",
  purchasable: true,
  seller: {
    sellerProfileId: 1,
    userId: 11,
    username: "minmin_tcg",
    displayName: "Minmin TCG",
    avatarUrl: null,
    status: "VERIFIED",
    onVacation: false,
    accountActive: true,
    ratingAvg: 4.9,
    ratingCount: 12,
  },
  block: null,
};

const blocked: AdminCardListing = {
  ...onSale,
  id: 48307,
  price: 590,
  quantityAvailable: 1,
  quantityReserved: 0,
  quantityTotal: 1,
  status: "BLOCKED",
  purchasable: false,
  seller: { ...onSale.seller, userId: 12, username: "fakeacc_099", displayName: "FA Cards" },
  block: {
    reason: "สงสัยการ์ดปลอม",
    blockedByUsername: "admin_boat",
    blockedAt: "2026-11-07T07:20:00Z",
    fromStatus: "ACTIVE",
  },
};

function page(items: AdminCardListing[]): AdminCardListingPage {
  return {
    listings: { items, page: 0, size: 20, totalItems: items.length, totalPages: 1 },
    summary: {
      shopCount: 2,
      listingCount: 2,
      availableQuantity: 4,
      availableShops: 1,
      reservedQuantity: 1,
      pausedQuantity: 3,
      blockedQuantity: 1,
      blockedListingCount: 1,
      closedShopQuantity: 0,
    },
  };
}

function renderTab() {
  renderWithProviders(
    <CatalogListingsTab
      productId={10}
      productName="Charizard ex"
      variants={[variant]}
    />,
  );
}

describe("CatalogListingsTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(catalogApi.getCardListings).mockResolvedValue(
      page([onSale, blocked]),
    );
  });

  it("shows who sells the card, how many are left, and the summary", async () => {
    renderTab();

    const row = (await screen.findByText("minmin_tcg")).closest("tr") as HTMLElement;
    expect(within(row).getByText("4 ใบ")).toBeInTheDocument();
    expect(within(row).getByText("จอง 1")).toBeInTheDocument();
    expect(within(row).getByText("พร้อมขาย")).toBeInTheDocument();
    expect(screen.getByText("2 ร้าน")).toBeInTheDocument();
    expect(screen.getByText("พัก 3 · ระงับ 1")).toBeInTheDocument();
    expect(screen.getByText("fakeacc_099")).toBeInTheDocument();
  });

  it("marks an open listing whose shop cannot sell", async () => {
    vi.mocked(catalogApi.getCardListings).mockResolvedValue(
      page([
        {
          ...onSale,
          purchasable: false,
          seller: { ...onSale.seller, onVacation: true },
        },
      ]),
    );
    renderTab();

    expect(
      await screen.findByText("ร้านปิดชั่วคราว · ซื้อไม่ได้"),
    ).toBeInTheDocument();
  });

  it("expands a row into its details and links", async () => {
    const user = userEvent.setup();
    renderTab();

    await user.click(
      await screen.findByRole("button", { name: "รายละเอียดประกาศ #48213" }),
    );

    expect(screen.getByText("กล่อง A-12")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /หน้าประกาศ/ })).toHaveAttribute(
      "href",
      "/listings/48213",
    );
    expect(screen.getByRole("link", { name: /ข้อมูลผู้ขาย/ })).toHaveAttribute(
      "href",
      "/admin/users?user=11",
    );
    expect(screen.getByRole("button", { name: "ระงับการขาย" })).toBeInTheDocument();
  });

  it("shows who blocked a listing and why, and hides the dead listing link", async () => {
    const user = userEvent.setup();
    renderTab();

    await user.click(
      await screen.findByRole("button", { name: "รายละเอียดประกาศ #48307" }),
    );

    expect(screen.getByText(/ระงับโดย admin_boat/)).toBeInTheDocument();
    expect(screen.getByText("สงสัยการ์ดปลอม")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /หน้าประกาศ/ })).toBeNull();
    expect(screen.getByRole("button", { name: "ปลดการระงับ" })).toBeInTheDocument();
  });

  it("blocks only with a reason, then refetches", async () => {
    const user = userEvent.setup();
    vi.mocked(catalogApi.blockListing).mockResolvedValue(blocked);
    renderTab();

    await user.click(
      await screen.findByRole("button", { name: "รายละเอียดประกาศ #48213" }),
    );
    await user.click(screen.getByRole("button", { name: "ระงับการขาย" }));

    const dialog = await screen.findByRole("alertdialog");
    expect(within(dialog).getByText(/Charizard ex/)).toBeInTheDocument();
    expect(within(dialog).getByText(/การ์ดที่ติดจอง 1/)).toBeInTheDocument();
    const confirm = within(dialog).getByRole("button", { name: "ระงับการขาย" });
    expect(confirm).toBeDisabled();

    const fetchesBefore = vi.mocked(catalogApi.getCardListings).mock.calls.length;
    await user.type(within(dialog).getByRole("textbox"), "  รูปไม่ตรง  ");
    await user.click(confirm);

    await waitFor(() =>
      expect(catalogApi.blockListing).toHaveBeenCalledWith(48213, "รูปไม่ตรง"),
    );
    await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
    await waitFor(() =>
      expect(vi.mocked(catalogApi.getCardListings).mock.calls.length).toBeGreaterThan(
        fetchesBefore,
      ),
    );
  });

  it("keeps the dialog open with a message and refetches on a 409", async () => {
    const user = userEvent.setup();
    vi.mocked(catalogApi.blockListing).mockRejectedValue(
      new ApiError({ status: 409, code: "LISTING_STATUS_TRANSITION", message: "changed" }),
    );
    renderTab();

    await user.click(
      await screen.findByRole("button", { name: "รายละเอียดประกาศ #48213" }),
    );
    await user.click(screen.getByRole("button", { name: "ระงับการขาย" }));
    const dialog = await screen.findByRole("alertdialog");
    const fetchesBefore = vi.mocked(catalogApi.getCardListings).mock.calls.length;
    await user.type(within(dialog).getByRole("textbox"), "รูปไม่ตรง");
    await user.click(within(dialog).getByRole("button", { name: "ระงับการขาย" }));

    expect(
      await within(dialog).findByText("สถานะของประกาศเปลี่ยนไปแล้ว รายการอัปเดตให้ใหม่แล้ว"),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(vi.mocked(catalogApi.getCardListings).mock.calls.length).toBeGreaterThan(
        fetchesBefore,
      ),
    );
  });

  it("lifts a block, showing the old reason and where it goes back to", async () => {
    const user = userEvent.setup();
    vi.mocked(catalogApi.unblockListing).mockResolvedValue(onSale);
    renderTab();

    await user.click(
      await screen.findByRole("button", { name: "รายละเอียดประกาศ #48307" }),
    );
    await user.click(screen.getByRole("button", { name: "ปลดการระงับ" }));

    const dialog = await screen.findByRole("alertdialog");
    expect(within(dialog).getByText("สงสัยการ์ดปลอม")).toBeInTheDocument();
    expect(within(dialog).getByText(/จะกลับเป็น “พร้อมขาย”/)).toBeInTheDocument();
    await user.type(within(dialog).getByRole("textbox"), "ตรวจแล้วของจริง");
    await user.click(within(dialog).getByRole("button", { name: "ปลดการระงับ" }));

    await waitFor(() =>
      expect(catalogApi.unblockListing).toHaveBeenCalledWith(48307, "ตรวจแล้วของจริง"),
    );
  });

  it("tells an empty card from a filter that found nothing", async () => {
    const user = userEvent.setup();
    vi.mocked(catalogApi.getCardListings).mockResolvedValue(page([]));
    renderTab();

    expect(await screen.findByText("ยังไม่มีร้านขายการ์ดใบนี้")).toBeInTheDocument();

    await user.type(screen.getByRole("searchbox"), "nobody");

    expect(await screen.findByText("ไม่พบประกาศตามตัวกรอง")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "ล้างตัวกรอง" }));
    expect(await screen.findByText("ยังไม่มีร้านขายการ์ดใบนี้")).toBeInTheDocument();
  });
});
