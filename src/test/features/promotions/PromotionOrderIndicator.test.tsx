import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { PromotionOrderIndicator } from "@/features/promotions/components/PromotionOrderIndicator";
import { renderWithProviders } from "@/test/utils";

describe("PromotionOrderIndicator", () => {
  it("identifies a discounted order and exposes the applied codes in its tooltip", async () => {
    const user = userEvent.setup();
    renderWithProviders(<PromotionOrderIndicator codes={["MINMIN50", "PEGASUS10"]} />);

    const trigger = screen.getByLabelText("ใช้งานโค้ดส่วนลด MINMIN50, PEGASUS10");
    expect(trigger).toBeInTheDocument();
    await user.hover(trigger);
    expect(await screen.findByText("ใช้งานโค้ดส่วนลด MINMIN50, PEGASUS10")).toBeInTheDocument();
  });
});
