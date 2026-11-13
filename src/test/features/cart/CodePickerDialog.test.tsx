import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render } from "@/test/utils";
import { CodePickerDialog } from "@/features/promotions/CodePickerDialog";
import { CouponTicket } from "@/features/promotions/CouponTicket";
import type { AvailablePromotion } from "@/features/cart/promotions.types";

const platformPromo: AvailablePromotion = {
  id: 1,
  code: "PEGASUS10",
  name: "ส่วนลดพิเศษ Pegasus 10%",
  ownerType: "PLATFORM",
  sellerProfileId: null,
  sellerName: null,
  discountType: "PERCENT",
  discountValue: 10,
  maxDiscount: 200,
  minSpend: 500,
  endsAt: "2026-11-30T00:00:00Z",
  source: "CLAIMED",
  remainingClaims: null,
  applicable: true,
  estimatedDiscount: 80,
  reason: null,
  shortfall: null,
};

const shopPromo: AvailablePromotion = {
  id: 2,
  code: "STORE50",
  name: "ส่วนลดร้านค้า Store A",
  ownerType: "SELLER",
  sellerProfileId: 1,
  sellerName: "Store A",
  discountType: "FIXED",
  discountValue: 50,
  maxDiscount: null,
  minSpend: 300,
  endsAt: "2026-11-30T00:00:00Z",
  source: "CLAIMED",
  remainingClaims: 15,
  applicable: true,
  estimatedDiscount: 50,
  reason: null,
  shortfall: null,
};

describe("CouponTicket", () => {
  it("renders platform vs shop appearance and labels correctly", () => {
    const { rerender } = render(<CouponTicket promotion={platformPromo} />);
    expect(screen.getByText("PEGASUS")).toBeInTheDocument();
    expect(screen.getByText("10%")).toBeInTheDocument();

    rerender(<CouponTicket promotion={shopPromo} />);
    expect(screen.getByText("SHOP")).toBeInTheDocument();
    expect(screen.getByText("THB")).toBeInTheDocument();
    expect(screen.getByText("50")).toBeInTheDocument();
  });

  it("shows default, selected, and disabled coupon states", () => {
    const onSelect = vi.fn();
    const { rerender } = render(
      <CouponTicket promotion={platformPromo} selected={false} onSelect={onSelect} />,
    );
    const button = screen.getByRole("radio", { name: /PEGASUS10/ });
    expect(button.closest(".ring-border")).not.toHaveClass("border-primary");
    expect(button).not.toBeDisabled();

    rerender(<CouponTicket promotion={platformPromo} selected={true} onSelect={onSelect} />);
    expect(screen.getByRole("radio", { name: /PEGASUS10/ }).closest(".ring-border")).toHaveClass("border-primary");

    rerender(
      <CouponTicket
        promotion={{
          ...platformPromo,
          applicable: false,
          reason: "PROMO_MIN_SPEND_NOT_MET",
          shortfall: 150,
        }}
        onSelect={onSelect}
      />,
    );
    expect(screen.getByRole("radio", { name: /PEGASUS10/ })).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByText(/ซื้อเพิ่มอีก THB 150.00/)).toBeInTheDocument();
  });
});

describe("CodePickerDialog", () => {
  it("organizes promotions into grouped sections according to source and applicability", () => {
    const claimedInapplicable: AvailablePromotion = {
      ...platformPromo,
      id: 3,
      code: "PEGASUSMIN",
      applicable: false,
      reason: "PROMO_MIN_SPEND_NOT_MET",
      shortfall: 200,
    };
    const claimable: AvailablePromotion = {
      ...platformPromo,
      id: 4,
      code: "PEGASUSCLAIM",
      source: "CLAIMABLE",
      remainingClaims: 5,
    };
    const publicPromo: AvailablePromotion = {
      ...platformPromo,
      id: 5,
      code: "PEGASUSPUBLIC",
      source: "PUBLIC",
    };

    render(
      <CodePickerDialog
        open
        onOpenChange={vi.fn()}
        owner="PLATFORM"
        promotions={[platformPromo, claimedInapplicable, claimable, publicPromo]}
        onSelect={vi.fn()}
        onTryCode={vi.fn()}
      />,
    );

    expect(screen.getByText(/เก็บไว้ใช้ได้/)).toBeInTheDocument();
    expect(screen.getByText(/เก็บไว้แต่ยังใช้ไม่ได้/)).toBeInTheDocument();
    expect(screen.getByText(/ยังไม่ได้เก็บ/)).toBeInTheDocument();
    expect(screen.getByText(/โค้ดทั่วไป/)).toBeInTheDocument();
  });

  it("shows an uncollected code as a claim ticket that cannot be selected", async () => {
    const user = userEvent.setup();
    const onClaim = vi.fn();
    const claimable: AvailablePromotion = {
      ...platformPromo,
      id: 6,
      code: "NEEDCLAIM",
      source: "CLAIMABLE",
      remainingClaims: 5,
    };

    render(
      <CodePickerDialog
        open
        onOpenChange={vi.fn()}
        owner="PLATFORM"
        promotions={[claimable]}
        onSelect={vi.fn()}
        onTryCode={vi.fn()}
        onClaim={onClaim}
      />,
    );

    expect(screen.queryByRole("radio", { name: /NEEDCLAIM/ })).not.toBeInTheDocument();
    expect(screen.getByText("เหลือ 5 สิทธิ์")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "เก็บโค้ด NEEDCLAIM" }));
    expect(onClaim).toHaveBeenCalledWith(claimable);
  });

  it("disables collecting a code that has run out", () => {
    render(
      <CodePickerDialog
        open
        onOpenChange={vi.fn()}
        owner="PLATFORM"
        promotions={[{ ...platformPromo, id: 7, code: "GONE", source: "CLAIMABLE", remainingClaims: 0 }]}
        onSelect={vi.fn()}
        onTryCode={vi.fn()}
        onClaim={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "หมดแล้ว" })).toBeDisabled();
    expect(screen.getByText("ถูกเก็บครบแล้ว")).toBeInTheDocument();
  });

  it("selects a code via draft selection + confirm, and normalizes typed codes", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const onTryCode = vi.fn();
    const onOpenChange = vi.fn();

    const { rerender } = render(
      <CodePickerDialog
        open
        onOpenChange={onOpenChange}
        owner="PLATFORM"
        promotions={[platformPromo]}
        onSelect={onSelect}
        onTryCode={onTryCode}
      />,
    );

    // Clicking the ticket updates draft selection (does NOT close immediately)
    await user.click(screen.getByRole("radio", { name: /PEGASUS10/ }));
    expect(onSelect).not.toHaveBeenCalled();
    expect(screen.getAllByText(/PEGASUS10/).length).toBeGreaterThanOrEqual(1);

    // Confirm selection via "ใช้โค้ดนี้"
    await user.click(screen.getByRole("button", { name: "ใช้โค้ดนี้" }));
    expect(onSelect).toHaveBeenCalledWith("PEGASUS10");
    expect(onOpenChange).toHaveBeenCalledWith(false);

    // Test typing with trim and uppercase
    rerender(
      <CodePickerDialog
        open
        onOpenChange={onOpenChange}
        owner="PLATFORM"
        promotions={[platformPromo]}
        onSelect={onSelect}
        onTryCode={onTryCode}
      />,
    );

    await user.type(screen.getByLabelText("กรอกโค้ดอื่น"), "  discount20  ");
    await user.click(screen.getByRole("button", { name: "ใช้โค้ด" }));
    expect(onTryCode).toHaveBeenCalledWith("DISCOUNT20");
  });

  it("clears the selected code when clicking 'ไม่ใช้โค้ด'", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <CodePickerDialog
        open
        onOpenChange={onOpenChange}
        owner="PLATFORM"
        selectedCode="PEGASUS10"
        promotions={[platformPromo]}
        onSelect={onSelect}
        onTryCode={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "ไม่ใช้โค้ด" }));
    expect(onSelect).toHaveBeenCalledWith(null);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("shows error only to matching owner", () => {
    const { rerender } = render(
      <CodePickerDialog
        open
        onOpenChange={vi.fn()}
        owner="PLATFORM"
        promotions={[platformPromo]}
        error={{ owner: "PLATFORM", message: "โค้ดหมดอายุแล้ว" }}
        onSelect={vi.fn()}
        onTryCode={vi.fn()}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("โค้ดหมดอายุแล้ว");

    // Re-rendered for shop owner 1: platform error must not show
    rerender(
      <CodePickerDialog
        open
        onOpenChange={vi.fn()}
        owner={1}
        sellerName="Store A"
        promotions={[shopPromo]}
        error={{ owner: "PLATFORM", message: "โค้ดหมดอายุแล้ว" }}
        onSelect={vi.fn()}
        onTryCode={vi.fn()}
      />,
    );

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows empty state and triggers navigate home callback", async () => {
    const user = userEvent.setup();
    const onNavigateHome = vi.fn();

    render(
      <CodePickerDialog
        open
        onOpenChange={vi.fn()}
        owner="PLATFORM"
        promotions={[]}
        onSelect={vi.fn()}
        onTryCode={vi.fn()}
        onNavigateHome={onNavigateHome}
      />,
    );

    expect(screen.getByText("ยังไม่มีโค้ดที่เก็บไว้")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "ไปหน้าแรกเพื่อเก็บโค้ด" }));
    expect(onNavigateHome).toHaveBeenCalled();
  });

  it("invokes onClaim callback when claiming a coupon", async () => {
    const user = userEvent.setup();
    const onClaim = vi.fn();
    const claimable: AvailablePromotion = {
      ...platformPromo,
      id: 99,
      code: "CLAIMME",
      source: "CLAIMABLE",
      applicable: true,
    };

    render(
      <CodePickerDialog
        open
        onOpenChange={vi.fn()}
        owner="PLATFORM"
        promotions={[claimable]}
        onSelect={vi.fn()}
        onTryCode={vi.fn()}
        onClaim={onClaim}
      />,
    );

    await user.click(screen.getByRole("button", { name: "เก็บโค้ด CLAIMME" }));
    expect(onClaim).toHaveBeenCalledWith(claimable);
  });
});
