import { beforeEach, describe, expect, it, vi } from "vitest";

import { downloadAdminOrderSummary } from "@/features/admin/orders.api";
import { api } from "@/lib/api";

vi.mock("@/lib/api", () => ({
  api: {
    download: vi.fn(),
  },
}));

describe("admin orders API", () => {
  beforeEach(() => vi.clearAllMocks());

  it("downloads the summary for the selected seller order", async () => {
    const file = {
      blob: new Blob(["%PDF-test"], { type: "application/pdf" }),
      filename: "order-summary-PGS-20261030-0123.pdf",
    };
    vi.mocked(api.download).mockResolvedValue(file);

    await expect(downloadAdminOrderSummary(12)).resolves.toBe(file);
    expect(api.download).toHaveBeenCalledOnce();
    expect(api.download).toHaveBeenCalledWith("/admin/orders/12/summary.pdf");
  });
});
