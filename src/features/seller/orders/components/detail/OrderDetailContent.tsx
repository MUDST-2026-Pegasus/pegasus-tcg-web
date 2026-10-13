import { useState } from "react";

import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import {
  ORDER_TONE_BADGE,
  SELLER_ORDER_STATUS_TONE,
} from "@/features/seller/shared/order-status";
import { cn } from "@/lib/utils";

import {
  CARRIER_OPTIONS,
  RETURNS_PATH,
  addressLines,
  canAccept,
  canCancel,
  canShip,
  carrierLabel,
  formatAgo,
  isReturnStatus,
  orderErrorMessage,
  parseShippingAddress,
  paymentRows,
  paymentStateOf,
  pieceCount,
  profitSummary,
  shipByLabel,
  statusTitle,
  tabOfStatus,
  timelineEntries,
} from "../../orders.format";
import { useAcceptOrder, useShipOrder } from "../../orders.queries";
import type { SellerOrderDetail } from "../../orders.types";

import { BuyerCard } from "./BuyerCard";
import { CancelOrderDialog } from "./CancelOrderDialog";
import { OrderProfitCard } from "./OrderProfitCard";
import { OrderTimelineCard } from "./OrderTimelineCard";
import { PackingListCard } from "./PackingListCard";
import { PaymentCard } from "./PaymentCard";
import { ShippingInfoCard } from "./ShippingInfoCard";

type OrderDetailContentProps = {
  detail: SellerOrderDetail;
};

/** subtitle ใต้เลขออเดอร์ — บอกว่าตอนนี้ใครต้องทำอะไร */
function nextStepNote(detail: SellerOrderDetail): string {
  const { order, shipBy } = detail.summary;
  const ordered = `สั่งซื้อ${formatAgo(order.createdAt)}`;
  switch (order.status) {
    case "PENDING_PAYMENT":
      return `${ordered} · รอผู้ซื้อชำระเงิน ยกเลิกอัตโนมัติถ้าไม่จ่ายตามกำหนด`;
    case "PAID":
    case "PREPARING":
      return shipBy ? `${ordered} · ${shipByLabel(shipBy)} เพื่อรักษาคะแนนร้าน` : ordered;
    case "SHIPPED":
    case "DELIVERED":
      return `${ordered} · ส่งแล้ว รอผู้ซื้อยืนยันรับสินค้า`;
    case "COMPLETED":
      return `${ordered} · ผู้ซื้อได้รับสินค้าแล้ว เงินเข้าบัญชีร้าน`;
    case "CANCELLED":
      return `${ordered} · คำสั่งซื้อถูกยกเลิก`;
    case "RETURN_REQUESTED":
      return `${ordered} · ผู้ซื้อขอคืนสินค้า ตอบคำขอได้ที่หน้าคำขอคืนสินค้า`;
    case "RETURNED":
      return `${ordered} · ร้านได้รับสินค้าคืนแล้ว รอสรุปผลการคืนเงิน`;
    case "REFUNDED":
      return `${ordered} · คืนเงินให้ผู้ซื้อแล้ว`;
  }
}

export function OrderDetailContent({ detail }: OrderDetailContentProps) {
  const { summary } = detail;
  const { order } = summary;
  const tab = tabOfStatus(order.status);

  const accept = useAcceptOrder();
  const ship = useShipOrder();
  const [carrier, setCarrier] = useState(CARRIER_OPTIONS[0].value);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [packedIds, setPackedIds] = useState<number[]>([]);
  const [cancelOpen, setCancelOpen] = useState(false);

  const shippable = canShip(order.status);
  const tracking = trackingNumber.trim();
  const profit = profitSummary(detail);
  const busy = accept.isPending || ship.isPending;

  function handleTogglePacked(id: number) {
    setPackedIds((current) =>
      current.includes(id) ? current.filter((packedId) => packedId !== id) : [...current, id],
    );
  }

  function handleAccept() {
    accept.mutate(order.id, {
      onSuccess: () => toast.add({ type: "success", title: "รับออเดอร์แล้ว" }),
      onError: (error) =>
        toast.add({
          type: "error",
          title: "รับออเดอร์ไม่สำเร็จ",
          description: orderErrorMessage(error, "ลองใหม่อีกครั้ง"),
        }),
    });
  }

  function handleShip() {
    ship.mutate(
      {
        id: order.id,
        payload: { carrierCode: carrier, carrierName: carrierLabel(carrier), trackingNumber: tracking },
      },
      {
        onSuccess: () =>
          toast.add({
            type: "success",
            title: "ยืนยันจัดส่งแล้ว",
            description: `${carrierLabel(carrier)} ${tracking}`,
          }),
        onError: (error) =>
          toast.add({
            type: "error",
            title: "ยืนยันจัดส่งไม่สำเร็จ",
            description: orderErrorMessage(error, "ตรวจเลขพัสดุแล้วลองใหม่อีกครั้ง"),
          }),
      },
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <Breadcrumb>
        <BreadcrumbList className="gap-1.5 text-xs text-gray-500 sm:gap-1.5">
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link to="/seller/orders" />}>จัดการคำสั่งซื้อ</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="text-slate-500 [&>svg]:size-4" />
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link to={`/seller/orders?status=${tab.id}`} />}>
              {tab.label}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="text-slate-500 [&>svg]:size-4" />
          <BreadcrumbItem>
            <BreadcrumbPage className="font-medium text-gray-700">
              {order.sellerOrderNumber}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-bold text-zinc-950">{order.sellerOrderNumber}</h1>
            <Badge
              className={cn(
                "h-5 rounded-full px-2 text-xs",
                ORDER_TONE_BADGE[SELLER_ORDER_STATUS_TONE[order.status]],
              )}
            >
              {statusTitle(order.status)}
            </Badge>
          </div>
          <p className="text-xs text-gray-500">
            คำสั่งซื้อของผู้ซื้อ {summary.orderNumber} · {nextStepNote(detail)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isReturnStatus(order.status) ? (
            // อนุมัติ/ปฏิเสธ/รับของคืนทำที่หน้าคำขอคืนสินค้า หน้านี้ดูได้อย่างเดียว
            <Button
              variant={order.status === "RETURN_REQUESTED" ? "default" : "outline"}
              size="sm"
              className="rounded-md px-2.5"
              render={<Link to={RETURNS_PATH} />}
              nativeButton={false}
            >
              {order.status === "RETURN_REQUESTED" ? "ตอบคำขอคืนสินค้า" : "ดูคำขอคืนสินค้า"}
            </Button>
          ) : null}
          {canCancel(order.status) ? (
            <Button
              variant="outline"
              size="sm"
              className="rounded-md px-2.5 text-destructive"
              disabled={busy}
              onClick={() => setCancelOpen(true)}
            >
              ยกเลิกคำสั่งซื้อ
            </Button>
          ) : null}
          {canAccept(order.status) ? (
            <Button
              variant="outline"
              size="sm"
              className="rounded-md px-2.5"
              disabled={busy}
              onClick={handleAccept}
            >
              {accept.isPending ? <Spinner /> : null}
              รับออเดอร์
            </Button>
          ) : null}
          {shippable ? (
            // ยังไม่ได้กรอกเลขพัสดุในการ์ดข้อมูลการจัดส่ง = ยืนยันไม่ได้
            <Button
              size="sm"
              className="rounded-md px-2.5"
              disabled={tracking === "" || busy}
              onClick={handleShip}
            >
              {ship.isPending ? <Spinner /> : null}
              ยืนยันจัดส่ง
            </Button>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col items-start gap-5 lg:flex-row">
        <div className="flex w-full min-w-0 flex-1 flex-col gap-4">
          <PackingListCard
            title={shippable ? "รายการที่ต้องแพ็ค" : "รายการสินค้า"}
            countLabel={`${pieceCount(order.items)} ใบ · ${order.items.length} รายการ`}
            items={order.items}
            packable={shippable}
            packedIds={packedIds}
            onTogglePacked={handleTogglePacked}
          />
          <ShippingInfoCard
            recipientLines={addressLines(parseShippingAddress(summary.shippingAddressSnapshot))}
            editable={shippable}
            shipByLabel={shippable && summary.shipBy ? shipByLabel(summary.shipBy) : null}
            shipment={order.shipments[0] ?? null}
            carrier={carrier}
            onCarrierChange={setCarrier}
            trackingNumber={trackingNumber}
            onTrackingNumberChange={setTrackingNumber}
          />
          <OrderTimelineCard title="ไทม์ไลน์" entries={timelineEntries(order, summary.paidAt)} />
        </div>

        <div className="flex w-full shrink-0 flex-col gap-4 lg:w-80">
          <BuyerCard
            buyer={summary.buyer}
            orderCount={detail.buyerOrderCount}
            note={summary.buyerNote}
          />
          <PaymentCard state={paymentStateOf(order.status)} rows={paymentRows(detail.payment)} />
          {profit ? <OrderProfitCard {...profit} /> : null}
        </div>
      </div>

      <CancelOrderDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        orderId={order.id}
        orderNumber={order.sellerOrderNumber}
        paid={summary.paidAt !== null}
      />
    </div>
  );
}
