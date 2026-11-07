import { translate, useLanguage } from "@/lib/language";
import { Loader2, RotateCw, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { BuyerAfterSales } from "@/features/finance/BuyerAfterSales";
import { PromotionDiscountLines } from "@/features/promotions/PromotionDiscountLines";
import type { OrderDetails } from "../orders.types";
import {
  confirmableSellerOrders,
  formatOrderDateTime,
  orderStage,
} from "../order-stage";
import {
  formatOrderStatus,
  getOrderStatusBadge,
} from "../account.format";

export interface OrderDetailsModalProps {
  order: OrderDetails;
  open: boolean;
  onClose: () => void;
  onReorder?: (order: OrderDetails) => void;
  onConfirmReceived?: () => void;
  isConfirming?: boolean;
}

export function OrderDetailsModal({
  order,
  open,
  onClose,
  onReorder,
  onConfirmReceived,
  isConfirming = false,
}: OrderDetailsModalProps) {
  useLanguage();
  const formatPrice = (amount: number) => `฿${amount.toLocaleString()}`;

  // Parse address snapshot if JSON
  let addressText = "Standard Shipping Address";
  if (order.shippingAddressSnapshot) {
    try {
      const snap = JSON.parse(order.shippingAddressSnapshot);
      addressText = [
        snap.recipientName && `${snap.recipientName} (${snap.phone || ""})`,
        snap.line1,
        snap.subdistrict,
        snap.district,
        snap.province,
        snap.postalCode,
      ]
        .filter(Boolean)
        .join(", ");
    } catch {
      addressText = order.shippingAddressSnapshot;
    }
  }

  const sellerOrders = order.sellerOrders ?? [];
  const canConfirmReceived = confirmableSellerOrders(order).length > 0;
  const { stage, label: stageLabel, badgeClassName } = orderStage(order);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        showCloseButton={false}
        finalFocus={false}
        className="sm:max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden rounded-2xl gap-0 bg-card shadow-xl"
      >
        {/* Sticky Header with Title, Formatted Status Badge, and Sticky "✕" Close Button */}
        <div className="sticky top-0 z-20 flex items-start justify-between border-b bg-card px-6 py-4 shrink-0">
          <DialogHeader className="gap-0.5">
            <DialogTitle className="text-xl sm:text-2xl font-bold text-foreground">
              {translate("รายละเอียดคำสั่งซื้อ", "Order Details")}</DialogTitle>
            <p className="text-sm text-muted-foreground">
              {translate("คำสั่งซื้อ #", "Order #")}{order.orderNumber}
            </p>
          </DialogHeader>

          <div className="flex items-center gap-3">
            <Badge
              variant="secondary"
              className={cn("text-sm font-semibold shrink-0", badgeClassName)}
            >
              {stageLabel}
            </Badge>
            <DialogClose
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
                  aria-label={translate("ปิด", "Close")}
                />
              }
            >
              <X className="size-4" />
            </DialogClose>
          </div>
        </div>

        {/* Scrollable Modal Content */}
        <div className="overflow-y-auto px-6 py-5 flex flex-col gap-6 flex-1">
          {/* Shipping Address */}
          <div className="bg-muted/40 p-4 rounded-xl border text-sm">
            <p className="font-semibold text-foreground mb-1">{translate("ที่อยู่จัดส่ง", "Shipping Destination")}</p>
            <p className="text-muted-foreground leading-relaxed">{addressText}</p>
          </div>

          {/* Sub-Orders by Seller */}
          <div className="flex flex-col gap-6">
            <h3 className="font-bold text-base text-foreground">{translate("สินค้าแยกตามร้าน", "Items by Seller")}</h3>
            {sellerOrders.map((so) => (
              <div key={so.id} className="border rounded-xl p-4 flex flex-col gap-3">
                <div className="flex justify-between items-center text-sm border-b pb-2">
                  <div className="flex flex-col">
                    <span className="font-semibold text-foreground">
                      {translate("ผู้ขาย:", "Seller:")}{so.sellerName || translate("ผู้ขาย Pegasus", "Pegasus Seller")}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {translate("คำสั่งซื้อ #", "Order #")}{so.sellerOrderNumber}
                    </span>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant={getOrderStatusBadge(so.status).variant}
                      className={cn("text-xs font-medium", getOrderStatusBadge(so.status).className)}
                    >
                      {translate("สถานะพัสดุ:", "Package Status:")}{formatOrderStatus(so.status)}
                    </Badge>
                    {so.autoCompleteAt && ["SHIPPED", "DELIVERED"].includes(so.status) && (
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {translate("ยืนยันรับอัตโนมัติ", "Auto-confirms")}{formatOrderDateTime(so.autoCompleteAt)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Items */}
                <div className="flex flex-col gap-3">
                  {(so.items ?? []).map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <div className="size-14 rounded border bg-secondary overflow-hidden shrink-0 flex items-center justify-center p-1">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.productName}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <span className="text-[10px] text-muted-foreground">{translate("รูปการ์ด", "Art")}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {item.productName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {[item.variantLabel, item.condition]
                            .filter(Boolean)
                            .join(" • ")}{" "}
                          {translate("• จำนวน:", "• Qty:")}{item.quantity}
                        </p>
                      </div>
                      <div className="text-sm font-bold text-foreground">
                        {formatPrice(item.lineTotal)}
                      </div>
                    </div>
                  ))}
                </div>

                {so.cancelReason && (
                  <p className="text-xs text-muted-foreground">{translate("เหตุผลที่ยกเลิก:", "Cancel reason:")} {so.cancelReason}</p>
                )}

                {/* Shipments info if any */}
                {so.shipments && so.shipments.length > 0 && (
                  <div className="bg-muted/50 p-2.5 rounded-lg text-xs flex flex-col gap-1 mt-1">
                    {so.shipments.map((ship) => (
                      <div key={ship.id} className="flex justify-between">
                        <span className="font-medium text-foreground">
                          {translate("ผู้ขนส่ง:", "Carrier:")}{ship.carrierName || ship.carrierCode}
                        </span>
                        <span className="text-muted-foreground">
                          {translate("หมายเลขติดตาม:", "Tracking:")}{ship.trackingNumber || translate("รอดำเนินการ", "Pending")}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {((so.sellerDiscount ?? 0) > 0 || (so.platformDiscount ?? 0) > 0) && (
                  <div className="flex flex-col gap-2 border-t pt-3">
                    <PromotionDiscountLines
                      sellerDiscount={so.sellerDiscount}
                      platformDiscount={so.platformDiscount}
                      promotions={so.promotions}
                      formatAmount={formatPrice}
                      className="flex flex-col gap-2"
                    />
                    <div className="flex items-center justify-between gap-3 text-sm font-semibold">
                      <span>{translate("ลูกค้าจ่ายร้านนี้", "Amount paid to this shop")}</span>
                      <span className="shrink-0 tabular-nums">{formatPrice(so.grandTotal)}</span>
                    </div>
                  </div>
                )}

                <BuyerAfterSales order={so} />
              </div>
            ))}
          </div>

          <Separator />

          {/* Pricing Summary */}
          <div className="flex flex-col gap-2 text-sm">
            {order.saleDiscountTotal ? (
              <>
                <div className="flex justify-between text-muted-foreground">
                  <span>{translate("ราคาสินค้า (ก่อนลด)", "Items before discount")}</span>
                  <span className="font-medium text-foreground">
                    {formatPrice(order.itemsSubtotal + order.saleDiscountTotal)}
                  </span>
                </div>
                <div className="flex justify-between text-[#dc2626]">
                  <span>{translate("ส่วนลดราคาสินค้า", "Item discount")}</span>
                  <span>-{formatPrice(order.saleDiscountTotal)}</span>
                </div>
              </>
            ) : null}
            <div className="flex justify-between text-muted-foreground">
              <span>{translate("ยอดรวมสินค้า", "Items Subtotal")}</span>
              <span className="font-medium text-foreground">
                {formatPrice(order.itemsSubtotal)}
              </span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>{translate("ค่าจัดส่งรวม", "Shipping Total")}</span>
              <span className="font-medium text-foreground">
                {formatPrice(order.shippingTotal)}
              </span>
            </div>
            <PromotionDiscountLines
              sellerDiscount={order.sellerDiscountTotal}
              platformDiscount={order.platformDiscountTotal}
              promotions={order.promotions}
              formatAmount={formatPrice}
              className="flex flex-col gap-2"
            />
            {order.discountTotal > 0 && order.sellerDiscountTotal == null && order.platformDiscountTotal == null && (
              <div className="flex justify-between text-emerald-600">
                <span>{order.saleDiscountTotal ? translate("โค้ดส่วนลด", "Discount code") : translate("ส่วนลด", "Discount")}</span>
                <span>-{formatPrice(order.discountTotal)}</span>
              </div>
            )}
            <Separator className="my-1" />
            <div className="flex justify-between text-base font-bold text-foreground">
              <span>{translate("ยอดรวมสุทธิ", "Grand Total")}</span>
              <span className="text-lg text-primary">
                {formatPrice(order.grandTotal)}
              </span>
            </div>
          </div>

          {stage === "COMPLETED" && (
            <div className="flex justify-end pt-3 border-t">
              <Button
                type="button"
                onClick={() => onReorder?.(order)}
                className="bg-[#006699] hover:bg-[#005580] text-white rounded-full px-4 py-2 font-medium text-sm flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <RotateCw className="size-3.5" />
                {translate("สั่งซื้ออีกครั้ง", "Reorder")}</Button>
            </div>
          )}

          {canConfirmReceived && (
            <div className="flex justify-end pt-2 border-t">
              <Button type="button" onClick={onConfirmReceived} disabled={isConfirming}>
                {isConfirming ? <Loader2 className="size-4 animate-spin mr-1.5" /> : null}
                {isConfirming ? translate("กำลังยืนยัน…", "Confirming...") : translate("ยืนยันรับสินค้า", "Confirm receipt")}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
