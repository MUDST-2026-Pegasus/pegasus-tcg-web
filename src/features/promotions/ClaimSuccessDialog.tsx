import { CircleCheck } from "lucide-react";
import { Link } from "react-router-dom";
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
import { formatPromotionDate } from "@/features/cart/checkout.format";
import { ClaimTicket } from "./ClaimTicket";
import { usePromotionTerms } from "./claim.queries";
import { useTranslate } from "@/lib/i18n";

export interface ClaimSuccessDialogProps {
  code: string | null;
  onOpenChange(open: boolean): void;
}

/** M3 SUCCESS: a code typed into "โค้ดของฉัน" was collected. */
export function ClaimSuccessDialog({ code, onOpenChange }: ClaimSuccessDialogProps) {
  const { t } = useTranslate("promotions");
  const terms = usePromotionTerms(code).data;
  const shopHref = terms?.ownerType === "SELLER" && terms.shop
    ? `/u/${encodeURIComponent(terms.shop.username)}`
    : "/products";

  return (
    <Dialog open={code !== null} onOpenChange={onOpenChange}>
      <DialogContent className="w-[400px] max-w-[calc(100%-2rem)] gap-0 overflow-hidden rounded-xl p-0">
        <div className="grid gap-4 p-6">
          <span className="flex size-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <CircleCheck className="size-5" aria-hidden />
          </span>
          <DialogHeader className="gap-1">
            <DialogTitle className="text-lg font-bold">{t("buyer.claimSuccessDialog.dialogTitle", "เก็บ")} {code} {t("buyer.claimSuccessDialog.dialogTitle2", "แล้ว")}</DialogTitle>
            <DialogDescription className="text-xs">
              {t("buyer.claimSuccessDialog.dialogDescription", "อยู่ใน “โค้ดของฉัน”")}{terms ? t("buyer.claimSuccessDialog.dialogDescription2", " ใช้ได้ถึง {value}", { value: formatPromotionDate(terms.endsAt) }) : ""} {t("buyer.claimSuccessDialog.dialogDescription3", "· เลือกใช้ได้ตอนอยู่ในตะกร้า")}
            </DialogDescription>
          </DialogHeader>
          {terms ? (
            <ClaimTicket promotion={{ ...terms, claimed: true }} />
          ) : (
            <Skeleton className="h-[100px] w-full rounded-xl" />
          )}
        </div>
        <DialogFooter className="m-0 flex-row justify-end gap-2 rounded-none border-t bg-muted/30 px-6 py-3">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>{t("buyer.claimSuccessDialog.button", "ปิด")}</Button>
          <Button size="sm" nativeButton={false} render={<Link to={shopHref} />}>
            {terms?.ownerType === "SELLER" ? t("buyer.claimSuccessDialog.button2", "ไปที่ร้าน") : t("buyer.claimSuccessDialog.button3", "ไปช้อปเลย")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
