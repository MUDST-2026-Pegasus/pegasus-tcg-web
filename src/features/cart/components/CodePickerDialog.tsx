import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { CouponTicket } from "./CouponTicket";
import type { AvailablePromotion } from "../promotions.types";

export function CodePickerDialog({ open, onOpenChange, owner, sellerName, promotions, selectedCode, onSelect, onClaim, onTryCode, error }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  owner: "PLATFORM" | number;
  sellerName?: string;
  promotions: AvailablePromotion[];
  selectedCode?: string | null;
  onSelect: (code: string | null) => void;
  onClaim?: (promotion: AvailablePromotion) => void;
  onTryCode: (code: string) => void;
  error?: string | null;
}) {
  const [typed, setTyped] = useState("");
  const relevant = promotions.filter((promotion) => owner === "PLATFORM" ? promotion.ownerType === "PLATFORM" : promotion.sellerProfileId === owner);
  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-h-[85svh] w-[520px] max-w-[calc(100%-2rem)] gap-4 overflow-y-auto rounded-2xl p-6">
      <DialogHeader><DialogTitle>เลือกโค้ดส่วนลด{owner === "PLATFORM" ? " Pegasus" : `ร้าน ${sellerName || ""}`}</DialogTitle></DialogHeader>
      {(["CLAIMED", "CLAIMABLE", "PUBLIC"] as const).map((source) => {
        const group = relevant.filter((promotion) => promotion.source === source);
        if (!group.length) return null;
        return <section key={source} className="grid gap-2">
          <h3 className="text-sm font-semibold">{{ CLAIMED: "เก็บไว้แล้ว", CLAIMABLE: "ยังไม่ได้เก็บ", PUBLIC: "โค้ดทั่วไป" }[source]}</h3>
          {group.map((promotion) => <div key={promotion.id} className="grid gap-1">
            <CouponTicket promotion={promotion} selected={selectedCode === promotion.code} onSelect={() => { onSelect(promotion.code); onOpenChange(false); }} />
            {source === "CLAIMABLE" && onClaim && <Button size="sm" variant="outline" disabled={promotion.remainingClaims === 0} onClick={() => onClaim(promotion)}>เก็บโค้ด</Button>}
          </div>)}
        </section>;
      })}
      {!relevant.length && <p className="rounded-lg bg-muted p-5 text-center text-sm text-muted-foreground">ยังไม่มีโค้ดสำหรับรายการนี้</p>}
      {selectedCode && <Button variant="outline" onClick={() => { onSelect(null); onOpenChange(false); }}>ไม่ใช้โค้ด</Button>}
      <form onSubmit={(event) => { event.preventDefault(); if (typed.trim()) onTryCode(typed.trim().toUpperCase()); }} className="grid gap-2 border-t pt-4">
        <label htmlFor="promo-code-input" className="text-sm font-medium">กรอกโค้ดอื่น</label>
        <div className="flex gap-2"><Input id="promo-code-input" value={typed} onChange={(event) => setTyped(event.target.value)} maxLength={20} placeholder="กรอกโค้ดส่วนลด" /><Button type="submit">ใช้โค้ด</Button></div>
        {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
      </form>
    </DialogContent>
  </Dialog>;
}
