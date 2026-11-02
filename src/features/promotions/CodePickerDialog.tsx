import { useState } from "react";
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
import { CouponTicket } from "./CouponTicket";
import {
  formatPromotionUnavailableReason,
  formatPromotionValue,
  normalizePromotionCode,
} from "@/features/cart/checkout.format";
import type { AvailablePromotion, PromotionUiError } from "@/features/cart/promotions.types";

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
  error,
  loading = false,
  isGuest = false,
  onLogin,
  onRegister,
  onNavigateHome,
  onNavigateToStore,
}: CodePickerDialogProps) {
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
      title: "เก็บไว้ใช้ได้",
      items: relevant.filter(
        (promotion) => promotion.source === "CLAIMED" && promotion.applicable,
      ),
    },
    {
      title: "เก็บไว้แต่ยังใช้ไม่ได้",
      items: relevant.filter(
        (promotion) => promotion.source === "CLAIMED" && !promotion.applicable,
      ),
    },
    {
      title: "ยังไม่ได้เก็บ",
      items: relevant.filter((promotion) => promotion.source === "CLAIMABLE"),
    },
    {
      title: "โค้ดทั่วไป",
      items: relevant.filter((promotion) => promotion.source === "PUBLIC"),
    },
  ];

  const draftPromotion = relevant.find((p) => p.code === draftCode);

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
      ? "เลือกโค้ดส่วนลด Pegasus"
      : `โค้ดร้าน ${sellerName || ""}`;
  const onNavigateToPromotions =
    owner === "PLATFORM" ? onNavigateHome : onNavigateToStore;
  const navigateLabel =
    owner === "PLATFORM" ? "ไปหน้าแรกเพื่อเก็บโค้ด" : "ไปร้านค้าเพื่อเก็บโค้ด";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85svh] w-[520px] max-w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden rounded-xl p-0">
        <DialogHeader className="p-6 pb-3">
          <DialogTitle className="text-base font-semibold">{title}</DialogTitle>
        </DialogHeader>

        {/* Input box at top as specified by Figma B2/C2 */}
        <div className="border-b px-6 pb-4">
          <PromotionCodeForm id="promo-code-input" label="กรอกโค้ดอื่น"
            value={typed} onChange={setTyped} onSubmit={() => handleTrySubmit()}
            error={resolvedError} loading={loading || submitting} />
        </div>

        {/* Scrollable list */}
        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
          {isGuest && (
            <div className="rounded-xl border border-dashed border-border bg-muted/40 p-3 text-center text-xs text-muted-foreground">
              <p>เข้าสู่ระบบเพื่อดูโค้ดส่วนลดที่คุณเก็บไว้</p>
              <div className="mt-2 flex justify-center gap-2">
                {onLogin && (
                  <Button size="sm" variant="outline" onClick={onLogin}>
                    เข้าสู่ระบบ
                  </Button>
                )}
                {onRegister && (
                  <Button size="sm" variant="ghost" onClick={onRegister}>
                    สมัครสมาชิก
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
                    <div key={promotion.id} className="grid gap-1">
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
                      {promotion.source === "CLAIMABLE" && onClaim && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={promotion.remainingClaims === 0}
                          onClick={() => void onClaim(promotion)}
                          className="justify-self-end text-xs"
                        >
                          {promotion.applicable ? "เก็บแล้วใช้เลย" : "เก็บโค้ด"}
                        </Button>
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
              <p className="text-sm font-medium text-foreground">ยังไม่มีโค้ดที่เก็บไว้</p>
              <p className="text-xs text-muted-foreground">ยังไม่มีโค้ดสำหรับรายการนี้</p>
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

        {/* Footer with discount summary and action buttons */}
        <div className="sticky bottom-0 flex items-center justify-between gap-3 border-t bg-card px-6 py-3">
          <div className="min-w-0 flex-1 text-xs">
            {draftPromotion ? (
              <p className="truncate">
                <span className="text-muted-foreground">เลือก: </span>
                <strong className="font-semibold text-foreground">
                  {draftPromotion.code}
                </strong>
                <span
                  className={`ml-1 font-medium ${
                    draftPromotion.ownerType === "PLATFORM"
                      ? "text-primary"
                      : "text-teal-700"
                  }`}
                >
                  ({formatPromotionValue(draftPromotion)})
                </span>
              </p>
            ) : (
              <span className="text-muted-foreground">ยังไม่ได้เลือกโค้ด</span>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClear}
            >
              ไม่ใช้โค้ด
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={!draftCode}
              onClick={handleConfirm}
            >
              ใช้โค้ดนี้
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
