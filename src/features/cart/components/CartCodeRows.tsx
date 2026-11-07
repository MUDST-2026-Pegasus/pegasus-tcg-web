import { translate, useLanguage } from "@/lib/language";
import { ChevronRight, Sparkles, TicketPercent } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { checkoutMoney, formatPromotionRuleSummary } from "../checkout.format";
import type { AvailablePromotion } from "../promotions.types";

/** C2-E: a code that stopped working, shown in place of its code row. */
export function DroppedCodeNotice({ message }: { message: string }) {
  useLanguage();
  return (
    <p role="status" className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-900">
      {message}
    </p>
  );
}

type AppliedCodeBoxProps = {
  owner: "PLATFORM" | "SELLER";
  code: string;
  promotion?: AvailablePromotion;
  discount: number | null;
  /** FREE_SHIPPING is worked out once shipping is chosen. */
  pendingShipping?: boolean;
  claimed: boolean;
  onChange(): void;
};

/** C1: the chosen code — blue dashed for Pegasus, green for a shop. */
export function AppliedCodeBox({ owner, code, promotion, discount, pendingShipping, claimed, onChange }: AppliedCodeBoxProps) {
  useLanguage();
  const platform = owner === "PLATFORM";
  const detail = [
    promotion ? formatPromotionRuleSummary(promotion) : null,
    claimed ? translate("จากโค้ดที่เก็บไว้", "From saved coupons") : translate("โค้ดที่กรอก", "Entered code"),
  ].filter(Boolean).join(" · ");

  return (
    <button
      type="button"
      onClick={onChange}
      aria-label={translate(`${platform ? translate("โค้ด Pegasus", "Pegasus coupon") : translate("โค้ดร้าน", "Shop coupon")} ${code} — เปลี่ยนโค้ด`, `${platform ? translate("โค้ด Pegasus", "Pegasus coupon") : translate("โค้ดร้าน", "Shop coupon")} ${code} — change code`)}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg border border-dashed px-3 py-2.5 text-left transition-colors",
        platform ? "border-primary bg-primary/5 hover:bg-primary/10" : "border-teal-500 bg-teal-50/70 hover:bg-teal-50",
      )}
    >
      <TicketPercent className={cn("size-4 shrink-0", platform ? "text-primary" : "text-teal-700")} aria-hidden />
      <span className="min-w-0 flex-1">
        <strong className={cn("block truncate text-sm", platform ? "text-primary" : "text-teal-700")}>
          {platform ? code : translate(`โค้ดร้าน · ${code}`, `Shop coupon · ${code}`)}
        </strong>
        <span className="block truncate text-[11px] text-muted-foreground">{detail}</span>
      </span>
      <strong className={cn("shrink-0 text-sm", platform ? "text-primary" : "text-teal-700")}>
        {pendingShipping ? translate("ลดค่าส่ง", "Shipping discount") : `– ${checkoutMoney(discount ?? 0)}`}
      </strong>
      {platform ? (
        <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      ) : (
        <span className="shrink-0 text-xs font-medium text-primary">{translate("เปลี่ยน", "Change")}</span>
      )}
    </button>
  );
}

type PickCodeRowProps = {
  label: string;
  /** "มีโค้ดใช้ได้ 2 ใบ" / "มีโค้ดให้เก็บ 1 ใบ" */
  hint?: string | null;
  onOpen(): void;
};

/** C1: no code chosen yet — opens the picker. */
export function PickCodeRow({ label, hint, onOpen }: PickCodeRowProps) {
  useLanguage();
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors hover:bg-muted/40"
    >
      <TicketPercent className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      <span className="text-sm text-foreground">{label}</span>
      {hint && (
        <Badge variant="secondary" className="h-5 rounded-full bg-amber-50 px-2 text-[10px] font-medium text-amber-700">
          {hint}
        </Badge>
      )}
      <span className="ml-auto text-xs text-muted-foreground">{translate("เลือกหรือกรอกโค้ด", "Select or enter a code")}</span>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
    </button>
  );
}

export function AutoPickedNote() {
  useLanguage();
  return (
    <p className="flex items-center gap-1.5 text-[11px] text-emerald-700">
      <Sparkles className="size-3" aria-hidden /> {translate("เลือกโค้ดที่ลดได้มากที่สุดให้แล้ว", "The best discount code has been selected")}</p>
  );
}
