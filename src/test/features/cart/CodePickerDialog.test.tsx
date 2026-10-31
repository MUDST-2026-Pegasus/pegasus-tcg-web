import { expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render } from "@/test/utils";
import { CodePickerDialog } from "@/features/cart/components/CodePickerDialog";
import { CouponTicket } from "@/features/cart/components/CouponTicket";
import type { AvailablePromotion } from "@/features/cart/promotions.types";

const promotion: AvailablePromotion = { id: 1, code: "PEGASUS10", name: "ลด 10%", ownerType: "PLATFORM", sellerProfileId: null, sellerName: null, discountType: "PERCENT", discountValue: 10, maxDiscount: 200, minSpend: 500, endsAt: "2026-11-30T00:00:00Z", source: "CLAIMED", remainingClaims: null, applicable: true, estimatedDiscount: 80, reason: null, shortfall: null };

it("shows selected and disabled coupon states", () => {
  const { rerender } = render(<CouponTicket promotion={promotion} selected onSelect={vi.fn()} />);
  expect(screen.getByRole("button", { name: /PEGASUS10/ })).toHaveAttribute("aria-pressed", "true");
  rerender(<CouponTicket promotion={{ ...promotion, applicable: false, reason: "PROMO_MIN_SPEND_NOT_MET", shortfall: 100 }} onSelect={vi.fn()} />);
  expect(screen.getByRole("button", { name: /PEGASUS10/ })).toBeDisabled();
  expect(screen.getByText(/ซื้อเพิ่มอีก/)).toBeInTheDocument();
});

it("selects a code and accepts typed codes in the picker", async () => {
  const user = userEvent.setup();
  const onSelect = vi.fn(); const onTryCode = vi.fn();
  const { rerender } = render(<CodePickerDialog open onOpenChange={vi.fn()} owner="PLATFORM" promotions={[promotion]} onSelect={onSelect} onTryCode={onTryCode} />);
  await user.click(screen.getByRole("button", { name: /PEGASUS10/ }));
  expect(onSelect).toHaveBeenCalledWith("PEGASUS10");
  rerender(<CodePickerDialog open onOpenChange={vi.fn()} owner="PLATFORM" promotions={[promotion]} onSelect={onSelect} onTryCode={onTryCode} />);
  await user.type(screen.getByLabelText("กรอกโค้ดอื่น"), "other10");
  await user.click(screen.getByRole("button", { name: "ใช้โค้ด" }));
  expect(onTryCode).toHaveBeenCalledWith("OTHER10");
});
