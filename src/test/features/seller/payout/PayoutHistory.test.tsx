import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { PayoutHistory } from "@/features/seller/payout/components/PayoutHistory";
import { renderWithProviders } from "@/test/utils";

describe("PayoutHistory status filter", () => {
  it("uses the shared dropdown and reports the selected payout status", async () => {
    const onFilterChange = vi.fn();
    renderWithProviders(
      <PayoutHistory payouts={[]} filter="ALL" onFilterChange={onFilterChange} onSelect={vi.fn()} />,
    );

    const trigger = screen.getByRole("combobox", { name: "สถานะคำขอ" });
    expect(trigger).toHaveTextContent("สถานะ: ทั้งหมด");
    expect(document.querySelector("select")).toBeNull();

    await userEvent.click(trigger);
    await userEvent.click(await screen.findByRole("option", { name: "โอนสำเร็จ" }));
    expect(onFilterChange).toHaveBeenCalledWith("PAID");
  });
});
