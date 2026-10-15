import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CheckoutAddressPicker } from "@/features/cart/components/CheckoutAddressPicker";
import { MAX_ADDRESSES } from "@/features/account/address.format";
import type { Address } from "@/features/account/address.types";

const { saved } = vi.hoisted(() => ({ saved: { id: 30, recipientName: "New Buyer", phone: "0811111111", line1: "New address", line2: null, subdistrict: null, district: null, province: "Bangkok", postalCode: "10110", label: "New", defaultShipping: false } }));
vi.mock("@/features/account/components/AddressFormDialog", () => ({
  AddressFormDialog: ({ open, onSaved, onOpenChange }: { open: boolean; onSaved: (address: unknown) => void; onOpenChange: (open: boolean) => void }) =>
    open ? <button onClick={() => { onSaved(saved); onOpenChange(false); }}>Save new address</button> : null,
}));

const address = { ...saved, id: 1, recipientName: "Existing Buyer", label: "Home", defaultShipping: true } as Address;
function Harness({ addresses, onSelect }: { addresses: Address[]; onSelect: (id: number) => void }) {
  const [open, setOpen] = useState(true);
  return <CheckoutAddressPicker addresses={addresses} selectedId={1} onSelect={onSelect} open={open} onOpenChange={setOpen} />;
}

describe("CheckoutAddressPicker", () => {
  it("hides the add action when the shared address limit is reached", () => {
    const addresses = Array.from({ length: MAX_ADDRESSES }, (_, i) => ({ ...address, id: i + 1, label: "Address " + (i + 1) }));
    render(<Harness addresses={addresses} onSelect={vi.fn()} />);
    expect(screen.getByText("10 / 10")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "+ เพิ่มที่อยู่ใหม่" })).not.toBeInTheDocument();
  });

  it("selects a newly saved address in the popup and waits for confirmation", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const view = render(<Harness addresses={[address]} onSelect={onSelect} />);
    await user.click(screen.getByRole("button", { name: "+ เพิ่มที่อยู่ใหม่" }));
    await user.click(screen.getByRole("button", { name: "Save new address" }));
    view.rerender(<Harness addresses={[address, saved as Address]} onSelect={onSelect} />);
    expect(screen.getByRole("radio", { name: /New Buyer/ })).toBeChecked();
    expect(onSelect).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "ใช้ที่อยู่นี้" }));
    expect(onSelect).toHaveBeenCalledWith(30);
  });
});
