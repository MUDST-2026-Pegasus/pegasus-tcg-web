import { beforeEach, describe, expect, it, vi } from "vitest";

import { downloadAdminOrdersCsv, downloadAdminOrderSummary } from "@/features/admin/orders.api";
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

  it("downloads the orders CSV for the range, sending statuses comma-separated [TCG-749]", async () => {
    const file = { blob: new Blob(["csv"]), filename: "admin-orders-2026-10-12-2026-11-10.csv" };
    vi.mocked(api.download).mockResolvedValue(file);

    await expect(downloadAdminOrdersCsv({
      from: "2026-10-12T00:00:00+07:00",
      to: "2026-11-11T00:00:00+07:00",
      statuses: ["PAID", "SHIPPED"],
    })).resolves.toBe(file);
    expect(api.download).toHaveBeenCalledWith("/admin/orders/export", {
      query: { from: "2026-10-12T00:00:00+07:00", to: "2026-11-11T00:00:00+07:00", status: "PAID,SHIPPED" },
      headers: { Accept: "text/csv, application/json" },
    });
  });

  it("leaves status out of the orders CSV request when every status is wanted", async () => {
    vi.mocked(api.download).mockResolvedValue({ blob: new Blob([]), filename: null });

    await downloadAdminOrdersCsv({ from: "a", to: "b", statuses: [] });

    expect(vi.mocked(api.download).mock.calls[0][1]?.query).toEqual({ from: "a", to: "b", status: undefined });
  });
});
