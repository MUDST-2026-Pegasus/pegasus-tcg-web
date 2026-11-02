import { Check, Copy } from "lucide-react";
import { Link } from "react-router-dom";
import { ErrorState } from "@/components/common";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { ClaimTicket } from "./ClaimTicket";
import { termsRows } from "./claim.format";
import { usePromotionTerms } from "./claim.queries";
import type { PromotionTerms } from "./claim.types";

export interface PromotionTermsDialogProps {
  code: string | null;
  onOpenChange(open: boolean): void;
  onClaim?: (terms: PromotionTerms) => void;
  onCopy(code: string): void;
  claiming?: boolean;
  /** The shop is looking at its own code — no claim button. */
  ownerView?: boolean;
}

/** M3 "เงื่อนไขโค้ด": opened by clicking a ticket on the home, store or wallet page. */
export function PromotionTermsDialog({
  code,
  onOpenChange,
  onClaim,
  onCopy,
  claiming = false,
  ownerView = false,
}: PromotionTermsDialogProps) {
  const query = usePromotionTerms(code);
  const terms = query.data;
  const platform = terms?.ownerType === "PLATFORM";
  const canClaim = !!terms && !ownerView && terms.claimable && !terms.claimed
    && terms.remainingClaims !== 0 && !!onClaim;

  return (
    <Dialog open={code !== null} onOpenChange={onOpenChange}>
      <DialogContent className="w-[420px] max-w-[calc(100%-2rem)] gap-0 overflow-hidden rounded-xl p-0">
        {query.isPending ? (
          <div className="grid gap-4 p-6" role="status" aria-label="กำลังโหลดเงื่อนไขโค้ด">
            <DialogTitle className="sr-only">เงื่อนไขโค้ด</DialogTitle>
            <Skeleton className="h-[100px] w-full rounded-xl" />
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : query.isError || !terms ? (
          <div className="p-6">
            <DialogTitle className="sr-only">เงื่อนไขโค้ด</DialogTitle>
            <ErrorState error={query.error} onRetry={() => void query.refetch()} />
          </div>
        ) : (
          <>
            <div className="grid gap-4 px-6 pt-10 pb-5">
              <ClaimTicket
                promotion={{ ...terms, claimed: terms.claimed }}
                hideAction={ownerView || !terms.claimable}
                claiming={claiming}
                onClaim={canClaim ? () => onClaim?.(terms) : undefined}
              />
              <DialogHeader className="gap-1">
                <DialogTitle className="text-lg font-bold">{terms.name}</DialogTitle>
                <DialogDescription className="text-xs">
                  {platform
                    ? "โค้ดส่วนลดจาก Pegasus · Pegasus ออกส่วนลดให้"
                    : `โค้ดร้าน ${terms.shop?.name ?? ""} · ร้านออกส่วนลดให้`}
                </DialogDescription>
              </DialogHeader>
              {terms.description && <p className="text-sm text-foreground/80">{terms.description}</p>}

              <div className="flex items-center justify-between gap-3 rounded-lg border border-dashed bg-muted/40 px-4 py-2.5">
                <strong className="truncate text-base tracking-[0.12em]">{terms.code}</strong>
                <Button type="button" variant="outline" size="sm" onClick={() => onCopy(terms.code)}>
                  <Copy data-icon="inline-start" /> คัดลอก
                </Button>
              </div>

              <ul className="grid gap-2.5" aria-label="เงื่อนไข">
                {termsRows(terms).map((row) => (
                  <li key={row.label} className="flex gap-2.5">
                    <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-600" aria-hidden />
                    <div className="min-w-0">
                      <p className="text-[11px] text-muted-foreground">{row.label}</p>
                      <p className="text-[13px] text-foreground">{row.value}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <DialogFooter className="m-0 flex-row justify-end gap-2 rounded-none border-t bg-muted/30 px-6 py-3">
              {platform ? (
                <Button type="button" variant="outline" size="sm" onClick={() => onCopy(terms.code)}>
                  คัดลอกโค้ด
                </Button>
              ) : (
                <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                  ปิด
                </Button>
              )}
              {canClaim ? (
                <Button type="button" size="sm" disabled={claiming} onClick={() => onClaim?.(terms)}
                  className={platform ? undefined : "bg-teal-600 hover:bg-teal-700"}>
                  {claiming ? <Spinner /> : "เก็บโค้ด"}
                </Button>
              ) : !platform && terms.shop && !ownerView ? (
                <Button size="sm" className="bg-teal-600 hover:bg-teal-700" nativeButton={false}
                  render={<Link to={`/u/${encodeURIComponent(terms.shop.username)}`} />}>
                  ไปที่ร้าน
                </Button>
              ) : platform && !ownerView ? (
                <Button size="sm" nativeButton={false} render={<Link to="/products" />}>
                  ช้อปเลย
                </Button>
              ) : null}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
