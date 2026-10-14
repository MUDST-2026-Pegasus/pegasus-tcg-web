import { useState } from "react";

import {
  ChevronDown,
  ChevronRight,
  ImageIcon,
  MapIcon,
  MessageSquareText,
  ShoppingBag,
  Truck,
} from "lucide-react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { formatBaht } from "@/features/seller/shared/seller.format";
import { cn } from "@/lib/utils";

import {
  PAYMENT_STATE_LABEL,
  addressLines,
  canAccept,
  canShip,
  deadlineLabel,
  formatAgo,
  itemMeta,
  orderErrorMessage,
  parseShippingAddress,
  paymentStateOf,
  shipByLabel,
  type PaymentState,
} from "../orders.format";
import { useAcceptOrder } from "../orders.queries";
import type { SellerOrderSummary } from "../orders.types";

import { ShipmentForm } from "./ShipmentForm";

const PAYMENT_TEXT: Record<PaymentState, string> = {
  paid: "text-[#12805c]",
  pending: "text-[#b45309]",
  refunded: "text-gray-400",
  cancelled: "text-gray-400",
};

type OrderCardProps = {
  summary: SellerOrderSummary;
  defaultOpen?: boolean;
};

/**
 * การ์ดคำสั่งซื้อหนึ่งใบ — กดส่วนหัวเพื่อกาง/พับรายละเอียด กดเลขออเดอร์เพื่อไปหน้ารายละเอียด
 *
 * ปุ่มกาง/พับจริง ๆ คือลูกศรขวาสุด แต่ ::after ของมันขยายคลุมทั้งแถบหัวการ์ด
 * ลิงก์เลขออเดอร์ยกขึ้น z-10 ให้กดได้โดยไม่ไปกางการ์ด และไม่มีปุ่มซ้อนลิงก์
 * ฟอร์มเลขพัสดุอยู่ใน panel ที่ไม่ถูก unmount ตอนพับ ค่าที่กรอกจึงไม่หาย
 */
export function OrderCard({ summary, defaultOpen = false }: OrderCardProps) {
  const { order, buyer } = summary;
  const accept = useAcceptOrder();
  const [now] = useState(() => new Date());
  // Collapsible อ่าน defaultOpen ครั้งเดียว — รับออเดอร์/ส่งของแล้วลำดับในรายการเปลี่ยน
  // การ์ดที่เลื่อนขึ้นมาเป็นใบแรกจึงต้องไม่เปลี่ยนค่าตาม
  const [initiallyOpen] = useState(defaultOpen);

  const urgentLabel = deadlineLabel(order.status, summary.shipBy, now);
  const payment = paymentStateOf(order.status, summary.paidAt);
  const detailPath = `/seller/orders/${order.id}`;
  const shipment = order.shipments[0];
  const address = addressLines(parseShippingAddress(summary.shippingAddressSnapshot));

  function handleAccept() {
    accept.mutate(order.id, {
      onSuccess: () =>
        toast.add({
          type: "success",
          title: "รับออเดอร์แล้ว",
          description: `${order.sellerOrderNumber} · แพ็คแล้วกรอกเลขพัสดุได้เลย`,
        }),
      onError: (error) =>
        toast.add({
          type: "error",
          title: "รับออเดอร์ไม่สำเร็จ",
          description: orderErrorMessage(error, "ลองใหม่อีกครั้ง"),
        }),
    });
  }

  return (
    <Card
      className={cn(
        "w-full gap-0 rounded-xl border p-0 shadow-none ring-0",
        urgentLabel ? "border-[#b45309] inset-ring-1 inset-ring-[#b45309]" : "border-border",
      )}
    >
      <Collapsible defaultOpen={initiallyOpen}>
        <div className="relative flex items-center gap-3.5 px-5 py-4">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                to={detailPath}
                className="relative z-10 rounded-sm text-sm font-semibold text-zinc-950 outline-none hover:text-teal-600 hover:underline focus-visible:ring-3 focus-visible:ring-ring/30"
              >
                {order.sellerOrderNumber}
              </Link>
              {urgentLabel ? (
                <Badge className="h-5 rounded-full bg-[#fdf0dd] px-2 text-xs text-[#b45309]">
                  {urgentLabel}
                </Badge>
              ) : null}
              {order.status === "PREPARING" ? (
                <Badge className="h-5 rounded-full bg-[#e6f4f2] px-2 text-xs text-teal-600">
                  กำลังแพ็ค
                </Badge>
              ) : null}
            </div>
            <div className="flex min-w-0 items-center gap-1.5 text-xs">
              <span className="truncate text-gray-500">{buyer.username}</span>
              <span className="shrink-0 text-gray-400">· สั่ง{formatAgo(order.createdAt, now)}</span>
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-[3px]">
            <span className="text-base font-bold text-zinc-950">{formatBaht(order.grandTotal)}</span>
            <span className={cn("text-[10px]", PAYMENT_TEXT[payment])}>
              {PAYMENT_STATE_LABEL[payment]}
            </span>
          </div>

          <CollapsibleTrigger
            aria-label={`แสดงรายการสินค้าของ ${order.sellerOrderNumber}`}
            className="group flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-md outline-none after:absolute after:inset-0 focus-visible:ring-3 focus-visible:ring-ring/30"
          >
            <ChevronDown
              aria-hidden="true"
              className="size-4 text-gray-500 transition-transform group-data-panel-open:rotate-180"
            />
          </CollapsibleTrigger>
        </div>

        <CollapsibleContent
          keepMounted
          className="h-(--collapsible-panel-height) overflow-hidden transition-[height] duration-200 ease-out data-ending-style:h-0 data-starting-style:h-0"
        >
          <div className="flex flex-col gap-3.5 px-5 pb-4">
            <Separator className="bg-gray-100" />

            <ul className="flex flex-col gap-2.5">
              {order.items.map((item) => (
                <li key={item.id} className="flex items-center gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-md bg-gray-100">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt="" className="size-full object-cover" />
                    ) : (
                      <ImageIcon aria-hidden="true" className="size-4 text-slate-500" />
                    )}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <p className="truncate text-xs font-medium text-zinc-950">{item.productName}</p>
                    <p className="text-[10px] text-gray-400">
                      {[itemMeta(item), `×${item.quantity}`].filter(Boolean).join(" ")}
                    </p>
                  </div>
                  <p className="shrink-0 text-xs font-medium text-gray-700">
                    {formatBaht(item.lineTotal)}
                  </p>
                </li>
              ))}
              <li className="flex items-center gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-gray-100">
                  <ShoppingBag aria-hidden="true" className="size-4 text-slate-500" />
                </div>
                <p className="flex-1 text-xs font-medium text-zinc-950">ค่าจัดส่ง</p>
                <p className="shrink-0 text-xs font-medium text-gray-700">
                  {order.shippingFee > 0 ? formatBaht(order.shippingFee) : "ส่งฟรี"}
                </p>
              </li>
            </ul>

            <div className="flex flex-col gap-1.5 rounded-lg bg-neutral-50 p-3.5">
              <div className="flex items-center gap-1.5">
                <MapIcon aria-hidden="true" className="size-4 text-slate-500" />
                <p className="text-xs font-semibold text-gray-700">ที่อยู่จัดส่ง</p>
              </div>
              <p className="text-xs leading-4 text-gray-500">{address.join(" · ")}</p>
              {summary.buyerNote ? (
                <p className="flex items-start gap-1.5 text-xs text-gray-500">
                  <MessageSquareText aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
                  {summary.buyerNote}
                </p>
              ) : null}
            </div>

            {canShip(order.status) ? (
              <div className="flex flex-col gap-2">
                {summary.shipBy ? (
                  <p className="text-[10px] text-gray-500">{shipByLabel(summary.shipBy)}</p>
                ) : null}
                <div className="flex flex-wrap items-center gap-2.5">
                  {canAccept(order.status) ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-md px-2.5"
                      disabled={accept.isPending}
                      onClick={handleAccept}
                    >
                      {accept.isPending ? <Spinner /> : null}
                      รับออเดอร์
                    </Button>
                  ) : null}
                  <ShipmentForm orderId={order.id} orderNumber={order.sellerOrderNumber} />
                </div>
              </div>
            ) : null}

            {shipment ? (
              <div className="flex items-center gap-1.5 text-xs">
                <Truck aria-hidden="true" className="size-4 text-slate-500" />
                <span className="font-semibold text-gray-700">เลขพัสดุ</span>
                <span className="text-gray-500">
                  {shipment.carrierName} · {shipment.trackingNumber}
                </span>
              </div>
            ) : null}

            {order.cancelReason ? (
              <p className="text-xs text-gray-500">เหตุผลที่ยกเลิก: {order.cancelReason}</p>
            ) : null}

            <Link
              to={detailPath}
              className="inline-flex items-center gap-0.5 self-end rounded-sm text-xs font-medium text-teal-600 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/30"
            >
              ดูรายละเอียดคำสั่งซื้อ
              <ChevronRight aria-hidden="true" className="size-3.5" />
            </Link>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
