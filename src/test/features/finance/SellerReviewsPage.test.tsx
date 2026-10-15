import { beforeEach, describe, expect, it, vi } from "vitest";
import { Route, Routes } from "react-router-dom";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/utils";
import { SellerReviewsPage } from "@/features/finance/SellerReviewsPage";
import { afterSalesApi } from "@/features/finance/after-sales.api";
import { useAuth } from "@/features/auth/auth.queries";
import { useSellerDashboard } from "@/features/seller/dashboard/dashboard.queries";

vi.mock("@/features/finance/after-sales.api", () => ({ afterSalesApi: { publicReviews: vi.fn(), replyReview: vi.fn() } }));
vi.mock("@/features/auth/auth.queries", () => ({ useAuth: vi.fn() }));
vi.mock("@/features/seller/dashboard/dashboard.queries", () => ({ dashboardKeys: { all: ["seller-dashboard"] }, useSellerDashboard: vi.fn() }));
vi.mock("@/components/ui/toast", () => ({ toast: { add: vi.fn() } }));

const reviews = [
  { id: 1, reviewerUsername: "buyer01", rating: 5, title: "ดีมาก", comment: "ส่งไว", replyComment: null, createdAt: "2026-10-15T02:12:00Z" },
  { id: 2, reviewerUsername: "buyer02", rating: 1, title: null, comment: "ช้า", replyComment: "ขออภัย", createdAt: "2026-10-14T02:12:00Z" },
];

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useAuth).mockReturnValue({ user: { username: "seller01" } } as never);
  vi.mocked(useSellerDashboard).mockReturnValue({ isPending: false, isError: false, data: { reviews: { average: 3, count: 2, thisMonth: 2, unreplied: 1 } } } as never);
  vi.mocked(afterSalesApi.publicReviews).mockResolvedValue({ reviews, summary: { ratingCount: 2, ratingAvg: 3, count1: 1, count2: 0, count3: 0, count4: 0, count5: 1 } });
});

describe("SellerReviewsPage", () => {
  it("opens the dashboard's unreplied tab and requires confirmation before posting", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Routes><Route path="/seller/reviews" element={<SellerReviewsPage />} /></Routes>, { route: "/seller/reviews?tab=unreplied" });
    expect(await screen.findByText("ส่งไว")).toBeInTheDocument();
    expect(screen.queryByText("ช้า")).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "ยังไม่ตอบ 1" })).toHaveAttribute("aria-selected", "true");
    await user.click(screen.getByRole("button", { name: "ตอบกลับ" }));
    const send = screen.getByRole("button", { name: "ส่งคำตอบ" });
    expect(send).toBeDisabled();
    await user.type(screen.getByRole("textbox", { name: "ตอบกลับรีวิวนี้" }), "ขอบคุณครับ");
    await user.click(send);
    expect(afterSalesApi.replyReview).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toHaveTextContent("ส่งคำตอบแล้วแก้ไขไม่ได้");
    await user.click(screen.getByRole("button", { name: "ยืนยันส่งคำตอบ" }));
    await waitFor(() => expect(afterSalesApi.replyReview).toHaveBeenCalledWith(1, "ขอบคุณครับ"));
  });
});
