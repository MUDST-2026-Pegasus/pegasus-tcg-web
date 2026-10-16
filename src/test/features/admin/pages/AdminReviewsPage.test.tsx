import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/utils";
import { AdminReviewsPage } from "@/features/admin/pages/AdminReviewsPage";
import * as reviewsApi from "@/features/admin/reviews.api";
import type { AdminReview, ReviewSellerProfile } from "@/features/admin/reviews.types";

vi.mock("@/features/admin/reviews.api", () => ({
  getSellerReviews: vi.fn(),
  getSellerProfile: vi.fn(),
  setReviewVisibility: vi.fn(),
}));

const mockProfile: ReviewSellerProfile = {
  username: "cardseller",
  displayName: "Card Kingdom",
  avatarUrl: null,
};

const mockReviews: AdminReview[] = [
  {
    id: 11,
    sellerOrderId: 55,
    rating: 5,
    title: "ยอดเยี่ยมมาก",
    comment: "ส่งของไว การ์ดสวยสภาพดีมากครับ",
    replyComment: "ขอบคุณครับ ยินดีให้บริการเสมอครับ",
    visible: true,
    createdAt: "2026-10-15T10:00:00Z",
    reviewerUsername: "buyer01",
    reviewerAvatarUrl: null,
  },
  {
    id: 12,
    sellerOrderId: 56,
    rating: 1,
    title: "การ์ดมีรอยยับ",
    comment: "การ์ดมีตำหนิตรงมุม ไม่ตรงตามสภาพที่ระบุ",
    replyComment: null,
    visible: false,
    createdAt: "2026-10-14T10:00:00Z",
    reviewerUsername: "buyer02",
    reviewerAvatarUrl: null,
  },
];

describe("AdminReviewsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders empty search state when no seller is specified", async () => {
    renderWithProviders(<AdminReviewsPage />, { route: "/admin/reviews" });

    expect(screen.getByText("จัดการรีวิว")).toBeInTheDocument();
    expect(screen.getByText("ค้นหาผู้ขายเพื่อดูรีวิว")).toBeInTheDocument();
  });

  it("searches seller and displays reviews with visibility toggle", async () => {
    vi.mocked(reviewsApi.getSellerReviews).mockResolvedValue(mockReviews);
    vi.mocked(reviewsApi.getSellerProfile).mockResolvedValue(mockProfile);

    const user = userEvent.setup();
    renderWithProviders(<AdminReviewsPage />, { route: "/admin/reviews" });

    // Enter username into search
    const input = screen.getByPlaceholderText("ชื่อผู้ใช้ผู้ขาย");
    await user.type(input, "cardseller");
    await user.click(screen.getByRole("button", { name: "ค้นหาผู้ขาย" }));

    // Verify reviews rendered
    expect(await screen.findByText("buyer01")).toBeInTheDocument();
    expect(screen.getByText("ส่งของไว การ์ดสวยสภาพดีมากครับ")).toBeInTheDocument();
    expect(screen.getByText("การ์ดมีตำหนิตรงมุม ไม่ตรงตามสภาพที่ระบุ")).toBeInTheDocument();

    // Toggle switch for visibility
    vi.mocked(reviewsApi.setReviewVisibility).mockResolvedValue({
      ...mockReviews[0],
      visible: false,
      repliedAt: null,
    });

    const switches = screen.getAllByRole("switch");
    await user.click(switches[0]);

    expect(reviewsApi.setReviewVisibility).toHaveBeenCalledWith(11, false);
  });

  it("renders error state when fetching seller reviews fails", async () => {
    vi.mocked(reviewsApi.getSellerReviews).mockRejectedValue(new Error("Network Error"));
    vi.mocked(reviewsApi.getSellerProfile).mockResolvedValue(null);

    renderWithProviders(<AdminReviewsPage />, { route: "/admin/reviews?seller=cardseller" });

    expect(await screen.findByText("โหลดข้อมูลไม่สำเร็จ")).toBeInTheDocument();
  });
});
