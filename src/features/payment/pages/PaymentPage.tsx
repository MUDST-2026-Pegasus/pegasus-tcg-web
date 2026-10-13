import { useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { useFileUpload } from "@/hooks/use-file-upload";
import { getErrorMessage } from "@/lib/api";
import { ordersApi } from "@/features/account/orders.api";
import { cartKeys } from "@/features/cart/cart.queries";
import type { CheckoutResponse } from "@/features/cart/checkout.types";
import { financeApi } from "@/features/finance/finance.api";

function transferAccount(raw: string | undefined): Record<string, string> {
  try {
    const value: unknown = JSON.parse(raw ?? "{}");
    return value && typeof value === "object" ? value as Record<string, string> : {};
  } catch {
    return {};
  }
}

export function PaymentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const state = location.state as { orderId?: number; order?: CheckoutResponse } | null;
  const orderId = Number(state?.orderId ?? searchParams.get("orderId"));
  const validOrderId = Number.isSafeInteger(orderId) && orderId > 0;
  const [attemptKey, setAttemptKey] = useState(() => crypto.randomUUID());
  const [referenceCode, setReferenceCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const slip = useFileUpload({ purpose: "PAYMENT_SLIP" });

  const orderQuery = useQuery({
    queryKey: ["orders", orderId],
    queryFn: () => ordersApi.getOrder(orderId),
    enabled: validOrderId && !state?.order,
  });
  const order = state?.order ?? orderQuery.data;
  const paymentQuery = useQuery({
    queryKey: ["finance", "payment", orderId, attemptKey],
    queryFn: () => financeApi.createPayment(orderId, attemptKey),
    enabled: validOrderId,
    retry: false,
  });
  const paymentId = paymentQuery.data?.id;
  const statusQuery = useQuery({
    queryKey: ["finance", "payment-status", paymentId],
    queryFn: () => financeApi.getPayment(paymentId!),
    enabled: paymentId !== undefined,
    initialData: paymentQuery.data,
    refetchInterval: (query) =>
      query.state.data?.status === "AWAITING_VERIFICATION" ? 5000 : false,
  });
  const payment = statusQuery.data ?? paymentQuery.data;
  const account = transferAccount(payment?.transferAccountJson);

  useEffect(() => {
    if (payment?.status === "SUCCEEDED") {
      void queryClient.invalidateQueries({ queryKey: cartKeys.all });
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
      navigate(`/payment/success?orderId=${orderId}&paymentId=${payment.id}`, { replace: true });
    }
  }, [payment?.status, payment?.id, orderId, navigate, queryClient]);

  async function submitSlip() {
    const key = slip.objectKeys[0];
    if (!payment || !key) return;
    setIsSubmitting(true);
    try {
      const updated = await financeApi.attachPaymentSlip(payment.id, key, referenceCode.trim() || undefined);
      queryClient.setQueryData(["finance", "payment-status", payment.id], updated);
      toast.add({ type: "success", title: "ส่งหลักฐานแล้ว", description: "รอผู้ดูแลตรวจสอบการชำระเงิน" });
    } catch (error) {
      toast.add({ type: "error", title: "ส่งหลักฐานไม่สำเร็จ", description: getErrorMessage(error, "กรุณาลองอีกครั้ง") });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!validOrderId) return <p className="p-8">ไม่พบหมายเลขคำสั่งซื้อ</p>;
  if (paymentQuery.isPending) return <p className="p-8">กำลังเตรียมข้อมูลการชำระเงิน...</p>;
  if (paymentQuery.isError) return (
    <div className="mx-auto max-w-xl p-8">
      <p role="alert" className="text-destructive">{getErrorMessage(paymentQuery.error, "ไม่สามารถเริ่มการชำระเงินได้")}</p>
      <Button className="mt-4" onClick={() => navigate("/account/orders")}>กลับไปประวัติคำสั่งซื้อ</Button>
    </div>
  );
  if (!payment) return null;

  return (
    <div className="container mx-auto max-w-4xl space-y-6 px-4 py-8">
      <h1 className="text-3xl font-bold">ชำระเงินด้วยการโอนธนาคาร</h1>
      <Card>
        <CardHeader><CardTitle>คำสั่งซื้อ {order?.orderNumber ?? `#${orderId}`}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p>ยอดที่ต้องโอน: <strong>฿{Number(payment.amount).toLocaleString("th-TH", { minimumFractionDigits: 2 })}</strong></p>
          <p>ธนาคาร: {account.bankName || "—"}</p>
          <p>ชื่อบัญชี: {account.accountName || "—"}</p>
          <p>เลขบัญชี: {account.accountNumber || "—"}</p>
          {account.promptPayId && <p>PromptPay: {account.promptPayId}</p>}
          <p>ชำระภายใน: {new Date(payment.expiresAt).toLocaleString("th-TH")}</p>
          <p>สถานะ: {payment.status}</p>
          {payment.failureReason && <p role="alert" className="text-destructive">{payment.failureReason}</p>}
        </CardContent>
      </Card>
      {(payment.status === "PENDING" || payment.status === "AWAITING_VERIFICATION") && (
        <Card>
          <CardHeader><CardTitle>แนบหลักฐานการโอน</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Input type="file" accept={slip.accept} onChange={(event) => {
              if (event.target.files?.length) slip.addFiles(event.target.files);
            }} />
            {slip.items[0]?.status === "error" && <p role="alert" className="text-destructive">{slip.items[0].error}</p>}
            <Input aria-label="เลขอ้างอิงการโอน" placeholder="เลขอ้างอิงการโอน (ถ้ามี)" value={referenceCode} onChange={(event) => setReferenceCode(event.target.value)} />
            <Button disabled={!slip.objectKeys.length || slip.isUploading || isSubmitting} onClick={submitSlip}>
              {isSubmitting ? "กำลังส่ง..." : "ส่งหลักฐาน"}
            </Button>
            {payment.status === "AWAITING_VERIFICATION" && <p>ส่งหลักฐานแล้ว กำลังรอผู้ดูแลตรวจสอบ ระบบจะอัปเดตสถานะให้อัตโนมัติ</p>}
          </CardContent>
        </Card>
      )}
      {(payment.status === "FAILED" || payment.status === "EXPIRED" || payment.status === "CANCELLED") && (
        <Button onClick={() => { slip.clear(); setAttemptKey(crypto.randomUUID()); }}>เริ่มการชำระเงินใหม่</Button>
      )}
    </div>
  );
}
