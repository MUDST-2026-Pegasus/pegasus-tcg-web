import { translate, useLanguage } from "@/lib/language";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AddressFormDialog } from "@/features/account/components/AddressFormDialog";
import { formatAddressLines, MAX_ADDRESSES } from "@/features/account/address.format";
import type { Address } from "@/features/account/address.types";
import { cn } from "@/lib/utils";

interface Props {
  addresses: Address[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CheckoutAddressPicker({ addresses, selectedId, onSelect, open, onOpenChange }: Props) {
  useLanguage();
  const [draftId, setDraftId] = useState<number | null>(selectedId);
  const [previousSelectedId, setPreviousSelectedId] = useState(selectedId);
  if (selectedId !== previousSelectedId) {
    setPreviousSelectedId(selectedId);
    setDraftId(selectedId);
  }
  const [form, setForm] = useState<{ address?: Address } | null>(null);
  const validDraft = addresses.some((a) => a.id === draftId);
  const editAddress = (address?: Address) => {
    onOpenChange(false);
    setForm({ address });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(next) => {
        if (!next) setDraftId(selectedId);
        onOpenChange(next);
      }}>
        <DialogContent className="checkout-address-dialog" overlayClassName="bg-[rgba(9,11,12,0.45)] supports-backdrop-filter:backdrop-blur-none" aria-describedby="checkout-address-description">
          <DialogHeader className="checkout-address-header">
            <DialogTitle className="font-semibold">{translate("เลือกที่อยู่จัดส่ง", "Select a shipping address")}</DialogTitle>
            <span className="text-xs text-muted-foreground">{addresses.length} / {MAX_ADDRESSES}</span>
            <DialogDescription id="checkout-address-description" className="sr-only">
              {translate("เลือกที่อยู่สำหรับคำสั่งซื้อนี้ หรือเพิ่มที่อยู่ใหม่", "Choose an address for this order or add a new one")}</DialogDescription>
          </DialogHeader>
          <div className="checkout-address-body">
            {addresses.length === 0 ? (
              <div className="checkout-address-empty">
                <p className="font-semibold text-sm">{translate("ยังไม่มีที่อยู่จัดส่ง", "No shipping addresses yet")}</p>
                <p className="text-xs text-muted-foreground">{translate("เพิ่มที่อยู่ก่อนเพื่อดำเนินการสั่งซื้อ", "Add an address to place your order")}</p>
              </div>
            ) : (
              <RadioGroup
                aria-label={translate("ที่อยู่จัดส่ง", "Shipping address")}
                value={draftId == null ? "" : String(draftId)}
                onValueChange={(value) => setDraftId(Number(value))}
                className="gap-2.5"
              >
                {addresses.map((address) => (
                  <div key={address.id} className={cn("checkout-address-option", draftId === address.id && "is-selected")}>
                    <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-3">
                      <RadioGroupItem value={String(address.id)} className="checkout-radio mt-0.5" />
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[13px] font-semibold">{address.recipientName} · {address.phone}</span>
                          {address.label && <span className="checkout-chip">{address.label}</span>}
                          {address.defaultShipping && <span className="checkout-chip checkout-default">{translate("ค่าเริ่มต้น", "Default")}</span>}
                        </span>
                        <span className="mt-1 block text-xs leading-[18px] text-muted-foreground">
                          {formatAddressLines(address).join(" ")}
                        </span>
                      </span>
                    </label>
                    <button type="button" className="checkout-link shrink-0 text-xs" aria-label={translate(`แก้ไขที่อยู่ ${address.label || address.recipientName}`, `Edit address ${address.label || address.recipientName}`)} onClick={() => editAddress(address)}>{translate("แก้ไข", "Edit")}</button>
                  </div>
                ))}
              </RadioGroup>
            )}
            {addresses.length < MAX_ADDRESSES && (
              <button type="button" className="checkout-add-address" onClick={() => editAddress()}>{translate("+ เพิ่มที่อยู่ใหม่", "+ Add a new address")}</button>
            )}
          </div>
          <DialogFooter className="checkout-address-footer">
            <Button variant="ghost" className="rounded-full text-[13px]" onClick={() => {
              setDraftId(selectedId);
              onOpenChange(false);
            }}>{translate("ยกเลิก", "Cancel")}</Button>
            <Button className="checkout-primary rounded-full text-[13px]" disabled={!validDraft} onClick={() => {
              if (draftId != null && validDraft) {
                onSelect(draftId);
                onOpenChange(false);
              }
            }}>{translate("ใช้ที่อยู่นี้", "Use this address")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AddressFormDialog
        open={form !== null}
        address={form?.address}
        onSaved={(address) => setDraftId(address.id)}
        onOpenChange={(next) => {
          if (!next) {
            setForm(null);
            onOpenChange(true);
          }
        }}
      />
    </>
  );
}
