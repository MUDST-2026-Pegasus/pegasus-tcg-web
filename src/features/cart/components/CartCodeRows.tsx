import { ChevronRight, Sparkles, TicketPercent } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { checkoutMoney, formatPromotionRuleSummary } from "../checkout.format";
import type { AvailablePromotion } from "../promotions.types";
import { useTranslate } from "@/lib/i18n";

/** C2-E: a code that stopped working, shown in place of its code row. */
export function DroppedCodeNotice({ message }: { message: string }) {
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
  const { t } = useTranslate("buyer");
  const platform = owner === "PLATFORM";
  const detail = [
    promotion ? formatPromotionRuleSummary(promotion) : null,
    claimed ? t("cart.code.fromClaimed", "จากโค้ดที่เก็บไว้") : t("cart.code.typed", "โค้ดที่กรอก"),
  ].filter(Boolean).join(" · ");

  return (
    <button
      type="button"
      onClick={onChange}
      aria-label={platform ? t("cart.code.changePlatformAria", "โค้ด Pegasus {code} — เปลี่ยนโค้ด", { code }) : t("cart.code.changeShopAria", "โค้ดร้าน {code} — เปลี่ยนโค้ด", { code })}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg border border-dashed px-3 py-2.5 text-left transition-colors",
        platform ? "border-primary bg-primary/5 hover:bg-primary/10" : "border-teal-500 bg-teal-50/70 hover:bg-teal-50",
      )}
    >
      <TicketPercent className={cn("size-4 shrink-0", platform ? "text-primary" : "text-teal-700")} aria-hidden />
      <span className="min-w-0 flex-1">
        <strong className={cn("block truncate text-sm", platform ? "text-primary" : "text-teal-700")}>
          {platform ? code : t("cart.code.shopCode", "โค้ดร้าน · {code}", { code })}
        </strong>
        <span className="block truncate text-[11px] text-muted-foreground">{detail}</span>
      </span>
      <strong className={cn("shrink-0 text-sm", platform ? "text-primary" : "text-teal-700")}>
        {pendingShipping ? t("cart.code.shippingDiscount", "ลดค่าส่ง") : `– ${checkoutMoney(discount ?? 0)}`}
      </strong>
      {platform ? (
        <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      ) : (
        <span className="shrink-0 text-xs font-medium text-primary">{t("cart.code.change", "เปลี่ยน")}</span>
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
  const { t } = useTranslate("buyer");
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
      <span className="ml-auto text-xs text-muted-foreground">{t("cart.code.pickOrType", "เลือกหรือกรอกโค้ด")}</span>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
    </button>
  );
}

export function AutoPickedNote() {
  const { t } = useTranslate("buyer");
  return (
    <p className="flex items-center gap-1.5 text-[11px] text-emerald-700">
      <Sparkles className="size-3" aria-hidden /> {t("cart.code.autoPicked", "เลือกโค้ดที่ลดได้มากที่สุดให้แล้ว")}
    </p>
  );
}
