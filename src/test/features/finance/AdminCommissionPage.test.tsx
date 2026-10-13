import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AdminCommissionPage } from "@/features/admin/pages/AdminCommissionPage";
import { afterSalesApi } from "@/features/finance/after-sales.api";

vi.mock("@/features/finance/after-sales.api", () => ({ afterSalesApi: {
  commissionRules: vi.fn(), commissionRule: vi.fn(), createCommissionRule: vi.fn(),
  updateCommissionRule: vi.fn(), deactivateCommissionRule: vi.fn(),
} }));

const globalRule = { id: 1, scope: "GLOBAL" as const, gameId: null, categoryId: null,
  sellerProfileId: null, ratePercent: 5, fixedFee: 0, minFee: null, maxFee: null,
  priority: 0, effectiveFrom: "2026-10-13T00:00:00Z", effectiveTo: null, active: true };
const categoryRule = { ...globalRule, id: 2, scope: "CATEGORY" as const, categoryId: 7,
  ratePercent: 7 };

describe("admin commission settings", () => {
  it("shows the live rules and saves a changed default rate through the API", async () => {
    vi.mocked(afterSalesApi.commissionRules).mockResolvedValue([globalRule, categoryRule]);
    vi.mocked(afterSalesApi.updateCommissionRule).mockResolvedValue(globalRule);
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<QueryClientProvider client={client}><AdminCommissionPage /></QueryClientProvider>);

    expect(await screen.findByText("หมวดหมู่ #7")).toBeTruthy();
    expect(screen.getByText("฿1,225.50")).toBeTruthy();
    fireEvent.change(screen.getByRole("spinbutton", { name: "อัตราค่าคอมมิชชั่น (%)" }),
      { target: { value: "6" } });
    fireEvent.click(screen.getByRole("button", { name: "บันทึกอัตรา" }));
    await waitFor(() => expect(afterSalesApi.updateCommissionRule).toHaveBeenCalledWith(1,
      expect.objectContaining({ scope: "GLOBAL", ratePercent: 6 })));
  });
});
