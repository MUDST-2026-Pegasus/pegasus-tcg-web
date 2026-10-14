import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock, FileText, Loader2, Lock, Shield, ShoppingBag } from "lucide-react";
import { FormPageSkeleton } from "@/components/common/PageSkeletons";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { useFileUpload } from "@/hooks/use-file-upload";
import { getErrorMessage } from "@/lib/api";
import { ordersApi } from "@/features/account/orders.api";
import { cartKeys } from "@/features/cart/cart.queries";
import type { CheckoutResponse } from "@/features/cart/checkout.types";
import { financeApi } from "@/features/finance/finance.api";
import { PaymentQrCard } from "../components/PaymentQrCard";
import { PaymentSteps } from "../components/PaymentSteps";
import { PaymentOrderSummary, type OrderItemSummaryData } from "../components/PaymentOrderSummary";

function transferAccount(raw: string | undefined): Record<string, string> {
  try {
    const value: unknown = JSON.parse(raw ?? "{}");
    return value && typeof value === "object" ? (value as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function usePaymentCountdown(expiresAt: string | undefined, defaultTime = "14:59") {
  const [timeLeft, setTimeLeft] = useState(defaultTime);

  useEffect(() => {
    if (!expiresAt) return;
    const target = new Date(expiresAt).getTime();
    if (Number.isNaN(target)) return;

    function tick() {
      const diffInSeconds = Math.floor((target - Date.now()) / 1000);
      if (diffInSeconds <= 0) {
        setTimeLeft("00:00");
        return;
      }
      const minutes = Math.floor(diffInSeconds / 60);
      const seconds = diffInSeconds % 60;
      setTimeLeft(
        `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`,
      );
    }

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, defaultTime]);

  return timeLeft;
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
  const timeLeft = usePaymentCountdown(payment?.expiresAt);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, []);

  useEffect(() => {
    if (payment?.status === "SUCCEEDED") {
      void queryClient.invalidateQueries({ queryKey: cartKeys.all });
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
      navigate(`/payment/success?orderId=${orderId}&paymentId=${payment.id}`, {
        replace: true,
      });
    }
  }, [payment?.status, payment?.id, orderId, navigate, queryClient]);

  async function submitSlip() {
    const key = slip.objectKeys[0];
    if (!payment || !key) return;
    setIsSubmitting(true);
    try {
      const updated = await financeApi.attachPaymentSlip(
        payment.id,
        key,
        referenceCode.trim() || undefined,
      );
      queryClient.setQueryData(["finance", "payment-status", payment.id], updated);
      toast.add({
        type: "success",
        title: "ส่งหลักฐานแล้ว",
        description: "รอผู้ดูแลตรวจสอบการชำระเงิน",
      });
    } catch (error) {
      toast.add({
        type: "error",
        title: "ส่งหลักฐานไม่สำเร็จ",
        description: getErrorMessage(error, "กรุณาลองอีกครั้ง"),
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const sellerOrders = order?.sellerOrders;
  const summaryItems = useMemo<OrderItemSummaryData[] | undefined>(() => {
    if (!sellerOrders?.length) return undefined;
    return sellerOrders.flatMap((so) =>
      so.items.map((item) => ({
        id: item.id,
        productName: item.productName,
        variantLabel: item.variantLabel,
        condition: item.condition,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        lineTotal: item.lineTotal,
        imageUrl: item.imageUrl,
      })),
    );
  }, [sellerOrders]);

  if (!validOrderId) {
    return (
      <div className="container mx-auto max-w-xl p-8 text-center">
        <p className="text-muted-foreground">ไม่พบหมายเลขคำสั่งซื้อ</p>
        <Button className="mt-4" onClick={() => navigate("/account/orders")}>
          กลับไปประวัติคำสั่งซื้อ
        </Button>
      </div>
    );
  }

  if (paymentQuery.isPending) {
    return <FormPageSkeleton label="กำลังเตรียมข้อมูลการชำระเงิน" />;
  }

  if (paymentQuery.isError) {
    return (
      <div className="container mx-auto max-w-xl p-8 text-center">
        <p role="alert" className="text-destructive font-medium">
          {getErrorMessage(paymentQuery.error, "ไม่สามารถเริ่มการชำระเงินได้")}
        </p>
        <Button className="mt-4" onClick={() => navigate("/account/orders")}>
          กลับไปประวัติคำสั่งซื้อ
        </Button>
      </div>
    );
  }

  if (!payment) return null;

  const orderNumber =
    order?.orderNumber ?? (orderId ? `ORD-${orderId}` : "ORD-10241");
  const formattedAmount = Number(payment.amount).toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const uploadedItem = slip.items[0];
  const hasUploadedSlip = Boolean(slip.objectKeys.length > 0 && uploadedItem?.status === "done");
  const isAwaitingVerification = payment.status === "AWAITING_VERIFICATION";

  const isButtonDisabled =
    !hasUploadedSlip ||
    slip.isUploading ||
    isSubmitting ||
    isAwaitingVerification;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F8FAFC]/50 py-6 md:py-8">
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
            Secure Checkout
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Pay with PromptPay, then upload your slip so we can confirm your order.
          </p>
        </div>

        {/* Two-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Payment Card (lg:col-span-8) */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
            {/* Top Accent Stripe - Same color as Pegasus Logo (sky-700) */}
            <div className="h-1 bg-sky-700 w-full" />

            <div className="p-6 md:p-8">
              {/* Card Header: Amount Due and Expiration Badge */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                    AMOUNT DUE
                  </span>
                  <p className="text-3xl font-extrabold text-foreground tracking-tight mt-0.5">
                    THB {formattedAmount}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Order #{orderNumber} · Pay exactly this amount
                  </p>
                </div>

                {/* Expiration Timer Badge */}
                <div className="inline-flex items-center gap-2.5 bg-[#FFF6ED] border border-[#FFE8D1] rounded-full px-4 py-2 self-start sm:self-center">
                  <Clock className="size-4.5 text-amber-600 shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-medium text-amber-600 leading-tight">
                      Expires in
                    </span>
                    <span className="text-sm font-bold text-amber-900 leading-tight">
                      {timeLeft}
                    </span>
                  </div>
                </div>
              </div>

              {/* Full-width Divider Line below Header */}
              <div className="border-t border-slate-100 -mx-6 md:-mx-8 my-6" />

              {/* Card Body: QR Scan & 3 Steps in 2 Columns */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                {/* Left: QR Code Scan Section */}
                <div className="md:col-span-5 flex justify-center">
                  <PaymentQrCard
                    orderNumber={orderNumber}
                    account={account}
                  />
                </div>

                {/* Right: 3 Steps Timeline */}
                <div className="md:col-span-7">
                  <PaymentSteps
                    amount={payment.amount}
                    slip={slip}
                    referenceCode={referenceCode}
                    onReferenceCodeChange={setReferenceCode}
                  />
                </div>
              </div>

              {/* Full-width Divider Line above Submit Button */}
              <div className="border-t border-slate-100 -mx-6 md:-mx-8 mt-8 mb-6" />

              {/* Full-width Action Section below the divider */}
              {isAwaitingVerification ? (
                <div className="space-y-4">
                  {/* Status Announcement Card */}
                  <div className="rounded-xl border border-sky-100 bg-sky-50/70 p-4 sm:p-5 flex flex-col sm:flex-row items-center sm:items-start gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                      <Clock className="size-5 animate-pulse" />
                    </div>
                    <div className="flex-1 text-center sm:text-left space-y-1">
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                        <h4 className="text-sm font-bold text-sky-950">
                          ส่งหลักฐานเรียบร้อยแล้ว · รอผู้ดูแลระบบตรวจสอบ
                        </h4>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-sky-200/80 text-sky-900">
                          Payment Under Review
                        </span>
                      </div>
                      <p className="text-xs text-sky-800/90 leading-relaxed">
                        เราได้รับสลิปของคุณแล้ว คุณสามารถปิดหน้านี้หรือไปทำรายการอื่นได้โดยไม่ต้องรอ ระบบจะอัปเดตสถานะให้โดยอัตโนมัติเมื่อได้รับการอนุมัติ
                      </p>
                    </div>
                  </div>

                  {/* Navigation Actions */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <Button
                      type="button"
                      onClick={() => navigate("/account/orders")}
                      className="w-full h-11 rounded-xl bg-sky-700 hover:bg-sky-800 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                    >
                      <FileText className="size-4" />
                      <span>ดูประวัติคำสั่งซื้อ</span>
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate("/products")}
                      className="w-full h-11 rounded-xl border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <ShoppingBag className="size-4" />
                      <span>เลือกซื้อสินค้าต่อ</span>
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <Button
                    type="button"
                    onClick={submitSlip}
                    disabled={isButtonDisabled}
                    className={`w-full h-12 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                      isButtonDisabled
                        ? "bg-[#85b4d0] text-white hover:bg-[#85b4d0] cursor-not-allowed opacity-90 shadow-none"
                        : "bg-sky-700 hover:bg-sky-800 text-white shadow-xs cursor-pointer"
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        <span>Submitting payment...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="size-4" />
                        <span>Submit payment for verification</span>
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1.5 mt-3">
                    <Shield className="size-3.5 text-muted-foreground" />
                    <span>Upload your slip and reference no. to continue.</span>
                  </p>
                </div>
              )}

              {/* Status Alert for Failed / Expired */}
              {(payment.status === "FAILED" ||
                payment.status === "EXPIRED" ||
                payment.status === "CANCELLED") && (
                <div className="mt-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-center space-y-3">
                  <p role="alert" className="text-sm font-medium text-destructive">
                    {payment.failureReason || `การชำระเงินสถานะ: ${payment.status}`}
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      slip.clear();
                      setAttemptKey(crypto.randomUUID());
                    }}
                  >
                    เริ่มการชำระเงินใหม่
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Order Summary Card (lg:col-span-4) */}
          <div className="lg:col-span-4 sticky top-6">
            <PaymentOrderSummary
              items={summaryItems}
              subtotal={order?.itemsSubtotal}
              shippingTotal={order?.shippingTotal}
              grandTotal={payment.amount ?? order?.grandTotal}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
