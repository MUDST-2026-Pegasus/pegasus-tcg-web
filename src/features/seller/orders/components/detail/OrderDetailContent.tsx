import { useState } from "react";

import { Link } from "react-router-dom";

import { AuctionSourcePill } from "@/features/auction/components/AuctionSourcePill";
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
import { downloadBlob } from "@/lib/download";

import {
  RETURNS_PATH,
  addressLines,
  buyerChoiceNote,
  canAccept,
  canCancel,
  canShip,
  carrierLabel,
  formatAgo,
  isReturnStatus,
  orderErrorMessage,
  orderSummaryDownloadErrorMessage,
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
import { useAcceptOrder, useDownloadOrderSummary, useShipOrder } from "../../orders.queries";
import type { SellerOrderDetail } from "../../orders.types";
import { useCarrierPicker } from "../../useCarrierPicker";

import { ConfirmShipDialog } from "../ConfirmShipDialog";

import { BuyerCard } from "./BuyerCard";
import { CancelOrderDialog } from "./CancelOrderDialog";
import { SaleOrderBreakdown } from "@/features/sale/components/SaleOrderBreakdown";

import { OrderProfitCard } from "./OrderProfitCard";
import { OrderTimelineCard } from "./OrderTimelineCard";
import { PackingListCard } from "./PackingListCard";
import { PaymentCard } from "./PaymentCard";
import { PromotionOrderMoneyCard } from "./PromotionOrderMoneyCard";
import { ShippingInfoCard } from "./ShippingInfoCard";
import { useTranslate, translate } from "@/lib/i18n";

type OrderDetailContentProps = {
  detail: SellerOrderDetail;
};

/** subtitle ใต้เลขออเดอร์ — บอกว่าตอนนี้ใครต้องทำอะไร */
function nextStepNote(detail: SellerOrderDetail): string {
  const { order, shipBy } = detail.summary;
  const ordered = translate("seller", "orderDetail.next.ordered", "สั่งซื้อ{ago}", { ago: formatAgo(order.createdAt) });
  switch (order.status) {
    case "PENDING_PAYMENT":
      return translate("seller", "orderDetail.next.pendingPayment", "{ordered} · รอผู้ซื้อชำระเงิน ยกเลิกอัตโนมัติถ้าไม่จ่ายตามกำหนด", { ordered });
    case "PAID":
    case "PREPARING":
      return shipBy
        ? translate("seller", "orderDetail.next.toShip", "{ordered} · {shipBy} เพื่อรักษาคะแนนร้าน", { ordered, shipBy: shipByLabel(shipBy) })
        : ordered;
    case "SHIPPED":
    case "DELIVERED":
      return translate("seller", "orderDetail.next.shipped", "{ordered} · ส่งแล้ว รอผู้ซื้อยืนยันรับสินค้า", { ordered });
    case "COMPLETED":
      return translate("seller", "orderDetail.next.completed", "{ordered} · ผู้ซื้อได้รับสินค้าแล้ว เงินเข้าบัญชีร้าน", { ordered });
    case "CANCELLED":
      return translate("seller", "orderDetail.next.cancelled", "{ordered} · คำสั่งซื้อถูกยกเลิก", { ordered });
    case "RETURN_REQUESTED":
      return translate("seller", "orderDetail.next.returnRequested", "{ordered} · ผู้ซื้อขอคืนสินค้า ตอบคำขอได้ที่หน้าคำขอคืนสินค้า", { ordered });
    case "RETURNED":
      return translate("seller", "orderDetail.next.returned", "{ordered} · ร้านได้รับสินค้าคืนแล้ว รอสรุปผลการคืนเงิน", { ordered });
    case "REFUNDED":
      return translate("seller", "orderDetail.next.refunded", "{ordered} · คืนเงินให้ผู้ซื้อแล้ว", { ordered });
  }
}

export function OrderDetailContent({ detail }: OrderDetailContentProps) {
  const { t } = useTranslate("seller");
  const { summary } = detail;
  const { order } = summary;
  const tab = tabOfStatus(order.status);

  const accept = useAcceptOrder();
  const ship = useShipOrder();
  const downloadSummary = useDownloadOrderSummary();
  const { carrier, setCarrier, match: carrierMatch } = useCarrierPicker(summary.shippingChoice);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [packedIds, setPackedIds] = useState<number[]>([]);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [shipConfirmOpen, setShipConfirmOpen] = useState(false);

  const shippable = canShip(order.status);
  const tracking = trackingNumber.trim();
  const profit = profitSummary(detail);
  const hasPromotionDiscount = (order.sellerDiscount ?? 0) > 0 || (order.platformDiscount ?? 0) > 0;
  const busy = accept.isPending || ship.isPending || downloadSummary.isPending;

  function handleTogglePacked(id: number) {
    setPackedIds((current) =>
      current.includes(id) ? current.filter((packedId) => packedId !== id) : [...current, id],
    );
  }

  function handleAccept() {
    accept.mutate(order.id, {
      onSuccess: () => toast.add({ type: "success", title: t("orders.accept.success", "รับออเดอร์แล้ว") }),
      onError: (error) =>
        toast.add({
          type: "error",
          title: t("orders.accept.failed", "รับออเดอร์ไม่สำเร็จ"),
          description: orderErrorMessage(error, t("orders.tryAgain", "ลองใหม่อีกครั้ง")),
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
            title: t("orders.ship.success", "ยืนยันจัดส่งแล้ว"),
            description: `${carrierLabel(carrier)} ${tracking}`,
          }),
        onError: (error) =>
          toast.add({
            type: "error",
            title: t("orders.ship.failed", "ยืนยันจัดส่งไม่สำเร็จ"),
            description: orderErrorMessage(error, t("orders.ship.failedHint", "ตรวจเลขพัสดุแล้วลองใหม่อีกครั้ง")),
          }),
      },
    );
  }

  function handleDownloadSummary() {
    downloadSummary.mutate(order.id, {
      onSuccess: ({ blob, filename }) => {
        downloadBlob(blob, filename ?? `order-summary-${summary.orderNumber}.pdf`);
        toast.add({
          type: "success",
          title: t("orderDetail.pdf.success", "ดาวน์โหลด Order Summary แล้ว"),
          description: filename ?? `order-summary-${summary.orderNumber}.pdf`,
        });
      },
      onError: (error) =>
        toast.add({
          type: "error",
          title: t("orderDetail.pdf.failed", "ดาวน์โหลด Order Summary ไม่สำเร็จ"),
          description: orderSummaryDownloadErrorMessage(error),
        }),
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <Breadcrumb>
        <BreadcrumbList className="gap-1.5 text-xs text-gray-500 sm:gap-1.5">
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link to="/seller/orders" />}>{t("orders.title", "จัดการคำสั่งซื้อ")}</BreadcrumbLink>
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
            <h1 className="text-2xl font-bold text-foreground">{order.sellerOrderNumber}</h1>
            <Badge
              className={cn(
                "h-5 rounded-full px-2 text-xs",
                ORDER_TONE_BADGE[SELLER_ORDER_STATUS_TONE[order.status]],
              )}
            >
              {statusTitle(order.status)}
            </Badge>
            <AuctionSourcePill order={summary} basePath="/seller/auctions" />
          </div>
          <p className="text-xs text-gray-500">
            {t("orderDetail.subtitle", "คำสั่งซื้อของผู้ซื้อ {orderNumber} · {note}", { orderNumber: summary.orderNumber, note: nextStepNote(detail) })}
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
              {order.status === "RETURN_REQUESTED" ? t("orderDetail.returns.respond", "ตอบคำขอคืนสินค้า") : t("orderDetail.returns.view", "ดูคำขอคืนสินค้า")}
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
              {t("orderDetail.cancel.title", "ยกเลิกคำสั่งซื้อ")}
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
              {t("orders.accept.action", "รับออเดอร์")}
            </Button>
          ) : null}
          {shippable ? (
            // ยังไม่ได้เลือกขนส่งหรือกรอกเลขพัสดุในการ์ดข้อมูลการจัดส่ง = ยืนยันไม่ได้
            <Button
              size="sm"
              className="rounded-md px-2.5"
              disabled={tracking === "" || carrier === "" || busy}
              onClick={() => setShipConfirmOpen(true)}
            >
              {ship.isPending ? <Spinner /> : null}
              {t("orders.confirmShip.confirm", "ยืนยันจัดส่ง")}
            </Button>
          ) : null}
          <Button
            variant="outline"
            size="sm"
            className="rounded-md px-2.5"
            disabled={busy}
            aria-busy={downloadSummary.isPending}
            aria-label={downloadSummary.isPending ? t("orderDetail.pdf.generating", "กำลังสร้าง PDF...") : "Download Order Summary (PDF)"}
            onClick={handleDownloadSummary}
          >
            {downloadSummary.isPending ? <Spinner /> : null}
            {downloadSummary.isPending ? t("orderDetail.pdf.generating", "กำลังสร้าง PDF...") : "Download Order Summary (PDF)"}
          </Button>
        </div>
      </div>

      <div className="flex flex-col items-start gap-5 lg:flex-row">
        <div className="flex w-full min-w-0 flex-1 flex-col gap-4">
          <PackingListCard
            title={shippable ? t("orderDetail.items.toPack", "รายการที่ต้องแพ็ค") : t("orderDetail.items.title", "รายการสินค้า")}
            countLabel={t("orderDetail.items.count", "{pieces} ใบ · {lines} รายการ", { pieces: pieceCount(order.items), lines: order.items.length })}
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
            shippingChoice={summary.shippingChoice}
            carrier={carrier}
            carrierMatch={carrierMatch}
            onCarrierChange={setCarrier}
            trackingNumber={trackingNumber}
            onTrackingNumberChange={setTrackingNumber}
          />
          <OrderTimelineCard title={t("orderDetail.timeline", "ไทม์ไลน์")} entries={timelineEntries(order, summary.paidAt)} />
        </div>

        <div className="flex w-full shrink-0 flex-col gap-4 lg:w-80">
          <BuyerCard
            buyer={summary.buyer}
            orderCount={detail.buyerOrderCount}
            note={summary.buyerNote}
          />
          <PaymentCard state={paymentStateOf(order.status, summary.paidAt)} rows={paymentRows(detail.payment)} />
          {hasPromotionDiscount && <PromotionOrderMoneyCard order={order} />}
          {profit ? <OrderProfitCard {...profit} /> : null}
          <SaleOrderBreakdown items={order.items} viewer="seller" />
        </div>
      </div>

      <ConfirmShipDialog
        open={shipConfirmOpen}
        onOpenChange={setShipConfirmOpen}
        orderNumber={order.sellerOrderNumber}
        carrierName={carrierLabel(carrier)}
        trackingNumber={tracking}
        buyerChoiceNote={buyerChoiceNote(summary.shippingChoice, carrierMatch)}
        onConfirm={handleShip}
      />

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

// translate() อยู่นอก component — ประกาศ key ให้ tolgee CLI เห็น [TCG-554]
// @tolgee-key {"key": "orderDetail.next.ordered", "ns": "seller", "defaultValue": "สั่งซื้อ{ago}"}
// @tolgee-key {"key": "orderDetail.next.pendingPayment", "ns": "seller", "defaultValue": "{ordered} · รอผู้ซื้อชำระเงิน ยกเลิกอัตโนมัติถ้าไม่จ่ายตามกำหนด"}
// @tolgee-key {"key": "orderDetail.next.toShip", "ns": "seller", "defaultValue": "{ordered} · {shipBy} เพื่อรักษาคะแนนร้าน"}
// @tolgee-key {"key": "orderDetail.next.shipped", "ns": "seller", "defaultValue": "{ordered} · ส่งแล้ว รอผู้ซื้อยืนยันรับสินค้า"}
// @tolgee-key {"key": "orderDetail.next.completed", "ns": "seller", "defaultValue": "{ordered} · ผู้ซื้อได้รับสินค้าแล้ว เงินเข้าบัญชีร้าน"}
// @tolgee-key {"key": "orderDetail.next.cancelled", "ns": "seller", "defaultValue": "{ordered} · คำสั่งซื้อถูกยกเลิก"}
// @tolgee-key {"key": "orderDetail.next.returnRequested", "ns": "seller", "defaultValue": "{ordered} · ผู้ซื้อขอคืนสินค้า ตอบคำขอได้ที่หน้าคำขอคืนสินค้า"}
// @tolgee-key {"key": "orderDetail.next.returned", "ns": "seller", "defaultValue": "{ordered} · ร้านได้รับสินค้าคืนแล้ว รอสรุปผลการคืนเงิน"}
// @tolgee-key {"key": "orderDetail.next.refunded", "ns": "seller", "defaultValue": "{ordered} · คืนเงินให้ผู้ซื้อแล้ว"}
