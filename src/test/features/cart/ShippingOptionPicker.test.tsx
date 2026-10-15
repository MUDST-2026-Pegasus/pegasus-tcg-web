import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ShippingOptionPicker } from "@/features/cart/components/ShippingOptionPicker";
import type { ShippingQuote, ShippingQuoteOption } from "@/features/cart/checkout.types";

const standard: ShippingQuoteOption = { id: 11, name: "Standard", carrierCode: "KERRY", baseFee: 40, perItemFee: 5, freeThreshold: 500, estDaysMin: 1, estDaysMax: 3, fee: 45, free: false, amountToFree: 100 };
const quote: ShippingQuote = { sellerProfileId: 1, sellerName: "Demo", itemCount: 2, itemsSubtotal: 400, defaultOptionId: 11, options: [standard, { ...standard, id: 12, name: "Express", fee: 70 }] };

describe("ShippingOptionPicker", () => {
  it("uses the default and lets the whole option row select another method", async () => {
    const onSelect = vi.fn();
    function Harness() {
      const [id, setId] = useState(quote.defaultOptionId);
      return <ShippingOptionPicker sellerName="Demo" itemCount={2} quote={quote} selected={quote.options.find(o => o.id === id)} loading={false} failed={false} disabled={false} onSelect={(next) => { onSelect(next); setId(next); }} />;
    }
    render(<Harness />);
    expect(screen.getByRole("radio", { name: /Standard Demo/ })).toBeChecked();
    await userEvent.click(screen.getByText("Express"));
    expect(onSelect).toHaveBeenCalledWith(12);
    expect(screen.getByRole("radio", { name: /Express Demo/ })).toBeChecked();
  });

  it("shows free shipping and the full per-item tariff crossed out", () => {
    const freeOption = { ...standard, fee: 0, free: true, amountToFree: null };
    render(<ShippingOptionPicker sellerName="Demo" itemCount={3} quote={{ ...quote, itemCount: 3, options: [freeOption] }} loading={false} failed={false} disabled={false} onSelect={vi.fn()} />);
    expect(screen.getByText("ส่งฟรี", { exact: true })).toBeInTheDocument();
    expect(screen.getByText("฿50")).toHaveClass("line-through");
    expect(screen.getByText(/ยอดถึง ฿500 แล้ว/)).toBeInTheDocument();
  });

  it("uses the computed API fee and the shared carrier label", () => {
    render(<ShippingOptionPicker sellerName="Demo" itemCount={3} quote={{ ...quote, options: [{ ...standard, carrierCode: "THAILAND_POST_EMS", fee: 17 }] }} loading={false} failed={false} disabled={false} onSelect={vi.fn()} />);
    expect(screen.getByText("฿17")).toBeInTheDocument();
    expect(screen.getByText("ไปรษณีย์ไทย EMS")).toBeInTheDocument();
    expect(screen.getByText(/ซื้อเพิ่มอีก ฿100/)).toBeInTheDocument();
    expect(screen.getByText(/ร้านนี้มีวิธีจัดส่งเดียว/)).toBeInTheDocument();
  });
});
