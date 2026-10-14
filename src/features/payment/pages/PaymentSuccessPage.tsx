import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ordersApi } from "@/features/account/orders.api";
import { financeApi } from "@/features/finance/finance.api";

export function PaymentSuccessPage() {
  const [params] = useSearchParams();
  const orderId = Number(params.get("orderId"));
  const paymentId = Number(params.get("paymentId"));
  const order = useQuery({
    queryKey: ["orders", orderId],
    queryFn: () => ordersApi.getOrder(orderId),
    enabled: Number.isSafeInteger(orderId) && orderId > 0,
  });
  const payment = useQuery({
    queryKey: ["finance", "payment-status", paymentId],
    queryFn: () => financeApi.getPayment(paymentId),
    enabled: Number.isSafeInteger(paymentId) && paymentId > 0,
  });
  const paid = payment.data?.status === "SUCCEEDED" || order.data?.status === "PAID";

  return (
    <div className="container mx-auto flex min-h-[60vh] max-w-xl items-center px-4 py-12">
      <Card className="w-full p-8 text-center">
        <CardContent className="space-y-5">
          {paid && <CheckCircle2 className="mx-auto size-16 text-emerald-600" />}
          <h1 className="text-2xl font-bold">{paid ? "ชำระเงินสำเร็จ" : "กำลังตรวจสอบการชำระเงิน"}</h1>
          <p>{order.data?.orderNumber ?? (orderId > 0 ? `คำสั่งซื้อ #${orderId}` : "ไม่พบคำสั่งซื้อ")}</p>
          {paid && <p>ยอดชำระ ฿{Number(payment.data?.amount ?? order.data?.grandTotal ?? 0).toLocaleString("th-TH", { minimumFractionDigits: 2 })}</p>}
          {!paid && !payment.isPending && !order.isPending && <p>ยังไม่มีการยืนยันการชำระเงิน กรุณาตรวจสอบสถานะในประวัติคำสั่งซื้อ</p>}
          <Button render={<Link to="/account/orders" />}>ดูประวัติคำสั่งซื้อ</Button>
        </CardContent>
      </Card>
    </div>
  );
}
