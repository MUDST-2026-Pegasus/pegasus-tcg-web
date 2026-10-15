import { afterSalesApi } from "@/features/finance/after-sales.api";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Routes, Route } from "react-router-dom";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/utils";
import { PublicSellerPage } from "@/features/store/pages/PublicSellerPage";
import { getPublicProfile, getStorefront } from "@/features/home/home.api";
import { getPublicCollection } from "@/features/collection/collection.api";
import { ApiError } from "@/lib/api";

vi.mock("@/features/home/home.api", () => ({
  getPublicProfile: vi.fn(),
  getStorefront: vi.fn(),
}));

vi.mock("@/features/collection/collection.api", () => ({
  getPublicCollection: vi.fn(),
}));

vi.mock("@/features/finance/after-sales.api", () => ({
  afterSalesApi: { publicReviews: vi.fn() },
}));

const card = {
  variantId: 1,
  sku: "A",
  variantLabel: "Normal",
  productId: 1,
  productName: "Charizard",
  productSlug: "charizard",
  gameId: 1,
  officialImageUrl: null,
};

const listing = {
  id: 1,
  card,
  condition: "NM" as const,
  price: 4200,
  currency: "THB",
  quantityAvailable: 3,
  primaryPhotoUrl: null,
  seller: {
    username: "cardvault",
    displayName: "CardVault BKK",
    avatarUrl: null,
    verified: false,
    ratingAvg: null,
    ratingCount: 0,
    salesCount: 0,
  },
  delivery: { fastestEstDaysMin: null, fastestEstDaysMax: null, freeShipping: false, optionCount: 0 },
};

const page = <T,>(items: T[], totalItems = items.length) => ({
  items,
  page: 0,
  size: 6,
  totalItems,
  totalPages: Math.ceil(totalItems / 6),
});

function renderStore(route = "/u/cardvault?from=charizard") {
  return renderWithProviders(
    <Routes>
      <Route path="/u/:username" element={<PublicSellerPage />} />
    </Routes>,
    { route },
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("scrollTo", vi.fn());
  vi.mocked(getPublicProfile).mockResolvedValue({
    username: "cardvault",
    displayName: "CardVault BKK",
    avatarUrl: null,
  });
  vi.mocked(getStorefront).mockResolvedValue(page([listing], 7));
  vi.mocked(getPublicCollection).mockResolvedValue(
    page([
      {
        id: 2,
        card: { ...card, productName: "Pikachu", productSlug: "pikachu" },
        condition: "NM",
        quantity: 2,
        photoUrl: null,
      },
    ]),
  );
  vi.mocked(afterSalesApi.publicReviews).mockResolvedValue({
    summary: {
      ratingCount: 0,
      ratingAvg: 0,
      count1: 0,
      count2: 0,
      count3: 0,
      count4: 0,
      count5: 0,
    },
    reviews: [],
  });
});

afterEach(() => vi.unstubAllGlobals());

describe("PublicSellerPage V3", () => {
  it("starts at the top, links back to the product and hides prices in collection", async () => {
    const user = userEvent.setup();
    renderStore();
    expect(await screen.findByRole("heading", { name: "CardVault BKK" })).toBeInTheDocument();
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: "instant" });
    expect(screen.getByRole("link", { name: /Back to product detail/i })).toHaveAttribute(
      "href",
      "/products/charizard",
    );
    expect(screen.getByRole("link", { name: /Charizard/ })).toHaveAttribute(
      "href",
      "/products/charizard",
    );
    await user.click(await screen.findByRole("tab", { name: /คอลเลกชัน/i }));
    const panel = screen.getByRole("tabpanel");
    expect(within(panel).getByText("Pikachu")).toBeInTheDocument();
    expect(within(panel).queryByText(/฿/)).not.toBeInTheDocument();
  });

  it("shows listing and collection photos like the collector profile", async () => {
    vi.mocked(getStorefront).mockResolvedValue(
      page([{ ...listing, card: { ...card, officialImageUrl: "/catalog-charizard.jpg" } }]),
    );
    vi.mocked(getPublicCollection).mockResolvedValue(
      page([
        {
          id: 2,
          card: { ...card, productName: "Pikachu", productSlug: "pikachu" },
          condition: "NM",
          quantity: 2,
          photoUrl: "/pikachu.jpg",
        },
      ]),
    );
    const user = userEvent.setup();
    renderStore();
    expect(await screen.findByRole("img", { name: "Charizard" })).toHaveAttribute(
      "src",
      "/catalog-charizard.jpg",
    );
    await user.click(await screen.findByRole("tab", { name: /คอลเลกชัน/i }));
    expect(await screen.findByRole("img", { name: "Pikachu" })).toHaveAttribute(
      "src",
      "/pikachu.jpg",
    );
  });

  it("shows the public profile even if there are no listings", async () => {
    vi.mocked(getPublicProfile).mockResolvedValue({
      username: "cardvault",
      displayName: "CardVault BKK",
      avatarUrl: "/avatar.jpg",
    });
    vi.mocked(getStorefront).mockResolvedValue(page([]));
    renderStore();
    expect(await screen.findByRole("heading", { name: "CardVault BKK" })).toBeInTheDocument();
    expect(screen.getByText("ยังไม่มีประกาศขาย")).toBeInTheDocument();
  });

  it("fetches the next seller page while preserving identity", async () => {
    const user = userEvent.setup();
    renderStore();
    await screen.findByRole("heading", { name: "CardVault BKK" });
    await user.click(screen.getByRole("button", { name: /Next|ถัดไป/i }));
    await waitFor(() =>
      expect(getStorefront).toHaveBeenCalledWith("cardvault", 6, 1, expect.any(AbortSignal)),
    );
    expect(screen.getByRole("heading", { name: "CardVault BKK" })).toBeInTheDocument();
  });

  it("supports direct collection URLs and empty stores without fabricated identity", async () => {
    vi.mocked(getStorefront).mockResolvedValue(page([]));
    vi.mocked(getPublicCollection).mockResolvedValue(page([]));
    vi.mocked(getPublicProfile).mockResolvedValue({
      username: "empty",
      displayName: null,
      avatarUrl: null,
    });
    renderStore("/u/empty?tab=collection");
    expect(await screen.findByRole("heading", { name: "empty" })).toBeInTheDocument();
    expect(await screen.findByText("ยังไม่มีคอลเลกชันสาธารณะ")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Back to products/i })).toHaveAttribute(
      "href",
      "/products",
    );
  });

  it("shows a missing seller without loading collection", async () => {
    vi.mocked(getPublicProfile).mockRejectedValue(
      new ApiError({ status: 404, code: "SELLER_NOT_FOUND", message: "Missing" }),
    );
    renderStore();
    expect(await screen.findByText("ไม่พบผู้ขายรายนี้")).toBeInTheDocument();
    expect(getPublicCollection).not.toHaveBeenCalled();
  });

  it("displays a shared contact phone in the profile header", async () => {
    vi.mocked(getPublicProfile).mockResolvedValue({
      username: "cardvault",
      displayName: "CardVault BKK",
      avatarUrl: null,
      phone: "081-234-5678",
    });
    renderStore();
    expect(await screen.findByRole("link", { name: /081-234-5678/ })).toHaveAttribute(
      "href",
      "tel:0812345678",
    );
    expect(screen.getByText("Phone number :")).toBeInTheDocument();
  });

  it("does not render a private phone", async () => {
    vi.mocked(getPublicProfile).mockResolvedValue({
      username: "cardvault",
      displayName: "CardVault BKK",
      avatarUrl: null,
      phone: null,
    });
    renderStore();
    await screen.findByRole("heading", { name: "CardVault BKK" });
    expect(screen.queryByText(/Phone number/)).not.toBeInTheDocument();
  });

  it("shows real seller reviews in the reviews tab", async () => {
    vi.mocked(afterSalesApi.publicReviews).mockResolvedValue({
      summary: {
        ratingCount: 1,
        ratingAvg: 4,
        count1: 0,
        count2: 0,
        count3: 0,
        count4: 1,
        count5: 0,
      },
      reviews: [
        {
          id: 7,
          rating: 4,
          title: "Great",
          comment: "Arrived safely",
          reviewerUsername: "buyer",
          replyComment: null,
          createdAt: "2026-10-12T10:00:00Z",
        },
      ],
    });
    const interaction = userEvent.setup();
    renderStore();
    await interaction.click(await screen.findByRole("tab", { name: /รีวิวจากผู้ซื้อ/i }));
    expect(await screen.findByText("Arrived safely")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "รีวิวจากคำสั่งซื้อของฉัน" })).toHaveAttribute(
      "href",
      "/account/orders",
    );
    expect(afterSalesApi.publicReviews).toHaveBeenCalledWith("cardvault");
  });

  it("calculates positive review % correctly and displays 96% on hero and review summary", async () => {
    vi.mocked(afterSalesApi.publicReviews).mockResolvedValue({
      summary: {
        ratingCount: 128,
        ratingAvg: 4.7,
        count1: 1,
        count2: 1,
        count3: 3,
        count4: 21,
        count5: 102,
      },
      reviews: [
        {
          id: 1,
          rating: 5,
          title: "ยอดเยี่ยม",
          comment: "การ์ดสวยมาก สภาพเนียนกริบ",
          reviewerUsername: "pokepanda",
          replyComment: "ขอบคุณครับ",
          createdAt: "2026-10-12T10:00:00Z",
        },
      ],
    });
    renderStore();
    // 102 + 21 = 123; 123 / 128 = 96.09% -> 96%
    expect(await screen.findByText("96%")).toBeInTheDocument();
    expect(screen.getByText("ให้ 4–5 ดาว")).toBeInTheDocument();
  });

  it("handles 0 reviews edge state cleanly (shows placeholder stat and hides snippet card)", async () => {
    vi.mocked(afterSalesApi.publicReviews).mockResolvedValue({
      summary: {
        ratingCount: 0,
        ratingAvg: 0,
        count1: 0,
        count2: 0,
        count3: 0,
        count4: 0,
        count5: 0,
      },
      reviews: [],
    });
    renderStore();
    await screen.findByRole("heading", { name: "CardVault BKK" });
    // Hero stat card shows "ยังไม่มีรีวิว"
    expect(screen.getAllByText("ยังไม่มีรีวิว").length).toBeGreaterThan(0);
    // Snippet card "ผู้ซื้อพูดถึงร้านนี้" should be hidden
    expect(screen.queryByText("ผู้ซื้อพูดถึงร้านนี้")).not.toBeInTheDocument();
  });

  it("gracefully hides the reviews tab when user is a non-seller (SELLER_NOT_FOUND)", async () => {
    vi.mocked(afterSalesApi.publicReviews).mockRejectedValue(
      new ApiError({ status: 404, code: "SELLER_NOT_FOUND", message: "Not a seller" }),
    );
    renderStore();
    await screen.findByRole("heading", { name: "CardVault BKK" });
    // Reviews tab and rating stats should be hidden once query settles
    await waitFor(() => {
      expect(screen.queryByRole("tab", { name: /รีวิวจากผู้ซื้อ/i })).not.toBeInTheDocument();
      expect(screen.queryByText("คะแนนร้านค้า")).not.toBeInTheDocument();
      expect(screen.queryByText("รีวิวเชิงบวก")).not.toBeInTheDocument();
    });
    // But collection and listings are still accessible
    expect(screen.getByRole("tab", { name: /สินค้าที่วางขาย/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /คอลเลกชัน/i })).toBeInTheDocument();
  });

  it("supports deep linking directly via ?tab=reviews", async () => {
    vi.mocked(afterSalesApi.publicReviews).mockResolvedValue({
      summary: {
        ratingCount: 1,
        ratingAvg: 5,
        count1: 0,
        count2: 0,
        count3: 0,
        count4: 0,
        count5: 1,
      },
      reviews: [
        {
          id: 1,
          rating: 5,
          title: "สุดยอด",
          comment: "จัดส่งรวดเร็วมาก",
          reviewerUsername: "tcglover",
          replyComment: null,
          createdAt: "2026-10-14T08:00:00Z",
        },
      ],
    });
    renderStore("/u/cardvault?tab=reviews");
    expect(await screen.findByText("จัดส่งรวดเร็วมาก")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "รีวิวจากผู้ซื้อ" })).toBeInTheDocument();
  });

  it("filters reviews client-side using filter chips", async () => {
    const user = userEvent.setup();
    vi.mocked(afterSalesApi.publicReviews).mockResolvedValue({
      summary: {
        ratingCount: 3,
        ratingAvg: 4.3,
        count1: 0,
        count2: 0,
        count3: 0,
        count4: 1,
        count5: 2,
      },
      reviews: [
        {
          id: 1,
          rating: 5,
          title: "สุดยอดการ์ด",
          comment: "ห่อมาดีมาก",
          reviewerUsername: "buyer5",
          replyComment: "ขอบคุณครับ",
          createdAt: "2026-10-12T10:00:00Z",
        },
        {
          id: 2,
          rating: 4,
          title: "ดีพอใช้",
          comment: "ส่งช้าไปวันนึง",
          reviewerUsername: "buyer4",
          replyComment: null,
          createdAt: "2026-10-11T10:00:00Z",
        },
      ],
    });
    renderStore("/u/cardvault?tab=reviews");
    expect(await screen.findByText("ห่อมาดีมาก")).toBeInTheDocument();
    expect(screen.getByText("ส่งช้าไปวันนึง")).toBeInTheDocument();

    // Click "5 ดาว" filter
    const fiveStarChip = screen.getByRole("button", { name: /5 ดาว/i });
    await user.click(fiveStarChip);
    expect(screen.getByText("ห่อมาดีมาก")).toBeInTheDocument();
    expect(screen.queryByText("ส่งช้าไปวันนึง")).not.toBeInTheDocument();

    // Click "มีการตอบกลับ" filter
    const repliedChip = screen.getByRole("button", { name: /มีการตอบกลับ/i });
    await user.click(repliedChip);
    expect(screen.getByText("ห่อมาดีมาก")).toBeInTheDocument();
    expect(screen.queryByText("ส่งช้าไปวันนึง")).not.toBeInTheDocument();

    // Click "ทั้งหมด" to reset filter
    const allChip = screen.getByRole("button", { name: /ทั้งหมด/i });
    await user.click(allChip);
    expect(screen.getByText("ห่อมาดีมาก")).toBeInTheDocument();
    expect(screen.getByText("ส่งช้าไปวันนึง")).toBeInTheDocument();
  });
});
