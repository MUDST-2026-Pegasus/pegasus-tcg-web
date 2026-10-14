import type { ReactNode } from "react";

import { QueryBoundary } from "@/components/common";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";

import { formatBaht } from "../catalog.format";
import {
  NO_VALUE,
  ORDER_STATUS_LABEL,
  PAYMENT_METHOD_LABEL,
  PAYMENT_STATUS_LABEL,
  RETURN_REASON_LABEL,
  formatAddressLine,
  parseShippingAddress,
} from "../orders.format";
import { useAdminOrder } from "../orders.queries";
import type { AdminOrderDetail } from "../orders.types";
import { formatThaiDateTime } from "../verification.format";

type OrderDetailSheetProps = {
  /** `null` = ปิด */
  sellerOrderId: number | null;
  onClose: () => void;
};

/** รายละเอียดคำสั่งซื้อหนึ่งใบ (ส่วนของผู้ขายหนึ่งคน) — อ่านอย่างเดียว */
export function OrderDetailSheet({ sellerOrderId, onClose }: OrderDetailSheetProps) {
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
            errorTitle="โหลดคำสั่งซื้อไม่สำเร็จ"
            errorMessage="คำสั่งซื้อนี้อาจไม่มีอยู่แล้ว หรือเชื่อมต่อไม่ได้"
          >
            {(order) => <OrderDetailBody detail={order} />}
          </QueryBoundary>
        )}
      </SheetContent>
    </Sheet>
  );
}

function OrderDetailBody({ detail }: { detail: AdminOrderDetail }) {
  const { summary, order, payment } = detail;
  const address = parseShippingAddress(detail.shippingAddressSnapshot);
  const shipment = order.shipments.at(-1);

  return (
    <>
      <SheetHeader className="pr-14">
        <div className="flex flex-wrap items-center gap-2">
          <SheetTitle className="text-lg font-semibold">
            {summary.sellerOrderNumber}
          </SheetTitle>
          <Badge variant="secondary">{ORDER_STATUS_LABEL[summary.status]}</Badge>
        </div>
        <SheetDescription>
          คำสั่งซื้อ {summary.orderNumber} · สั่งเมื่อ{" "}
          {formatThaiDateTime(summary.createdAt)}
        </SheetDescription>
      </SheetHeader>

      <div className="flex flex-col gap-5 overflow-y-auto px-4 pb-6 text-sm">
        <Section title="ผู้ขายและผู้ซื้อ">
          <Row label="ผู้ขาย">
            {summary.seller.displayName} (@{summary.seller.username})
          </Row>
          <Row label="ผู้ซื้อ">
            {summary.buyer.displayName} (@{summary.buyer.username})
          </Row>
          {summary.returnReasonCode ? (
            <Row label="เหตุผลขอคืน">
              {RETURN_REASON_LABEL[summary.returnReasonCode]}
            </Row>
          ) : null}
          {summary.reviewRating !== null ? (
            <Row label="รีวิว">{summary.reviewRating} ดาว</Row>
          ) : null}
        </Section>

        <Section title="รายการสินค้า">
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

        <Section title="ยอดเงิน">
          <Row label="ค่าสินค้า">{formatBaht(order.itemsSubtotal)}</Row>
          <Row label="ค่าส่ง">{formatBaht(order.shippingFee)}</Row>
          {order.discountAmount > 0 ? (
            <Row label="ส่วนลด">− {formatBaht(order.discountAmount)}</Row>
          ) : null}
          <Row label="ยอดรวม" strong>
            {formatBaht(order.grandTotal)}
          </Row>
          <Separator />
          <Row label="ค่าคอมมิชชั่น">− {formatBaht(order.commissionAmount)}</Row>
          <Row label="ผู้ขายได้รับ" strong>
            {formatBaht(order.sellerNetAmount)}
          </Row>
        </Section>

        <Section title="การชำระเงิน">
          {payment ? (
            <>
              <Row label="ช่องทาง">{PAYMENT_METHOD_LABEL[payment.method]}</Row>
              <Row label="สถานะ">{PAYMENT_STATUS_LABEL[payment.status]}</Row>
              <Row label="จ่ายเมื่อ">
                {payment.paidAt ? formatThaiDateTime(payment.paidAt) : NO_VALUE}
              </Row>
              {payment.failureReason ? (
                <Row label="เหตุผล">{payment.failureReason}</Row>
              ) : null}
            </>
          ) : (
            <p className="text-muted-foreground">ยังไม่มีการชำระเงิน</p>
          )}
        </Section>

        <Section title="การจัดส่ง">
          {address ? (
            <>
              <Row label="ผู้รับ">
                {address.recipientName ?? NO_VALUE}
                {address.phone ? ` · ${address.phone}` : ""}
              </Row>
              <Row label="ที่อยู่">{formatAddressLine(address)}</Row>
            </>
          ) : (
            <Row label="ที่อยู่">{NO_VALUE}</Row>
          )}
          <Row label="ขนส่ง">
            {shipment
              ? `${shipment.carrierName} · ${shipment.trackingNumber}`
              : NO_VALUE}
          </Row>
          {detail.buyerNote ? (
            <Row label="หมายเหตุผู้ซื้อ">{detail.buyerNote}</Row>
          ) : null}
        </Section>

        <Section title="ประวัติสถานะ">
          {order.statusHistory.length === 0 ? (
            <p className="text-muted-foreground">ยังไม่มีประวัติการเปลี่ยนสถานะ</p>
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
