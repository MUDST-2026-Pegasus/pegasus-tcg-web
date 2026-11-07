import { getLanguage, translate, useLanguage } from "@/lib/language";
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
import { parseAuctionNumber } from "@/features/auction/auction.format";
import { AuctionOrderBadge } from "@/features/auction/components/AuctionOrderBadge";
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
  useLanguage();
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
  useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const state = location.state as { orderId?: number; order?: CheckoutResponse } | null;
  const orderId = Number(state?.orderId ?? searchParams.get("orderId"));
  // คำสั่งซื้อจากประมูล — ยังไม่มี `source` ใน order จึงส่งเลขประมูลมาทาง query [TCG-631]
  const auctionNumber = parseAuctionNumber(searchParams.get("auction"));
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
  const rawAccount = transferAccount(payment?.transferAccountJson);
  const cleanAccountNumber =
    rawAccount.accountNumber === "000-0-00000-0" ||
    rawAccount.accountNumber === "0000000000"
      ? undefined
      : rawAccount.accountNumber;
  const account = {
    ...rawAccount,
    accountNumber: cleanAccountNumber,
    bankName: payment?.bankName ?? rawAccount.bankName,
    accountName: payment?.accountName ?? rawAccount.accountName,
    promptPayId: payment?.promptpayId ?? rawAccount.promptpayId ?? rawAccount.promptPayId,
    promptpayId: payment?.promptpayId ?? rawAccount.promptpayId ?? rawAccount.promptPayId,
    qrPayload: payment?.qrPayload ?? rawAccount.qrPayload,
  };
  const qrPayload = payment?.qrPayload ?? rawAccount.qrPayload;
  const timeLeft = usePaymentCountdown(payment?.expiresAt);
  const isExpired = timeLeft === "00:00" || payment?.status === "EXPIRED";

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, []);

  useEffect(() => {
    if (payment?.status === "SUCCEEDED") {
      void queryClient.invalidateQueries({ queryKey: cartKeys.all });
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
      const auctionQuery = auctionNumber ? `&auction=${encodeURIComponent(auctionNumber)}` : "";
      navigate(`/payment/success?orderId=${orderId}&paymentId=${payment.id}${auctionQuery}`, {
        replace: true,
      });
    }
  }, [payment?.status, payment?.id, orderId, auctionNumber, navigate, queryClient]);

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
        title: translate("ส่งหลักฐานแล้ว", "Payment proof submitted"),
        description: translate("รอผู้ดูแลตรวจสอบการชำระเงิน", "Waiting for an administrator to verify your payment"),
      });
    } catch (error) {
      toast.add({
        type: "error",
        title: translate("ส่งหลักฐานไม่สำเร็จ", "Could not submit payment proof"),
        description: getErrorMessage(error, translate("กรุณาลองอีกครั้ง", "Please try again")),
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
        <p className="text-muted-foreground">{translate("ไม่พบหมายเลขคำสั่งซื้อ", "Order number not found")}</p>
        <Button className="mt-4" onClick={() => navigate("/account/orders")}>
          {translate("กลับไปประวัติคำสั่งซื้อ", "Back to order history")}</Button>
      </div>
    );
  }

  if (paymentQuery.isPending) {
    return <FormPageSkeleton label={translate("กำลังเตรียมข้อมูลการชำระเงิน", "Preparing payment details")} />;
  }

  if (paymentQuery.isError) {
    return (
      <div className="container mx-auto max-w-xl p-8 text-center">
        <p role="alert" className="text-destructive font-medium">
          {getErrorMessage(paymentQuery.error, translate("ไม่สามารถเริ่มการชำระเงินได้", "Could not start payment"))}
        </p>
        <Button className="mt-4" onClick={() => navigate("/account/orders")}>
          {translate("กลับไปประวัติคำสั่งซื้อ", "Back to order history")}</Button>
      </div>
    );
  }

  if (!payment) return null;

  const orderNumber =
    order?.orderNumber ?? (orderId ? `ORD-${orderId}` : "ORD-10241");
  const formattedAmount = Number(payment.amount).toLocaleString(getLanguage() === "th" ? "th-TH" : "en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const uploadedItem = slip.items[0];
  const hasUploadedSlip = Boolean(slip.objectKeys.length > 0 && uploadedItem?.status === "done");
  const isAwaitingVerification = payment.status === "AWAITING_VERIFICATION";
  const isPaymentLocked =
    isSubmitting || isAwaitingVerification || payment.status !== "PENDING";

  const isButtonDisabled =
    !hasUploadedSlip ||
    slip.isUploading ||
    isSubmitting ||
    isAwaitingVerification ||
    isExpired;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F8FAFC]/50 py-6 md:py-8">
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
            {translate("ชำระเงินอย่างปลอดภัย", "Secure Checkout")}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {translate("ชำระผ่านพร้อมเพย์ แล้วอัปโหลดสลิปเพื่อให้เรายืนยันคำสั่งซื้อ", "Pay with PromptPay, then upload your slip so we can confirm your order.")}</p>
        </div>

        {/* Two-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Payment Card (lg:col-span-8) */}
          <div className="lg:col-span-8 bg-card rounded-2xl border border-muted shadow-xs overflow-hidden">
            {/* Top Accent Stripe - Same color as Pegasus Logo (sky-700) */}
            <div className="h-1 bg-primary w-full" />

            <div className="p-6 md:p-8">
              {/* Card Header: Amount Due and Expiration Badge */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                    {translate("ยอดที่ต้องชำระ", "AMOUNT DUE")}</span>
                  <p className="text-3xl font-extrabold text-foreground tracking-tight mt-0.5">
                    {translate("บาท", "THB")}{formattedAmount}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {translate("คำสั่งซื้อ #", "Order #")}{orderNumber} {translate("· กรุณาชำระเงินให้ตรงยอด", "· Pay exactly this amount")}</p>
                  {auctionNumber && <AuctionOrderBadge auctionNumber={auctionNumber} className="mt-2" />}
                </div>

                {/* Expiration Timer Badge */}
                <div
                  className={`inline-flex items-center gap-2.5 rounded-full px-4 py-2 self-start sm:self-center border transition-colors ${
                    isExpired
                      ? "bg-red-50 border-red-200"
                      : "bg-[#FFF6ED] border-[#FFE8D1]"
                  }`}
                >
                  <Clock
                    className={`size-4.5 shrink-0 ${
                      isExpired ? "text-red-600" : "text-amber-600"
                    }`}
                  />
                  <div className="flex flex-col">
                    <span
                      className={`text-[10px] font-medium leading-tight ${
                        isExpired ? "text-red-600" : "text-amber-600"
                      }`}
                    >
                      {isExpired ? translate("สถานะ", "Status") : translate("หมดอายุใน", "Expires in")}
                    </span>
                    <span
                      className={`text-sm font-bold leading-tight ${
                        isExpired ? "text-red-700" : "text-amber-900"
                      }`}
                    >
                      {isExpired ? translate("หมดอายุ (00:00)", "Expired (00:00)") : timeLeft}
                    </span>
                  </div>
                </div>
              </div>

              {/* Full-width Divider Line below Header */}
              <div className="border-t border-muted -mx-6 md:-mx-8 my-6" />

              {/* Card Body: QR Scan & 3 Steps in 2 Columns */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                {/* Left: QR Code Scan Section */}
                <div className="md:col-span-5 flex justify-center">
                  <PaymentQrCard
                    amount={payment.amount}
                    orderNumber={orderNumber}
                    qrPayload={qrPayload}
                    account={account}
                    isExpired={isExpired}
                  />
                </div>

                {/* Right: 3 Steps Timeline */}
                <div className="md:col-span-7">
                  <PaymentSteps
                    amount={payment.amount}
                    slip={slip}
                    referenceCode={referenceCode}
                    onReferenceCodeChange={setReferenceCode}
                    disabled={isPaymentLocked}
                  />
                </div>
              </div>

              {/* Full-width Divider Line above Submit Button */}
              <div className="border-t border-muted -mx-6 md:-mx-8 mt-8 mb-6" />

              {/* Full-width Action Section below the divider */}
              {isAwaitingVerification ? (
                <div className="space-y-4">
                  {/* Status Announcement Card */}
                  <div className="rounded-xl border border-sky-100 bg-sky-50/70 p-4 sm:p-5 flex flex-col sm:flex-row items-center sm:items-start gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-sky-100 text-primary flex items-center justify-center shrink-0">
                      <Clock className="size-5 animate-pulse" />
                    </div>
                    <div className="flex-1 text-center sm:text-left space-y-1">
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                        <h4 className="text-sm font-bold text-sky-950">
                          {translate("ส่งหลักฐานเรียบร้อยแล้ว · รอผู้ดูแลระบบตรวจสอบ", "Payment proof submitted · awaiting verification")}</h4>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-sky-200/80 text-sky-900">
                          {translate("กำลังตรวจสอบการชำระเงิน", "Payment Under Review")}</span>
                      </div>
                      <p className="text-xs text-sky-800/90 leading-relaxed">
                        {translate("เราได้รับสลิปของคุณแล้ว คุณสามารถปิดหน้านี้หรือไปทำรายการอื่นได้โดยไม่ต้องรอ ระบบจะอัปเดตสถานะให้โดยอัตโนมัติเมื่อได้รับการอนุมัติ", "We received your payment slip. You can leave this page while we verify it. The status will update automatically once approved")}</p>
                    </div>
                  </div>

                  {/* Navigation Actions */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <Button
                      type="button"
                      onClick={() => navigate("/account/orders")}
                      className="w-full h-11 rounded-xl bg-primary hover:bg-sky-800 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                    >
                      <FileText className="size-4" />
                      <span>{translate("ดูประวัติคำสั่งซื้อ", "View order history")}</span>
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate("/products")}
                      className="w-full h-11 rounded-xl border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <ShoppingBag className="size-4" />
                      <span>{translate("เลือกซื้อสินค้าต่อ", "Continue shopping")}</span>
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
                        : "bg-primary hover:bg-sky-800 text-white shadow-xs cursor-pointer"
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        <span>{translate("กำลังส่งข้อมูลชำระเงิน…", "Submitting payment...")}</span>
                      </>
                    ) : (
                      <>
                        <Lock className="size-4" />
                        <span>{translate("ส่งข้อมูลเพื่อตรวจสอบการชำระเงิน", "Submit payment for verification")}</span>
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1.5 mt-3">
                    <Shield className="size-3.5 text-muted-foreground" />
                    <span>{translate("อัปโหลดสลิปและกรอกเลขอ้างอิงเพื่อดำเนินการต่อ", "Upload your slip and reference no. to continue.")}</span>
                  </p>
                </div>
              )}

              {/* Status Alert for Failed / Expired */}
              {(payment.status === "FAILED" ||
                payment.status === "EXPIRED" ||
                payment.status === "CANCELLED" ||
                isExpired) && (
                <div className="mt-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-center space-y-3">
                  <p role="alert" className="text-sm font-medium text-destructive">
                    {payment.failureReason ||
                      (isExpired
                        ? translate("การชำระเงินหมดอายุแล้ว กรุณาลองใหม่อีกครั้ง", "This payment has expired. Please try again")
                        : translate(`การชำระเงินสถานะ: ${payment.status}`, `Payment status: ${payment.status}`))}
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      slip.clear();
                      setAttemptKey(crypto.randomUUID());
                    }}
                  >
                    {translate("เริ่มการชำระเงินใหม่", "Start a new payment")}</Button>
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
              saleDiscount={order?.saleDiscountTotal}
              grandTotal={payment.amount ?? order?.grandTotal}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
