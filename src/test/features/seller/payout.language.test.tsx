import { afterEach, describe, expect, it } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { getLanguage, setLanguage } from "@/lib/language";
import { PayoutBalance } from "@/features/seller/payout/components/PayoutBalance";
import { payoutStatus, validatePayoutAmount } from "@/features/seller/payout/payout.format";

const initialLanguage = getLanguage();
afterEach(() => setLanguage(initialLanguage));

describe("seller payout language", () => {
  it("updates financial labels and validation without changing status values", () => {
    setLanguage("th");
    expect(payoutStatus("PAID").label).toBe("โอนสำเร็จ");
    expect(validatePayoutAmount("", 500)).toBe("กรุณาระบุจำนวนเงิน");
    setLanguage("en");
    expect(payoutStatus("PAID").label).toBe("Transfer completed");
    expect(validatePayoutAmount("", 500)).toBe("Enter an amount");
    expect(payoutStatus("UNKNOWN").label).toBe("UNKNOWN");
  });

  it("updates the mounted payout UI when the language changes", () => {
    setLanguage("th");
    render(<PayoutBalance wallet={null} pendingCount={0} blockedReason={null} onWithdraw={() => {}} />);
    expect(screen.getByRole("button", { name: "ขอถอนเงิน" })).toBeInTheDocument();
    act(() => setLanguage("en"));
    expect(screen.getByRole("button", { name: "Request withdrawal" })).toBeInTheDocument();
    expect(screen.getByText("Available to withdraw")).toBeInTheDocument();
  });
});
