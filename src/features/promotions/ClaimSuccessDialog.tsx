import { translate, useLanguage } from "@/lib/language";
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

export interface ClaimSuccessDialogProps {
  code: string | null;
  onOpenChange(open: boolean): void;
}

/** M3 SUCCESS: a code typed into "โค้ดของฉัน" was collected. */
export function ClaimSuccessDialog({ code, onOpenChange }: ClaimSuccessDialogProps) {
  useLanguage();
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
            <DialogTitle className="text-lg font-bold">{translate("เก็บ", "Collect")} {code}  {translate("แล้ว", "applied")}</DialogTitle>
            <DialogDescription className="text-xs">
              {translate("อยู่ใน “โค้ดของฉัน”", "is in “My coupons”")}{terms ? translate(` ใช้ได้ถึง ${formatPromotionDate(terms.endsAt)}`, ` Valid until ${formatPromotionDate(terms.endsAt)}`) : ""} {translate("· เลือกใช้ได้ตอนอยู่ในตะกร้า", "· apply it in your cart")}</DialogDescription>
          </DialogHeader>
          {terms ? (
            <ClaimTicket promotion={{ ...terms, claimed: true }} />
          ) : (
            <Skeleton className="h-[100px] w-full rounded-xl" />
          )}
        </div>
        <DialogFooter className="m-0 flex-row justify-end gap-2 rounded-none border-t bg-muted/30 px-6 py-3">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>{translate("ปิด", "Close")}</Button>
          <Button size="sm" nativeButton={false} render={<Link to={shopHref} />}>
            {terms?.ownerType === "SELLER" ? translate("ไปที่ร้าน", "Visit shop") : translate("ไปช้อปเลย", "Shop now")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
