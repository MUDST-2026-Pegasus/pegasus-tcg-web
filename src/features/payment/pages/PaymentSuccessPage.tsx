import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CircleAlert, Clock3, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ordersApi } from "@/features/account/orders.api";
import { financeApi } from "@/features/finance/finance.api";
import { paymentMethodName, paymentSuccessDate } from "../payment-success.format";
import "./payment-success.css";

const paidOrderStatuses = new Set(["PAID", "PARTIALLY_COMPLETED", "COMPLETED"]);

export function PaymentSuccessPage() {
  const [params] = useSearchParams();
  const orderId = Number(params.get("orderId"));
  const paymentId = Number(params.get("paymentId"));
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
  const itemDescription = productNames.length === 1 ? `${quantity} ${productNames[0]}` : `${quantity} items`;
  const amount = payment.data?.amount ?? order.data?.grandTotal;
  const amountText = amount == null ? "—" : `${order.data?.currency ?? "THB"} ${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const heading = loading ? "Checking Payment" : failedRequest ? "Unable to Verify Payment"
    : paid ? "Payment Successful" : terminal ? "Payment Not Completed" : "Payment Under Review";
  const statusMessage = !validRequest ? "ไม่พบข้อมูลคำสั่งซื้อ กรุณาเปิดจากประวัติคำสั่งซื้อ"
    : mismatch ? "รายการชำระเงินนี้ไม่ตรงกับคำสั่งซื้อ กรุณาตรวจสอบอีกครั้ง"
    : failedRequest ? "โหลดสถานะการชำระเงินไม่สำเร็จ กรุณาลองอีกครั้ง"
    : loading ? "กำลังตรวจสอบสถานะการชำระเงิน..."
    : terminal ? "รายการนี้ยังไม่เสร็จสมบูรณ์ ตรวจสอบรายละเอียดได้จากประวัติคำสั่งซื้อ"
    : "ได้รับข้อมูลแล้ว กำลังรอการยืนยันการชำระเงิน";

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
          {order.data && !mismatch ? `Order Number: #${order.data.orderNumber.replace(/^#/, "")}` : validOrder ? `Order #${orderId}` : "Order not found"}
        </p>
        {paid ? (
          <>
            <section className="payment-success-summary" aria-labelledby="transaction-summary-title">
              <h2 id="transaction-summary-title">Transaction Summary</h2>
              <dl>
                <div className="payment-success-row"><dt>Date</dt><dd>{paymentSuccessDate(order.data?.paidAt)}</dd></div>
                <div className="payment-success-row"><dt>Payment Method</dt><dd>{paymentMethodName(payment.data?.method)}</dd></div>
                <div className="payment-success-row"><dt>Items</dt><dd>{items.length ? itemDescription : "—"}</dd></div>
                <div className="payment-success-row payment-success-total"><dt>Total Amount</dt><dd>{amountText}</dd></div>
              </dl>
            </section>
            <p className="payment-success-thanks">Thank you for using Pegasus TCG</p>
          </>
        ) : (
          <div className="payment-success-status" role={failedRequest || terminal ? "alert" : "status"}>
            <p>{statusMessage}</p>
            {validRequest && !mismatch && (order.isError || payment.isError) && (
              <Button className="mt-4 rounded-full" variant="outline" onClick={retry}>ลองอีกครั้ง</Button>
            )}
          </div>
        )}
        <div className="payment-success-actions">
          <Button nativeButton={false} className="h-9 rounded-full text-sm" render={<Link to={validRequest && !mismatch ? `/account/orders?orderId=${orderId}` : "/account/orders"} />}>
            {validRequest && !mismatch ? "View Order Details" : "View Orders"}
          </Button>
          <Button nativeButton={false} variant="outline" className="h-9 rounded-full text-sm text-[#636366] opacity-50 hover:opacity-100" render={<Link to="/products" />}>
            Continue Shopping
          </Button>
        </div>
      </Card>
    </div>
  );
}
