import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";

import { ListingDetailPage } from "@/features/catalog/pages/ListingDetailPage";
import * as catalogQueries from "@/features/catalog/catalog.queries";
import { ApiError } from "@/lib/api";
import { renderWithProviders } from "@/test/utils";

vi.mock("@/features/catalog/catalog.queries", () => ({
  useListingDetail: vi.fn(),
  useProductDetail: vi.fn(),
  useProductListings: vi.fn(),
  useGameList: vi.fn(),
  useCardSetList: vi.fn(),
  useGameAttributes: vi.fn(),
  useProductCardEffects: vi.fn(),
  useSellerListings: vi.fn(),
}));

describe("ListingDetailPage query states", () => {
  beforeEach(() => vi.clearAllMocks());

  function renderPage(id = "42") {
    return renderWithProviders(
      <Routes>
        <Route path="/listings/:listingId" element={<ListingDetailPage />} />
      </Routes>,
      { route: `/listings/${id}` },
    );
  }

  it("shows the loading skeleton while the listing contract is pending", () => {
    vi.mocked(catalogQueries.useListingDetail).mockReturnValue({
      data: undefined, isPending: true, isError: false, error: null, refetch: vi.fn(),
    } as never);
    renderPage();
    expect(screen.getByRole("status", { name: "กำลังโหลดประกาศขาย" })).toHaveAttribute("aria-busy", "true");
  });

  it("renders not found for an invalid id and an API 404", () => {
    vi.mocked(catalogQueries.useListingDetail).mockReturnValue({
      data: undefined, isPending: false, isError: false, error: null, refetch: vi.fn(),
    } as never);
    const { unmount } = renderPage("bad-id");
    expect(screen.getByText("ไม่พบประกาศนี้")).toBeInTheDocument();
    unmount();

    vi.mocked(catalogQueries.useListingDetail).mockReturnValue({
      data: undefined,
      isPending: false,
      isError: true,
      error: new ApiError({ status: 404, code: "LISTING_NOT_FOUND", message: "Not found" }),
      refetch: vi.fn(),
    } as never);
    renderPage();
    expect(screen.getByText("ไม่พบประกาศนี้")).toBeInTheDocument();
  });

  it("shows a retryable error for a non-404 response", async () => {
    const refetch = vi.fn();
    vi.mocked(catalogQueries.useListingDetail).mockReturnValue({
      data: undefined,
      isPending: false,
      isError: true,
      error: new ApiError({ status: 503, code: "SERVICE_UNAVAILABLE", message: "Try again" }),
      refetch,
    } as never);
    const user = userEvent.setup();
    renderPage();

    expect(await screen.findByText("โหลดประกาศขายไม่สำเร็จ")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "ลองใหม่" }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });
});
