import type { ReactNode } from "react";

import { AuctionSourcePill } from "@/features/auction/components/AuctionSourcePill";
import { QueryBoundary } from "@/components/common";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { PromotionOrderTable } from "@/features/promotions/PromotionOrderTable";
import { SaleOrderBreakdown } from "@/features/sale/components/SaleOrderBreakdown";
import { downloadBlob } from "@/lib/download";

import { formatBaht } from "../catalog.format";
import {
  NO_VALUE,
  ORDER_STATUS_LABEL,
  PAYMENT_METHOD_LABEL,
  PAYMENT_STATUS_LABEL,
  RETURN_REASON_LABEL,
  adminOrderSummaryDownloadErrorMessage,
  formatAddressLine,
  parseShippingAddress,
} from "../orders.format";
import { useAdminOrder, useDownloadAdminOrderSummary } from "../orders.queries";
import type { AdminOrderDetail } from "../orders.types";
import { formatThaiDateTime } from "../verification.format";
import { useTranslate } from "@/lib/i18n";

type OrderDetailSheetProps = {
  /** `null` = ปิด */
  sellerOrderId: number | null;
  onClose: () => void;
};

/** รายละเอียดคำสั่งซื้อหนึ่งใบ (ส่วนของผู้ขายหนึ่งคน) — อ่านอย่างเดียว */
export function OrderDetailSheet({ sellerOrderId, onClose }: OrderDetailSheetProps) {
  const { t } = useTranslate("admin");
  const detail = useAdminOrder(sellerOrderId);

  return (
    <Sheet
      open={sellerOrderId !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent className="gap-0 data-[side=right]:w-full data-[side=right]:sm:max-w-xl">
        {sellerOrderId === null ? null : (
          <QueryBoundary
            query={detail}
            loading={<OrderDetailSkeleton />}
            errorTitle={t("orders.detail.loadFailed", "โหลดคำสั่งซื้อไม่สำเร็จ")}
            errorMessage={t("orders.detail.loadFailedHint", "คำสั่งซื้อนี้อาจไม่มีอยู่แล้ว หรือเชื่อมต่อไม่ได้")}
          >
            {(order) => <OrderDetailBody detail={order} />}
          </QueryBoundary>
        )}
      </SheetContent>
    </Sheet>
  );
}

function OrderDetailBody({ detail }: { detail: AdminOrderDetail }) {
  const { t } = useTranslate("admin");
  const { summary, order, payment } = detail;
  const downloadSummary = useDownloadAdminOrderSummary();
  const address = parseShippingAddress(detail.shippingAddressSnapshot);
  const shipment = order.shipments.at(-1);
  const hasPromotionDiscount = (order.sellerDiscount ?? 0) > 0 || (order.platformDiscount ?? 0) > 0;

  function handleDownloadSummary() {
    downloadSummary.mutate(summary.sellerOrderId, {
      onSuccess: ({ blob, filename }) => {
        const downloadFilename = filename ?? `order-summary-${summary.orderNumber}.pdf`;
        downloadBlob(blob, downloadFilename);
        toast.add({
          type: "success",
          title: t("orders.detail.downloaded", "ดาวน์โหลด Order Summary แล้ว"),
          description: downloadFilename,
        });
      },
      onError: (error) =>
        toast.add({
          type: "error",
          title: t("orders.detail.downloadFailed", "ดาวน์โหลด Order Summary ไม่สำเร็จ"),
          description: adminOrderSummaryDownloadErrorMessage(error),
        }),
    });
  }

  return (
    <>
      <SheetHeader className="px-4">
        <div className="flex flex-wrap items-center gap-2 pr-8">
          <SheetTitle className="text-lg font-semibold">
            {summary.sellerOrderNumber}
          </SheetTitle>
          <Badge variant="secondary">{ORDER_STATUS_LABEL[summary.status]}</Badge>
          <AuctionSourcePill order={summary} basePath="/admin/auctions" />
        </div>
        <SheetDescription className="pr-8">
          {t("orders.detail.meta", "คำสั่งซื้อ {order} · สั่งเมื่อ {date}", { order: summary.orderNumber, date: formatThaiDateTime(summary.createdAt) })}
        </SheetDescription>
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            className="rounded-md px-2.5"
            disabled={downloadSummary.isPending}
            aria-busy={downloadSummary.isPending}
            aria-label={downloadSummary.isPending ? t("orders.detail.generating", "กำลังสร้าง PDF...") : t("orders.detail.download", "ดาวน์โหลดสรุปคำสั่งซื้อ (PDF)")}
            onClick={handleDownloadSummary}
          >
            {downloadSummary.isPending ? <Spinner /> : null}
            {downloadSummary.isPending ? t("orders.detail.generating", "กำลังสร้าง PDF...") : t("orders.detail.download", "ดาวน์โหลดสรุปคำสั่งซื้อ (PDF)")}
          </Button>
        </div>
      </SheetHeader>

      <div className="flex flex-col gap-5 overflow-y-auto px-4 pb-6 text-sm">
        <Section title={t("orders.detail.parties", "ผู้ขายและผู้ซื้อ")}>
          <Row label={t("orders.detail.seller", "ผู้ขาย")}>
            {summary.seller.displayName} (@{summary.seller.username})
          </Row>
          <Row label={t("orders.detail.buyer", "ผู้ซื้อ")}>
            {summary.buyer.displayName} (@{summary.buyer.username})
          </Row>
          {summary.returnReasonCode ? (
            <Row label={t("orders.detail.returnReason", "เหตุผลขอคืน")}>
              {RETURN_REASON_LABEL[summary.returnReasonCode]}
            </Row>
          ) : null}
          {summary.reviewRating !== null ? (
            <Row label={t("orders.detail.review", "รีวิว")}>{t("orders.detail.stars", "{rating} ดาว", { rating: summary.reviewRating })}</Row>
          ) : null}
        </Section>

        <Section title={t("orders.detail.items", "รายการสินค้า")}>
          <ul className="flex flex-col gap-2">
            {order.items.map((item) => (
              <li key={item.id} className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 flex-col">
                  <span className="truncate font-medium">{item.productName}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {[item.gameName, item.variantLabel, item.condition]
                      .filter(Boolean)
                      .join(" · ") || NO_VALUE}
                  </span>
                </div>
                <span className="shrink-0 text-right">
                  {item.quantity} × {formatBaht(item.unitPrice)}
                </span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title={t("orders.detail.amounts", "ยอดเงินคำสั่งซื้อ")}>
          {hasPromotionDiscount ? (
            <PromotionOrderTable
              rows={[{
                id: order.id,
                sellerName: order.sellerName || summary.seller.displayName,
                itemsSubtotal: order.itemsSubtotal,
                sellerDiscount: order.sellerDiscount ?? 0,
                platformDiscount: order.platformDiscount ?? 0,
                shippingFee: order.shippingFee,
                grandTotal: order.grandTotal,
                commissionAmount: order.commissionAmount,
                sellerNetAmount: order.sellerNetAmount,
                promotions: order.promotions,
              }]}
              formatAmount={formatBaht}
            />
          ) : (
            <>
              <Row label={t("orders.detail.subtotal", "ค่าสินค้า")}>{formatBaht(order.itemsSubtotal)}</Row>
              <Row label={t("orders.detail.shipping", "ค่าส่ง")}>{formatBaht(order.shippingFee)}</Row>
              {order.discountAmount > 0 ? <Row label={t("orders.detail.discount", "ส่วนลด")}>− {formatBaht(order.discountAmount)}</Row> : null}
              <Row label={t("orders.detail.grandTotal", "ยอดรวม")} strong>{formatBaht(order.grandTotal)}</Row>
              <Separator />
              <Row label={t("orders.detail.commission", "ค่าคอมมิชชั่น")}>− {formatBaht(order.commissionAmount)}</Row>
              <Row label={t("orders.detail.sellerNet", "ผู้ขายได้รับ")} strong>{formatBaht(order.sellerNetAmount)}</Row>
            </>
          )}
          {/* ราคาลดสินค้า — ใครออกเงิน (TCG-683 · Figma SAL-B3 F) */}
          <SaleOrderBreakdown items={order.items} viewer="admin" />
        </Section>

        <Section title={t("orders.detail.payment", "การชำระเงิน")}>
          {payment ? (
            <>
              <Row label={t("orders.detail.method", "ช่องทาง")}>{PAYMENT_METHOD_LABEL[payment.method]}</Row>
              <Row label={t("orders.detail.status", "สถานะ")}>{PAYMENT_STATUS_LABEL[payment.status]}</Row>
              <Row label={t("orders.detail.paidAt", "จ่ายเมื่อ")}>
                {payment.paidAt ? formatThaiDateTime(payment.paidAt) : NO_VALUE}
              </Row>
              {payment.failureReason ? (
                <Row label={t("finance.reason", "เหตุผล")}>{payment.failureReason}</Row>
              ) : null}
            </>
          ) : (
            <p className="text-muted-foreground">{t("orders.detail.noPayment", "ยังไม่มีการชำระเงิน")}</p>
          )}
        </Section>

        <Section title={t("orders.detail.delivery", "การจัดส่ง")}>
          {address ? (
            <>
              <Row label={t("orders.detail.recipient", "ผู้รับ")}>
                {address.recipientName ?? NO_VALUE}
                {address.phone ? ` · ${address.phone}` : ""}
              </Row>
              <Row label={t("orders.detail.address", "ที่อยู่")}>{formatAddressLine(address)}</Row>
            </>
          ) : (
            <Row label={t("orders.detail.address", "ที่อยู่")}>{NO_VALUE}</Row>
          )}
          <Row label={t("orders.detail.carrier", "ขนส่ง")}>
            {shipment
              ? `${shipment.carrierName} · ${shipment.trackingNumber}`
              : NO_VALUE}
          </Row>
          {detail.buyerNote ? (
            <Row label={t("orders.detail.buyerNote", "หมายเหตุผู้ซื้อ")}>{detail.buyerNote}</Row>
          ) : null}
        </Section>

        <Section title={t("orders.detail.history", "ประวัติสถานะ")}>
          {order.statusHistory.length === 0 ? (
            <p className="text-muted-foreground">{t("orders.detail.noHistory", "ยังไม่มีประวัติการเปลี่ยนสถานะ")}</p>
          ) : null}
          <ol className="flex flex-col gap-2">
            {order.statusHistory.map((change) => (
              <li key={change.id} className="flex items-start justify-between gap-3">
                <div className="flex flex-col">
                  <span>{ORDER_STATUS_LABEL[change.toStatus]}</span>
                  {change.note ? (
                    <span className="text-xs text-muted-foreground">
                      {change.note}
                    </span>
                  ) : null}
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatThaiDateTime(change.createdAt)}
                </span>
              </li>
            ))}
          </ol>
        </Section>
      </div>
    </>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-xs font-semibold text-muted-foreground">{title}</h3>
      {children}
    </section>
  );
}

function Row({
  label,
  strong,
  children,
}: {
  label: string;
  strong?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className={strong ? "text-right font-semibold" : "text-right"}>
        {children}
      </span>
    </div>
  );
}

function OrderDetailSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-4 p-4">
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-4 w-64" />
      {Array.from({ length: 4 }, (_, index) => (
        <Skeleton key={index} className="h-24 rounded-md" />
      ))}
    </div>
  );
}
