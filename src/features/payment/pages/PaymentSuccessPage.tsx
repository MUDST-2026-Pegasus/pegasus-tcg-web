import { getLanguage, translate, useLanguage } from "@/lib/language";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CircleAlert, Clock3, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ordersApi } from "@/features/account/orders.api";
import { financeApi } from "@/features/finance/finance.api";
import { parseAuctionNumber } from "@/features/auction/auction.format";
import { AuctionOrderBadge } from "@/features/auction/components/AuctionOrderBadge";
import { checkoutMoney } from "@/features/cart/checkout.format";
import { PromotionDiscountLines } from "@/features/promotions/PromotionDiscountLines";
import { paymentMethodName, paymentSuccessDate } from "../payment-success.format";
import "./payment-success.css";

const paidOrderStatuses = new Set(["PAID", "PARTIALLY_COMPLETED", "COMPLETED"]);

export function PaymentSuccessPage() {
  useLanguage();
  const [params] = useSearchParams();
  const orderId = Number(params.get("orderId"));
  const paymentId = Number(params.get("paymentId"));
  const auctionNumber = parseAuctionNumber(params.get("auction"));
  const validOrder = Number.isSafeInteger(orderId) && orderId > 0;
  const hasPayment = params.has("paymentId");
  const validPayment = Number.isSafeInteger(paymentId) && paymentId > 0;
  const validRequest = validOrder && (!hasPayment || validPayment);

  const order = useQuery({
    queryKey: ["orders", orderId],
    queryFn: () => ordersApi.getOrder(orderId),
    enabled: validRequest,
    retry: false,
    refetchInterval: (query) => query.state.data?.status === "PENDING_PAYMENT" && !query.state.error ? 5000 : false,
  });
  const payment = useQuery({
    queryKey: ["finance", "payment-status", paymentId],
    queryFn: () => financeApi.getPayment(paymentId),
    enabled: validRequest && validPayment,
    retry: false,
    refetchInterval: (query) => ["PENDING", "AWAITING_VERIFICATION"].includes(query.state.data?.status ?? "") && !query.state.error ? 5000 : false,
  });
  const loading = validRequest && (order.isLoading || (validPayment && payment.isLoading));
  const mismatch = payment.data != null && payment.data.salesOrderId !== orderId;
  const failedRequest = !validRequest || order.isError || payment.isError || mismatch;
  const terminal = ["FAILED", "EXPIRED", "CANCELLED"].includes(payment.data?.status ?? "")
    || ["CANCELLED", "REFUNDED"].includes(order.data?.status ?? "");
  const paid = !loading && !failedRequest && !terminal && !!order.data
    && (paidOrderStatuses.has(order.data.status) || payment.data?.status === "SUCCEEDED");
  const items = order.data?.sellerOrders.flatMap((seller) => seller.items) ?? [];
  const quantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const productNames = [...new Set(items.map((item) => item.productName).filter(Boolean))];
  const itemDescription = productNames.length === 1 ? `${quantity} ${productNames[0]}` : translate(`${quantity} ชิ้น`, `${quantity} items`);
  const amount = payment.data?.amount ?? order.data?.grandTotal;
  const amountText = amount == null ? "—" : `${order.data?.currency ?? "THB"} ${amount.toLocaleString(getLanguage() === "th" ? "th-TH-u-ca-gregory" : "en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const hasOrderPromotions = (order.data?.discountTotal ?? 0) > 0
    || (order.data?.promotions?.length ?? 0) > 0
    || order.data?.sellerOrders.some((seller) => (seller.sellerDiscount ?? 0) > 0 || (seller.platformDiscount ?? 0) > 0) === true;
  const heading = loading ? "Checking Payment" : failedRequest ? "Unable to Verify Payment"
    : paid ? "Payment Successful" : terminal ? "Payment Not Completed" : "Payment Under Review";
  const statusMessage = !validRequest ? translate("ไม่พบข้อมูลคำสั่งซื้อ กรุณาเปิดจากประวัติคำสั่งซื้อ", "Order details not found. Open this page from order history")
    : mismatch ? translate("รายการชำระเงินนี้ไม่ตรงกับคำสั่งซื้อ กรุณาตรวจสอบอีกครั้ง", "This payment does not match the order. Check the details again")
    : failedRequest ? translate("โหลดสถานะการชำระเงินไม่สำเร็จ กรุณาลองอีกครั้ง", "Could not load payment status. Please try again")
    : loading ? translate("กำลังตรวจสอบสถานะการชำระเงิน...", "Checking payment status…")
    : terminal ? translate("รายการนี้ยังไม่เสร็จสมบูรณ์ ตรวจสอบรายละเอียดได้จากประวัติคำสั่งซื้อ", "This transaction is not complete. Check order history for details")
    : translate("ได้รับข้อมูลแล้ว กำลังรอการยืนยันการชำระเงิน", "Details received. Awaiting payment confirmation");

  const retry = () => {
    void order.refetch();
    if (validPayment) void payment.refetch();
  };

  return (
    <div className="payment-success-page">
      <Card className="payment-success-card" aria-labelledby="payment-success-title" aria-busy={loading}>
        <p className="payment-success-brand" aria-hidden="true">PEGASUS</p>
        <div className="payment-success-symbol" aria-hidden="true">
          {paid ? <img src="/images/payment/success-check.svg" alt="" />
            : loading ? <Loader2 className="size-8 animate-spin text-primary" />
            : failedRequest || terminal ? <CircleAlert className="size-8 text-primary" />
            : <Clock3 className="size-8 text-primary" />}
        </div>
        <h1 id="payment-success-title" className="payment-success-title">{heading}</h1>
        <p className="payment-success-order">
          {order.data && !mismatch ? translate(`เลขคำสั่งซื้อ: #${order.data.orderNumber.replace(/^#/, "")}`, `Order Number: #${order.data.orderNumber.replace(/^#/, "")}`) : validOrder ? translate(`คำสั่งซื้อ #${orderId}`, `Order #${orderId}`) : translate("ไม่พบคำสั่งซื้อ", "Order not found")}
        </p>
        {auctionNumber && validRequest && !mismatch && <AuctionOrderBadge auctionNumber={auctionNumber} className="mx-auto" />}
        {paid ? (
          <>
            <section className="payment-success-summary" aria-labelledby="transaction-summary-title">
              <h2 id="transaction-summary-title">{translate("สรุปธุรกรรม", "Transaction Summary")}</h2>
              <dl>
                <div className="payment-success-row"><dt>{translate("วันที่", "Date")}</dt><dd>{paymentSuccessDate(order.data?.paidAt)}</dd></div>
                <div className="payment-success-row"><dt>{translate("วิธีชำระเงิน", "Payment Method")}</dt><dd>{paymentMethodName(payment.data?.method)}</dd></div>
                <div className="payment-success-row"><dt>{translate("สินค้า", "Items")}</dt><dd>{items.length ? itemDescription : "—"}</dd></div>
                {hasOrderPromotions && order.data && (
                  <PromotionDiscountLines
                    sellerDiscount={order.data.sellerDiscountTotal}
                    platformDiscount={order.data.platformDiscountTotal}
                    promotions={order.data.promotions}
                    formatAmount={checkoutMoney}
                    asDefinitionList
                    rowClassName="payment-success-row"
                  />
                )}
                {hasOrderPromotions && order.data?.sellerOrders.map((seller) => (
                  <div key={seller.id} className="payment-success-row">
                    <dt>{translate("ลูกค้าจ่ายร้านนี้ ·", "Amount paid to this shop ·")} {seller.sellerName || seller.sellerOrderNumber}</dt>
                    <dd>{checkoutMoney(seller.grandTotal)}</dd>
                  </div>
                ))}
                {hasOrderPromotions && order.data && order.data.discountTotal > 0
                  && order.data.sellerDiscountTotal == null && order.data.platformDiscountTotal == null && (
                    <div className="payment-success-row"><dt>{translate("ส่วนลด", "Discount")}</dt><dd>−{checkoutMoney(order.data.discountTotal)}</dd></div>
                  )}
                <div className="payment-success-row payment-success-total"><dt>{translate("ยอดเงินรวม", "Total Amount")}</dt><dd>{amountText}</dd></div>
              </dl>
            </section>
            <p className="payment-success-thanks">{translate("ขอบคุณที่ใช้ Pegasus TCG", "Thank you for using Pegasus TCG")}</p>
          </>
        ) : (
          <div className="payment-success-status" role={failedRequest || terminal ? "alert" : "status"}>
            <p>{statusMessage}</p>
            {validRequest && !mismatch && (order.isError || payment.isError) && (
              <Button className="mt-4 rounded-full" variant="outline" onClick={retry}>{translate("ลองอีกครั้ง", "Try again")}</Button>
            )}
          </div>
        )}
        <div className="payment-success-actions">
          <Button nativeButton={false} className="h-9 rounded-full text-sm" render={<Link to={validRequest && !mismatch ? `/account/orders?orderId=${orderId}` : "/account/orders"} />}>
            {validRequest && !mismatch ? translate("ดูรายละเอียดคำสั่งซื้อ", "View Order Details") : translate("ดูคำสั่งซื้อ", "View Orders")}
          </Button>
          <Button nativeButton={false} variant="outline" className="h-9 rounded-full text-sm text-[#636366] opacity-50 hover:opacity-100" render={<Link to="/products" />}>
            {translate("เลือกซื้อสินค้าต่อ", "Continue Shopping")}</Button>
        </div>
      </Card>
    </div>
  );
}
