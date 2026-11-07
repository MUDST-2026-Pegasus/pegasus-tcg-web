import { translate, useLanguage } from "@/lib/language";
import { useState } from "react";

import { AlertCircle, CircleCheck, CircleX, Loader2, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PromotionOwnerTag } from "@/features/promotions/PromotionOwnerTag";
import { formatBaht } from "@/features/finance/after-sales.format";
import type { OrderDetails } from "../orders.types";

const cancelReasons = [
  { get value() { return translate("เปลี่ยนใจ / สั่งผิด", "Changed my mind / ordered by mistake"); }, get label() { return translate("เปลี่ยนใจ / สั่งผิด", "Changed my mind / ordered by mistake"); } },
  { get value() { return translate("สั่งซื้อซ้ำ", "Duplicate order"); }, get label() { return translate("สั่งซื้อซ้ำ", "Duplicate order"); } },
  { get value() { return translate("พบสินค้าจากร้านอื่น", "Found an item from another shop"); }, get label() { return translate("พบสินค้าจากร้านอื่น", "Found an item from another shop"); } },
  { get value() { return translate("อื่น ๆ", "Other"); }, get label() { return translate("อื่น ๆ", "Other"); } },
];

export type CancelOrderConfirmationDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: OrderDetails | null;
  onConfirm: (reason?: string) => void | Promise<void>;
  isCancelling: boolean;
};

/** Confirmation dialog with the cancellation and refund details for this order. */
export function CancelOrderConfirmationDialog({
  open,
  onOpenChange,
  order,
  onConfirm,
  isCancelling,
}: CancelOrderConfirmationDialogProps) {
  useLanguage();
  const [reason, setReason] = useState(cancelReasons[0].value);
  const promotions = order?.promotions ?? [];
  const hasPromotions = Boolean(order && (
    promotions.length > 0
    || (order.discountTotal ?? 0) > 0
    || (order.sellerDiscountTotal ?? 0) > 0
    || (order.platformDiscountTotal ?? 0) > 0
    || order.sellerOrders.some((seller) => (seller.sellerDiscount ?? 0) > 0 || (seller.platformDiscount ?? 0) > 0)
  ));
  const codePromotions = promotions.length > 0
    ? promotions
    : order?.sellerOrders.flatMap((seller) => seller.promotions ?? []) ?? [];
  const uniqueCodes = [...new Map(codePromotions.map((promotion) => [promotion.code, promotion])).values()];
  const isPaid = Boolean(order?.paidAt);
  const willRestorePromotions = hasPromotions && !isPaid;
  const orderLabel = order?.sellerOrders.length === 1
    ? order.sellerOrders[0].sellerOrderNumber
    : order?.orderNumber;
  const sellerNames = [...new Set(order?.sellerOrders.map((seller) => seller.sellerName?.trim()).filter(Boolean) ?? [])];
  const sellerLabel = sellerNames.length === 1 ? sellerNames[0] : sellerNames.length > 1 ? translate("ร้านค้าทั้งหมด", "All shops") : translate("ร้านค้า", "Shop");
  const title = isPaid ? translate(`ยกเลิกคำสั่งซื้อจาก ${sellerLabel}?`, `Cancel the order from ${sellerLabel}?`) : translate("ยกเลิกคำสั่งซื้อนี้?", "Cancel this order?");
  const statusHint = isPaid ? translate("ชำระเงินแล้ว", "Paid") : order?.status === "PENDING_PAYMENT" ? translate("ยังไม่ได้ชำระเงิน", "Unpaid") : translate("ร้านยังไม่จัดส่ง", "Not shipped yet");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="gap-0 overflow-hidden rounded-xl bg-card p-0 shadow-[0px_16px_40px_0px_rgba(0,0,0,0.18)] ring-0 sm:max-w-[440px]"
      >
        <div className="flex flex-col gap-3 px-6 pb-5 pt-6">
          <div className={`flex size-10 items-center justify-center rounded-[10px] ${isPaid ? "bg-rose-100" : "bg-orange-100"}`}>
            {isPaid
              ? <CircleX aria-hidden="true" className="size-5 text-rose-700" />
              : <AlertCircle aria-hidden="true" className="size-5 text-orange-700" />}
          </div>

          <div className="flex flex-col gap-1">
            <DialogTitle className="text-base font-bold text-foreground sm:text-lg">{title}</DialogTitle>
            <DialogDescription className="text-xs leading-relaxed text-gray-500 sm:text-sm">
              {orderLabel ? `${orderLabel} · ` : ""}{statusHint}
            </DialogDescription>
          </div>

          {isPaid && order && (
            <div className="flex flex-col gap-2 rounded-[10px] bg-muted/60 px-3.5 py-3 text-xs">
              {order.sellerOrders.map((seller) => (
                <div key={seller.id} className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">
                    {order.sellerOrders.length === 1 ? translate("ยอดที่จ่ายให้ร้านนี้", "Amount paid to this shop") : translate(`ยอดที่จ่าย · ${seller.sellerName || seller.sellerOrderNumber}`, `Amount paid · ${seller.sellerName || seller.sellerOrderNumber}`)}
                  </span>
                  <span className="shrink-0 font-semibold tabular-nums">{formatBaht(seller.grandTotal)}</span>
                </div>
              ))}
              {hasPromotions && (
                <div className="flex items-start justify-between gap-3">
                  <span className="text-muted-foreground">{translate("ส่วนลดที่ใช้", "Applied discount")}</span>
                  <span className="flex max-w-[70%] flex-wrap justify-end gap-1.5 text-right">
                    {uniqueCodes.length ? uniqueCodes.map((promotion) => (
                      <span key={`${promotion.ownerType}-${promotion.code}`} className="inline-flex items-center gap-1">
                        <span className="font-semibold">{promotion.code}</span>
                        <PromotionOwnerTag owner={promotion.ownerType} tone="order" />
                      </span>
                    )) : <span className="font-semibold">—</span>}
                  </span>
                </div>
              )}
              <div className="h-px bg-border" />
              <div className="flex items-center justify-between gap-3 text-[13px] font-semibold">
                <span>{translate("เงินคืน", "Refund")}</span>
                <span className="shrink-0 text-lg font-black tabular-nums text-emerald-700">{formatBaht(order.grandTotal)}</span>
              </div>
            </div>
          )}

          {hasPromotions && (
            willRestorePromotions ? (
              <div className="flex items-start gap-2 rounded-lg bg-emerald-50 px-3 py-2.5 text-xs text-emerald-800">
                <CircleCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                <p>
                  {uniqueCodes.length
                    ? translate(`โค้ด ${uniqueCodes.map((promotion) => promotion.code).join(translate(" และ ", " and "))} จะกลับเข้า “โค้ดของฉัน” ให้ใช้ใหม่ได้ (ถ้ายังไม่หมดอายุ)`, `Coupons ${uniqueCodes.map((promotion) => promotion.code).join(translate(" และ ", " and "))} will return to “My coupons” for reuse if they have not expired`)
                    : translate("โค้ดที่ใช้จะกลับเข้า “โค้ดของฉัน” ให้ใช้ใหม่ได้ (ถ้ายังไม่หมดอายุ)", "Your coupon will return to “My coupons” for reuse if it has not expired")}
                </p>
              </div>
            ) : (
              <div className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
                <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                <p>{translate("โค้ดที่ใช้กับคำสั่งซื้อนี้จะไม่ได้คืนสิทธิ์ เพราะชำระเงินแล้ว", "Coupons used for this paid order will not be restored")}</p>
              </div>
            )
          )}

          {isPaid && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-foreground" htmlFor="buyer-cancel-reason">{translate("เหตุผล *", "Reason *")}</label>
              <Select items={cancelReasons} value={reason} onValueChange={(value) => setReason(value ?? cancelReasons[0].value)}>
                <SelectTrigger id="buyer-cancel-reason" aria-label={translate("เหตุผลการยกเลิก", "Cancellation reason")} className="w-full rounded-lg border-border bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {cancelReasons.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter className="flex-row flex-wrap items-center justify-between gap-2 border-t border-muted bg-muted/30 px-6 py-3.5">
          {isPaid && <p className="mr-auto text-[11px] text-muted-foreground">{translate("คืนเงินภายใน 3–5 วันทำการ", "Refund within 3–5 business days")}</p>}
          <Button type="button" variant="outline" size="sm" className="rounded-lg px-4" disabled={isCancelling} onClick={() => onOpenChange(false)}>
            {translate("ไม่ยกเลิก", "Keep order")}</Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="rounded-lg bg-red-600 px-4 text-white hover:bg-red-700"
            disabled={isCancelling}
            onClick={() => onConfirm(isPaid ? reason : undefined)}
          >
            {isCancelling ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="size-4 animate-spin" />
                {translate("กำลังยกเลิก...", "Cancelling…")}</span>
            ) : translate("ยกเลิกคำสั่งซื้อ", "Cancel order")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
