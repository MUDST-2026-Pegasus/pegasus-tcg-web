import { translate, useLanguage } from "@/lib/language";
import { Spinner } from "@/components/ui/spinner";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { checkoutMoney } from "../checkout.format";

export interface PromotionChangedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  previousTotal: number;
  newTotal: number;
  droppedCode?: string | null;
  droppedOwner?: "PLATFORM" | number | null;
  droppedReason?: string | null;
  sellerDiscountTotal?: number;
  platformDiscountTotal?: number;
  loading?: boolean;
  onChooseAnotherCode: (owner?: "PLATFORM" | number | null) => void;
  onConfirmNewTotal: () => void;
}

export function PromotionChangedDialog({
  open,
  onOpenChange,
  previousTotal,
  newTotal,
  droppedCode,
  droppedOwner,
  droppedReason,
  sellerDiscountTotal = 0,
  platformDiscountTotal = 0,
  loading = false,
  onChooseAnotherCode,
  onConfirmNewTotal,
}: PromotionChangedDialogProps) {
  useLanguage();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[440px] rounded-2xl p-6">
        <DialogHeader className="gap-2">
          <div className="flex size-11 items-center justify-center rounded-full bg-amber-50 text-amber-600">
            <AlertTriangle className="size-6" />
          </div>
          <DialogTitle className="text-lg font-semibold">
            {translate("ยอดชำระเปลี่ยนไป", "The amount due has changed")}</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            {translate("โค้ดหรือยอดส่วนลดเปลี่ยนระหว่างสั่งซื้อ กรุณาตรวจสอบยอดใหม่ก่อนยืนยัน", "Coupons or discounts changed while placing your order. Review the new total before confirming")}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-2 rounded-xl bg-muted/40 p-4 text-sm">
          <p>{translate("ยอดเดิม:", "Previous total:")} {checkoutMoney(previousTotal)}</p>
          {droppedCode && (
            <p className="text-amber-700">{translate("โค้ดที่เปลี่ยน:", "Changed coupon:")} {droppedCode}</p>
          )}
          {droppedReason && (
            <p className="text-xs text-amber-700 leading-normal">
              {droppedReason}
            </p>
          )}
          {sellerDiscountTotal > 0 && (
            <p className="flex justify-between text-xs text-teal-700 dark:text-teal-400">
              <span>{translate("ส่วนลดร้านที่ยังใช้ได้", "Eligible shop discounts")}</span>
              <span>− {checkoutMoney(sellerDiscountTotal)}</span>
            </p>
          )}
          {platformDiscountTotal > 0 && (
            <p className="flex justify-between text-xs text-primary">
              <span>{translate("ส่วนลด Pegasus ที่ยังใช้ได้", "Eligible Pegasus discount")}</span>
              <span>− {checkoutMoney(platformDiscountTotal)}</span>
            </p>
          )}
          <p className="font-semibold text-foreground">
            {translate("ยอดใหม่:", "New total:")}{loading ? translate("กำลังคำนวณ...", "Calculating…") : checkoutMoney(newTotal)}
          </p>
        </div>

        <DialogFooter className="mt-4 flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              onChooseAnotherCode(droppedOwner);
            }}
          >
            {translate("เลือกโค้ดอื่น", "Select another coupon")}</Button>
          <Button
            type="button"
            disabled={loading}
            onClick={() => {
              onOpenChange(false);
              onConfirmNewTotal();
            }}
          >
            {loading && <Spinner className="mr-1.5" />}
            {translate("สั่งซื้อด้วยยอดใหม่", "Place order with new total")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
