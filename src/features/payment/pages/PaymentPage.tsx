import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Clock, QrCode } from "lucide-react";
import { PAYMENT_PAGE_FIXTURE } from "@/features/payment/Payment.fixture";

export function PaymentPage() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Secure Checkout</h1>
        <p className="text-muted-foreground">Scan the QR code below to complete your payment.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Side: QR Code */}
        <Card className="flex-1 border-t-4 border-t-primary">
          <CardHeader className="text-center pt-8">
            <CardTitle className="text-2xl font-bold">PromptPay QR</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-6 pb-12">
            <div className="bg-muted w-64 h-64 flex flex-col items-center justify-center p-4 rounded-xl">
               <QrCode className="w-48 h-48 text-primary" />
               <span className="text-xs mt-2 font-medium">PAY VIA QR SCAN</span>
               <span className="text-[10px] text-muted-foreground">Scan to Pay | {PAYMENT_PAGE_FIXTURE.qrCode.amountText}</span>
            </div>
            
            <div className="text-center flex flex-col items-center gap-4">
              <p className="font-medium text-lg">Open your banking app to scan</p>
              <div className="flex items-center gap-2 bg-muted px-4 py-2 rounded-full text-sm font-medium">
                <Clock className="w-4 h-4" />
                <span>Pay within {PAYMENT_PAGE_FIXTURE.qrCode.timeRemaining}</span>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full mt-4 max-w-sm">
              <Button className="flex-1" variant="default" size="lg">Save QR</Button>
              <Button className="flex-1" variant="outline" size="lg" onClick={() => navigate("/payment/success")}>Confirm</Button>
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
              <div className="w-20 h-28 bg-muted rounded-md overflow-hidden flex-shrink-0 border flex items-center justify-center">
                 <span className="text-xs text-muted-foreground text-center px-2">Image<br/>Placeholder</span>
              </div>
              <div className="flex flex-col gap-1">
                <p className="font-bold text-sm">{PAYMENT_PAGE_FIXTURE.orderSummary.item.name}</p>
                <p className="text-xs text-muted-foreground">{PAYMENT_PAGE_FIXTURE.orderSummary.item.description}</p>
                <p className="font-medium mt-2">{PAYMENT_PAGE_FIXTURE.orderSummary.item.price}</p>
              </div>
            </div>

            <Separator />

            <div className="flex flex-col gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{PAYMENT_PAGE_FIXTURE.orderSummary.subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span className="font-medium">{PAYMENT_PAGE_FIXTURE.orderSummary.shipping}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax</span>
                <span className="font-medium">{PAYMENT_PAGE_FIXTURE.orderSummary.tax}</span>
              </div>
            </div>

            <Separator />

            <div className="flex justify-between items-center pb-4">
              <span className="font-bold text-lg">Total</span>
              <span className="font-bold text-xl">{PAYMENT_PAGE_FIXTURE.orderSummary.total}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
