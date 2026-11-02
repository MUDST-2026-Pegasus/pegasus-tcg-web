import { Fragment } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { PromotionDiscountLines } from "@/features/promotions/components/PromotionDiscountLines";
import type { OrderItemDetails, SellerOrderDetails } from "@/features/account/orders.types";

import { returnReasonLabel } from "../after-sales.format";

type BuyerReturnConfirmationDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: SellerOrderDetails;
  quantities: Record<number, number>;
  reason: string;
  reasons: readonly string[];
  onReasonChange: (reason: string) => void;
  isSubmitting: boolean;
  onConfirm: () => void;
};

const money = (amount: number) => `฿${amount.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function returnDeadline(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  return new Intl.DateTimeFormat("th-TH-u-ca-gregory", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Bangkok",
  }).format(date);
}

function selectedItems(items: OrderItemDetails[], quantities: Record<number, number>) {
  return items
    .filter((item) => (quantities[item.id] ?? 0) > 0)
    .map((item) => ({ item, quantity: quantities[item.id] }));
}

export function BuyerReturnConfirmationDialog({
  open,
  onOpenChange,
  order,
  quantities,
  reason,
  reasons,
  onReasonChange,
  isSubmitting,
  onConfirm,
}: BuyerReturnConfirmationDialogProps) {
  const selected = selectedItems(order.items, quantities);
  const hasPromotions = (order.promotions?.length ?? 0) > 0
    || (order.discountAmount ?? 0) > 0
    || selected.some(({ item }) => (item.sellerDiscountAllocated ?? 0) > 0 || (item.platformDiscountAllocated ?? 0) > 0);
  const oneItem = selected.length === 1 ? selected[0].item : null;
  const title = oneItem
    ? `ขอคืน ${oneItem.productName}${oneItem.variantLabel ? ` · ${oneItem.variantLabel}` : ""}?`
    : "ยืนยันคำขอคืนสินค้า";
  const deadline = returnDeadline(order.autoCompleteAt);

  if (!hasPromotions) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ยืนยันคำขอคืนสินค้า</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2 text-sm">
            {selected.map(({ item, quantity }) => (
              <div key={item.id} className="rounded-lg border p-3">
                <strong>{item.productName} × {quantity}</strong>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" disabled={isSubmitting} onClick={() => onOpenChange(false)}>
              กลับไปแก้ไข
            </Button>
            <Button type="button" disabled={isSubmitting || selected.length === 0} onClick={onConfirm}>
              ยืนยัน
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden rounded-xl p-0 sm:max-w-[440px]">
        <div className="flex flex-col gap-3 px-6 pb-5 pt-6">
          <div className="flex size-10 items-center justify-center rounded-[10px] bg-blue-50">
            <img src="/images/promotions/promotion-return.svg" alt="" />
          </div>
          <div className="flex flex-col gap-1">
            <DialogTitle className="text-base font-bold text-foreground sm:text-lg">{title}</DialogTitle>
            <p className="text-xs text-muted-foreground">
              {order.sellerOrderNumber}{deadline ? ` · คืนได้ถึง ${deadline}` : ""}
            </p>
          </div>

          <div className="flex flex-col gap-3 rounded-[10px] bg-muted/60 px-3.5 py-3">
            {selected.map(({ item, quantity }, index) => (
              <Fragment key={item.id}>
                {index > 0 && <Separator />}
                <ReturnItemSummary item={item} quantity={quantity} promotions={order.promotions} />
              </Fragment>
            ))}
          </div>

          {selected.some(({ item }) => (item.discountAllocated ?? 0) > 0) || (order.promotions?.length ?? 0) > 0 ? (
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              ส่วนลดคิดตามสัดส่วนราคาสินค้าในคำสั่งซื้อ · โค้ดไม่ได้คืนสิทธิ์ · ยอดจริงยืนยันหลังร้านรับของคืน
            </p>
          ) : null}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-foreground" htmlFor="buyer-return-reason">เหตุผล *</label>
            <Select items={reasons.map((value) => ({ value, label: returnReasonLabel(value) }))} value={reason} onValueChange={(value) => onReasonChange(value ?? reasons[0])}>
              <SelectTrigger id="buyer-return-reason" aria-label="เหตุผลการคืนสินค้า" className="w-full rounded-lg border-border bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {reasons.map((value) => (
                    <SelectItem key={value} value={value}>{returnReasonLabel(value)}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="flex-row items-center justify-end gap-2 border-t bg-muted/30 px-6 py-3.5">
          <Button type="button" variant="outline" size="sm" disabled={isSubmitting} onClick={() => onOpenChange(false)}>
            ยกเลิก
          </Button>
          <Button type="button" size="sm" disabled={isSubmitting || selected.length === 0} onClick={onConfirm}>
            {isSubmitting ? "กำลังส่งคำขอ..." : "ส่งคำขอคืนสินค้า"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ReturnItemSummary({
  item,
  quantity,
  promotions,
}: {
  item: OrderItemDetails;
  quantity: number;
  promotions: SellerOrderDetails["promotions"];
}) {
  const hasAllocatedDiscount = (item.discountAllocated ?? 0) > 0 || (promotions?.length ?? 0) > 0;
  const moneyFormatter = (amount: number) => money(amount);
  const labels = {
    SELLER: `ส่วนลดร้านที่ปันให้ชิ้นนี้`,
    PLATFORM: `ส่วนลด Pegasus ที่ปันให้ชิ้นนี้`,
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="min-w-0 font-medium text-foreground">{item.productName} × {quantity}</span>
        {hasAllocatedDiscount && <span className="shrink-0 font-semibold tabular-nums">{money(item.unitPrice)}</span>}
      </div>
      {hasAllocatedDiscount && (
        <>
          <PromotionDiscountLines
            sellerDiscount={item.sellerDiscountAllocated}
            platformDiscount={item.platformDiscountAllocated}
            promotions={promotions}
            formatAmount={moneyFormatter}
            labels={labels}
            className="flex flex-col gap-2"
          />
          <Separator />
          <div className="flex items-center justify-between gap-3 text-[13px] font-semibold">
            <span>ยอดคืนโดยประมาณ{quantity > 1 ? "ต่อใบ" : ""}</span>
            <span className="shrink-0 text-lg font-black tabular-nums text-foreground">
              {item.refundEstimatePerUnit == null ? "—" : money(item.refundEstimatePerUnit)}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
