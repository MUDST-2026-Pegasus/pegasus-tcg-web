import { useState, type ReactNode } from "react";
import { Ticket, TicketPercent } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PromotionCodeForm } from "./PromotionCodeForm";
import { RadioGroup } from "@/components/ui/radio-group";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ClaimTicket } from "./ClaimTicket";
import { CouponTicket } from "./CouponTicket";
import {
  formatPromotionUnavailableReason,
  normalizePromotionCode,
} from "@/features/cart/checkout.format";
import type { AvailablePromotion, PromotionUiError } from "@/features/cart/promotions.types";
import { useTranslate } from "@/lib/i18n";

export interface CodePickerDialogProps {
  open: boolean;
  onOpenChange(open: boolean): void;
  owner: "PLATFORM" | number;
  sellerName?: string | null;
  promotions: AvailablePromotion[];
  selectedCode?: string | null;
  onSelect(code: string | null): void;
  onTryCode(code: string): void | Promise<void>;
  onClaim?: (promotion: AvailablePromotion) => void | Promise<void>;
  /** The code being collected, for the spinner on its ticket. */
  claimingId?: number | null;
  /** Under the "กรอกโค้ดอื่น" field: C2-C "เก็บไว้ใช้ครั้งหน้า" or "เก็บแล้วใช้เลย". */
  inputFooter?: ReactNode;
  error?: PromotionUiError | string | null;
  loading?: boolean;
  isGuest?: boolean;
  onLogin?: () => void;
  onRegister?: () => void;
  onNavigateHome?: () => void;
  onNavigateToStore?: () => void;
}

export function CodePickerDialog({
  open,
  onOpenChange,
  owner,
  sellerName,
  promotions,
  selectedCode,
  onSelect,
  onTryCode,
  onClaim,
  claimingId = null,
  inputFooter,
  error,
  loading = false,
  isGuest = false,
  onLogin,
  onRegister,
  onNavigateHome,
  onNavigateToStore,
}: CodePickerDialogProps) {
  const { t } = useTranslate("promotions");
  const [draftCode, setDraftCode] = useState<string | null>(selectedCode ?? null);
  const [typed, setTyped] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [previousContext, setPreviousContext] = useState({
    open,
    owner,
    selectedCode,
  });

  if (
    previousContext.open !== open ||
    previousContext.owner !== owner ||
    previousContext.selectedCode !== selectedCode
  ) {
    const openedOrChangedOwner =
      open && (!previousContext.open || previousContext.owner !== owner);
    setPreviousContext({ open, owner, selectedCode });
    setDraftCode(selectedCode ?? null);
    if (openedOrChangedOwner) setTyped("");
  }

  const resolvedError = (() => {
    if (!error) return null;
    if (typeof error === "string") return error;
    if (error.owner === owner) return error.message;
    return null;
  })();

  const relevant = promotions.filter((promotion) =>
    owner === "PLATFORM"
      ? promotion.ownerType === "PLATFORM"
      : promotion.sellerProfileId === owner,
  );

  const groups = [
    {
      title: t("buyer.codePickerDialog.title", "เก็บไว้ใช้ได้"),
      items: relevant.filter(
        (promotion) => promotion.source === "CLAIMED" && promotion.applicable,
      ),
    },
    {
      title: t("buyer.codePickerDialog.title2", "เก็บไว้แต่ยังใช้ไม่ได้"),
      items: relevant.filter(
        (promotion) => promotion.source === "CLAIMED" && !promotion.applicable,
      ),
    },
    {
      title: t("buyer.codePickerDialog.title3", "ยังไม่ได้เก็บ"),
      items: relevant.filter((promotion) => promotion.source === "CLAIMABLE"),
    },
    {
      title: t("buyer.codePickerDialog.title4", "โค้ดทั่วไป"),
      items: relevant.filter((promotion) => promotion.source === "PUBLIC"),
    },
  ];

  const handleTrySubmit = async () => {
    const normalized = normalizePromotionCode(typed);
    if (!normalized || loading || submitting) return;
    setSubmitting(true);
    try {
      await onTryCode(normalized);
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirm = () => {
    onSelect(draftCode);
    onOpenChange(false);
  };

  const handleClear = () => {
    setDraftCode(null);
    onSelect(null);
    onOpenChange(false);
  };

  const title =
    owner === "PLATFORM"
      ? t("buyer.codePickerDialog.title5", "เลือกโค้ดส่วนลด Pegasus")
      : t("buyer.codePickerDialog.title6", "โค้ดร้าน {value}", { value: sellerName || "" });
  const onNavigateToPromotions =
    owner === "PLATFORM" ? onNavigateHome : onNavigateToStore;
  const navigateLabel =
    owner === "PLATFORM" ? t("buyer.codePickerDialog.navigateLabel", "ไปหน้าแรกเพื่อเก็บโค้ด") : t("buyer.codePickerDialog.navigateLabel2", "ไปร้านค้าเพื่อเก็บโค้ด");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85svh] w-[520px] max-w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden rounded-xl p-0">
        <DialogHeader className="p-6 pb-3">
          <DialogTitle className="text-base font-semibold">{title}</DialogTitle>
        </DialogHeader>

        {/* Input box at top as specified by Figma B2/C2 */}
        <div className="border-b px-6 pb-4">
          <PromotionCodeForm id="promo-code-input" label={t("buyer.codePickerDialog.label", "กรอกโค้ดอื่น")}
            value={typed} onChange={setTyped} onSubmit={() => handleTrySubmit()}
            error={resolvedError} loading={loading || submitting} />
          {inputFooter}
        </div>

        {/* Scrollable list */}
        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
          {isGuest && (
            <div className="rounded-xl border border-dashed border-border bg-muted/40 p-3 text-center text-xs text-muted-foreground">
              <p>{t("buyer.codePickerDialog.p", "เข้าสู่ระบบเพื่อดูโค้ดส่วนลดที่คุณเก็บไว้")}</p>
              <div className="mt-2 flex justify-center gap-2">
                {onLogin && (
                  <Button size="sm" variant="outline" onClick={onLogin}>
                    {t("buyer.codePickerDialog.button", "เข้าสู่ระบบ")}
                  </Button>
                )}
                {onRegister && (
                  <Button size="sm" variant="ghost" onClick={onRegister}>
                    {t("buyer.codePickerDialog.button2", "สมัครสมาชิก")}
                  </Button>
                )}
              </div>
            </div>
          )}

          <RadioGroup value={draftCode ?? ""} onValueChange={(value) => setDraftCode(String(value))} className="gap-4">
          {groups.map((group) => {
            if (!group.items.length) return null;
            return (
              <section key={group.title} className="grid gap-2">
                <h3 className="text-xs font-semibold text-muted-foreground">
                  {group.title} ({group.items.length})
                </h3>
                {group.items.map((promotion) => {
                  if (promotion.source === "CLAIMABLE" && onClaim) {
                    // C2-A: a full-width claim ticket; collecting it also selects it.
                    return (
                      <ClaimTicket
                        key={promotion.id}
                        promotion={{
                          ...promotion,
                          claimed: false,
                          shop: promotion.sellerName
                            ? { sellerProfileId: promotion.sellerProfileId ?? 0, name: promotion.sellerName, username: "" }
                            : null,
                        }}
                        claiming={claimingId === promotion.id}
                        onClaim={() => void onClaim(promotion)}
                      />
                    );
                  }
                  const canSelect =
                    promotion.source !== "CLAIMABLE" && promotion.applicable;
                  const unavailableReason =
                    formatPromotionUnavailableReason(promotion);
                  const ticket = (
                    <CouponTicket
                      promotion={promotion}
                      selected={draftCode === promotion.code}
                      disabled={!canSelect}
                      onSelect={
                        canSelect ? () => setDraftCode(promotion.code) : undefined
                      }
                    />
                  );

                  return (
                    <div key={promotion.id} className="grid gap-4">
                      {canSelect ? (
                        ticket
                      ) : (
                        <Tooltip>
                          <TooltipTrigger
                            render={
                              <span
                                tabIndex={0}
                                aria-label={`${promotion.code}: ${unavailableReason}`}
                                className="block"
                              />
                            }
                          >
                            {ticket}
                          </TooltipTrigger>
                          <TooltipContent>{unavailableReason}</TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  );
                })}
              </section>
            );
          })}
          </RadioGroup>

          {!relevant.length && (
            <div className="flex flex-col items-center justify-center gap-2 rounded-xl bg-muted/30 py-8 text-center">
              <TicketPercent className="size-8 text-muted-foreground/60" />
              <p className="text-sm font-medium text-foreground">{t("buyer.codePickerDialog.p2", "ยังไม่มีโค้ดที่เก็บไว้")}</p>
              <p className="text-xs text-muted-foreground">{t("buyer.codePickerDialog.p3", "เก็บโค้ดได้ที่หน้าแรกและหน้าร้าน")}</p>
              {onNavigateToPromotions && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onNavigateToPromotions}
                  className="mt-2 text-xs"
                >
                  <Ticket className="mr-1.5 size-3.5" />
                  {navigateLabel}
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Footer actions match the shared Figma picker for platform and seller codes. */}
        <div className="sticky bottom-0 flex items-center justify-end gap-2 border-t bg-card px-6 py-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-lg bg-background"
            onClick={handleClear}
          >
            {t("buyer.codePickerDialog.button3", "ไม่ใช้โค้ด")}
          </Button>
          <Button
            type="button"
            size="sm"
            className="rounded-lg"
            disabled={!draftCode}
            onClick={handleConfirm}
          >
            {t("buyer.codePickerDialog.button4", "ใช้โค้ดนี้")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
