import { useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Clock, QrCode, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api/errors";
import { ordersApi } from "@/features/account/orders.api";
import type { OrderDetails } from "@/features/account/orders.types";
import type { CheckoutResponse } from "@/features/cart/checkout.types";
import { cartKeys } from "@/features/cart/cart.queries";

export function PaymentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();

  const stateData = location.state as {
    orderId?: number;
    order?: CheckoutResponse | OrderDetails;
  } | null;

  const orderId =
    stateData?.orderId ||
    (searchParams.get("orderId") ? Number(searchParams.get("orderId")) : null);

  const [order, setOrder] = useState<CheckoutResponse | OrderDetails | null>(
    stateData?.order || null,
  );
  const [isLoading, setIsLoading] = useState(!stateData?.order && !!orderId);
  const [isConfirming, setIsConfirming] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(15 * 60);

  // Fetch order details if not in state
  useEffect(() => {
    if (!order && orderId) {
      setIsLoading(true);
      ordersApi
        .getOrder(orderId)
        .then((res) => {
          setOrder(res);
        })
        .catch((err) => {
          toast.add({
            title: "Failed to Load Order",
            description: err instanceof ApiError ? err.message : "Error loading order",
            type: "error",
          });
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [order, orderId]);

  // Countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleConfirmPayment = async () => {
    if (!orderId) {
      toast.add({
        title: "No Order ID",
        description: "Cannot process payment without an order ID.",
        type: "error",
      });
      return;
    }

    setIsConfirming(true);
    try {
      const paidOrder = await ordersApi.payOrder(orderId);
      queryClient.invalidateQueries({ queryKey: cartKeys.all });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.add({
        title: "Payment Confirmed",
        description: `Order ${paidOrder.orderNumber} has been paid successfully.`,
        type: "success",
      });
      navigate(`/payment/success?orderId=${orderId}`, {
        state: {
          orderId,
          order: paidOrder,
        },
      });
    } catch (err) {
      if (err instanceof ApiError) {
        toast.add({
          title: "Payment Failed",
          description: err.message,
          type: "error",
        });
      } else {
        toast.add({
          title: "Error",
          description: "An unexpected error occurred during payment.",
          type: "error",
        });
      }
    } finally {
      setIsConfirming(false);
    }
  };

  const handleSaveQr = () => {
    toast.add({
      title: "QR Saved",
      description: "PromptPay QR code has been saved to your device.",
      type: "info",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm font-medium">Loading payment details...</p>
      </div>
    );
  }

  const grandTotal = order?.grandTotal ?? 0;
  const itemsSubtotal = order?.itemsSubtotal ?? 0;
  const shippingTotal = order?.shippingTotal ?? 0;

  // Extract first item from sellerOrders
  const sellerOrders = order?.sellerOrders ?? [];
  const firstSellerOrder = sellerOrders[0];
  const firstItem = firstSellerOrder?.items?.[0];

  const formatPrice = (amount: number) => `THB ${amount.toLocaleString()}`;

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Secure Checkout</h1>
        <p className="text-muted-foreground">
          Scan the QR code below to complete your payment.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Side: QR Code */}
        <Card className="flex-1 border-t-4 border-t-primary">
          <CardHeader className="text-center pt-8">
            <CardTitle className="text-2xl font-bold">PromptPay QR</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-6 pb-12">
            <div className="bg-white border-2 border-border/80 shadow-inner w-64 h-64 flex flex-col items-center justify-center p-4 rounded-xl">
              <QrCode className="w-44 h-44 text-primary" />
              <span className="text-xs mt-2 font-bold tracking-wider text-foreground">
                PAY VIA QR SCAN
              </span>
              <span className="text-[11px] text-muted-foreground font-medium">
                Scan to Pay | {formatPrice(grandTotal)}
              </span>
            </div>

            <div className="text-center flex flex-col items-center gap-4">
              <p className="font-medium text-lg">Open your banking app to scan</p>
              <div className="flex items-center gap-2 bg-muted px-4 py-2 rounded-full text-sm font-medium">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span>Pay within {formatTimer(timeRemaining)}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full mt-4 max-w-sm">
              <Button
                className="flex-1 rounded-full"
                variant="default"
                size="lg"
                onClick={handleSaveQr}
              >
                Save QR
              </Button>
              <Button
                className="flex-1 rounded-full"
                variant="outline"
                size="lg"
                disabled={isConfirming}
                onClick={handleConfirmPayment}
              >
                {isConfirming ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </div>
                ) : (
                  "Confirm Payment"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Right Side: Order Summary */}
        <Card className="w-full lg:w-96 h-fit pt-6">
          <CardHeader>
            <CardTitle className="text-xl">Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <div className="flex gap-4">
              <div className="w-20 h-28 bg-[#f4f4f5] rounded-md overflow-hidden shrink-0 border flex items-center justify-center p-1">
                {firstItem?.imageUrl ? (
                  <img
                    src={firstItem.imageUrl}
                    alt={firstItem.productName}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <span className="text-xs text-muted-foreground text-center px-2">
                    TCG Card
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-1 min-w-0">
                <p className="font-bold text-sm truncate">
                  {firstItem?.productName || "Order Items"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {[firstItem?.variantLabel, firstItem?.condition]
                    .filter(Boolean)
                    .join(" • ")}
                </p>
                <p className="font-medium mt-2">
                  {formatPrice(firstItem ? firstItem.unitPrice : grandTotal)}
                  {firstItem && firstItem.quantity > 1 && (
                    <span className="text-xs text-muted-foreground">
                      {" "}× {firstItem.quantity}
                    </span>
                  )}
                </p>
              </div>
            </div>

            <Separator />

            <div className="flex flex-col gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{formatPrice(itemsSubtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span className="font-medium">{formatPrice(shippingTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax</span>
                <span className="font-medium">Included</span>
              </div>
            </div>

            <Separator />

            <div className="flex justify-between items-center pb-4">
              <span className="font-bold text-lg">Total</span>
              <span className="font-bold text-xl text-primary font-heading">
                {formatPrice(grandTotal)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
