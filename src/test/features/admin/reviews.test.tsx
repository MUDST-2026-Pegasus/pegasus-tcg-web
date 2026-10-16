import { beforeEach, describe, expect, it, vi } from "vitest";

import { AdminReviewsContent } from "@/features/admin/components/AdminReviewsContent";
import {
  countReviews,
  filterLabel,
  filterReviews,
  summarizeRatings,
} from "@/features/admin/reviews.format";
import type { AdminReview } from "@/features/admin/reviews.types";
import { api, ApiError } from "@/lib/api";
import { fireEvent, renderWithProviders, screen, waitFor, within } from "@/test/utils";

vi.mock("@/lib/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api")>()),
  api: { get: vi.fn(), put: vi.fn() },
}));

const get = vi.mocked(api.get);
const put = vi.mocked(api.put);

function review(overrides: Partial<AdminReview>): AdminReview {
  return {
    id: 1,
    sellerOrderId: 501,
    rating: 5,
    title: "การ์ดสภาพดีมาก",
    comment: "แพ็กมาแน่นหนา",
    replyComment: "ขอบคุณครับ",
    visible: true,
    createdAt: "2026-10-13T03:00:00Z",
    reviewerUsername: "pim.collects",
    reviewerAvatarUrl: null,
    ...overrides,
  };
}

const reviews: AdminReview[] = [
  review({ id: 1 }),
  review({ id: 2, rating: 2, replyComment: null, reviewerUsername: "ton_tcg", title: "ส่งช้า" }),
  review({ id: 3, rating: 1, visible: false, replyComment: null, reviewerUsername: "beam.cards", title: null }),
  review({ id: 4, rating: 4, reviewerUsername: "nanami.p" }),
];

describe("review formatters", () => {
  it("counts every review but rates only visible ones", () => {
    expect(countReviews(reviews)).toEqual({ total: 4, visible: 3, hidden: 1, unreplied: 2, low: 2 });
    expect(summarizeRatings(reviews)).toEqual({ count: 3, average: 3.67, distribution: [0, 1, 0, 1, 1] });
    expect(summarizeRatings([])).toEqual({ count: 0, average: 0, distribution: [0, 0, 0, 0, 0] });
  });

  it("filters by visibility, reply and low rating", () => {
    expect(filterReviews(reviews, "VISIBLE").map((r) => r.id)).toEqual([1, 2, 4]);
    expect(filterReviews(reviews, "HIDDEN").map((r) => r.id)).toEqual([3]);
    expect(filterReviews(reviews, "UNREPLIED").map((r) => r.id)).toEqual([2, 3]);
    expect(filterReviews(reviews, "LOW").map((r) => r.id)).toEqual([2, 3]);
    expect(filterLabel("ALL", countReviews(reviews))).toBe("ทั้งหมด (4)");
    expect(filterLabel("VISIBLE", countReviews(reviews))).toBe("แสดงอยู่");
    expect(filterLabel("HIDDEN", null)).toBe("ซ่อนอยู่");
  });
});

describe("AdminReviewsContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    get.mockImplementation(async (path: string) => {
      if (path === "/admin/reviews") return reviews as never;
      if (path === "/u/kandypop") return { username: "kandypop", displayName: "kandypop Cards", avatarUrl: null } as never;
      throw new Error(`unexpected ${path}`);
    });
    put.mockResolvedValue({} as never);
  });

  it("asks for a seller before loading anything", () => {
    renderWithProviders(<AdminReviewsContent />, { route: "/admin/reviews" });
    expect(screen.getByText("ค้นหาผู้ขายเพื่อดูรีวิว")).toBeInTheDocument();
    expect(get).not.toHaveBeenCalled();
  });

  it("searches a seller and shows the summary, filters and reviews", async () => {
    renderWithProviders(<AdminReviewsContent />, { route: "/admin/reviews" });
    fireEvent.change(screen.getByLabelText("ชื่อผู้ใช้ผู้ขาย"), { target: { value: " kandypop " } });
    fireEvent.click(screen.getByRole("button", { name: "ค้นหาผู้ขาย" }));

    expect(await screen.findByText("รีวิวของ kandypop (4)")).toBeInTheDocument();
    expect(get).toHaveBeenCalledWith("/admin/reviews", { query: { username: "kandypop" } });
    expect(await screen.findByText("kandypop Cards")).toBeInTheDocument();
    expect(screen.getByText("3.7")).toBeInTheDocument();
    expect(screen.getAllByRole("article")).toHaveLength(4);

    fireEvent.click(screen.getByRole("tab", { name: "ซ่อนอยู่ (1)" }));
    const hidden = screen.getAllByRole("article");
    expect(hidden).toHaveLength(1);
    expect(within(hidden[0]).getByText("ไม่แสดงบนหน้าโปรไฟล์และไม่นับในคะแนน")).toBeInTheDocument();
  });

  it("toggles visibility and reloads the list", async () => {
    renderWithProviders(<AdminReviewsContent />, { route: "/admin/reviews?seller=kandypop" });
    const card = await screen.findByRole("article", { name: "รีวิวจาก ton_tcg" });
    fireEvent.click(within(card).getByRole("switch"));

    await waitFor(() => expect(put).toHaveBeenCalledWith("/admin/reviews/2/visibility", { visible: false }));
    await waitFor(() =>
      expect(get.mock.calls.filter(([path]) => path === "/admin/reviews")).toHaveLength(2),
    );
  });

  it("explains when the seller does not exist", async () => {
    get.mockRejectedValue(new ApiError({ status: 404, code: "SELLER_NOT_FOUND", message: "Seller not found" }));
    renderWithProviders(<AdminReviewsContent />, { route: "/admin/reviews?seller=ghost" });
    expect(await screen.findByText("ไม่พบผู้ขาย “ghost”")).toBeInTheDocument();
  });
});
