import { useNavigate } from "react-router-dom";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
  DialogDescription
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Field, FieldTitle, FieldContent } from "@/components/ui/field";
import { PAYMENT_SUCCESS_FIXTURE } from "@/features/payment/Payment.fixture";

export function PaymentSuccessPage() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto px-4 py-16 flex justify-center items-center">
      <Card className="w-full max-w-lg border-t-4 border-t-primary">
        <CardHeader className="flex flex-col items-center text-center gap-4 pt-8">
          <h2 className="text-xl font-black tracking-wider text-muted-foreground">PEGASUS</h2>
          
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground">
              <Check className="w-6 h-6 stroke-[3]" />
            </div>
          </div>
          
          <div className="flex flex-col gap-1 mt-2">
            <h1 className="text-3xl font-bold">Payment Successful</h1>
            <p className="text-muted-foreground">Order Number: {PAYMENT_SUCCESS_FIXTURE.orderNumber}</p>
          </div>
        </CardHeader>
        
        <CardContent className="flex flex-col gap-6 mt-4 pb-8">
          <div className="bg-muted/50 rounded-xl p-6 flex flex-col gap-4 border">
            <h3 className="font-semibold text-lg mb-2">Transaction Summary</h3>
            
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Date</span>
              <span className="font-medium">{PAYMENT_SUCCESS_FIXTURE.transactionSummary.date}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Payment Method</span>
              <span className="font-medium">{PAYMENT_SUCCESS_FIXTURE.transactionSummary.paymentMethod}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Items</span>
              <span className="font-medium">{PAYMENT_SUCCESS_FIXTURE.transactionSummary.items}</span>
            </div>
            
            <Separator className="my-2" />
            
            <div className="flex justify-between items-center">
              <span className="font-semibold">Total Amount</span>
              <span className="font-bold text-lg text-primary">{PAYMENT_SUCCESS_FIXTURE.transactionSummary.totalAmount}</span>
            </div>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Thank you for using Pegasus TCG
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mt-2">
            <Dialog>
              <DialogTrigger className={buttonVariants({ size: "lg", className: "flex-1" })}>
                View Order Details
              </DialogTrigger>
              <DialogContent className="sm:max-w-md p-8 gap-6">
                <DialogHeader className="gap-2">
                  <DialogTitle className="text-2xl font-bold">Order Details</DialogTitle>
                  <DialogDescription className="text-base text-muted-foreground">
                    Order {PAYMENT_SUCCESS_FIXTURE.orderDetails.orderNumber}
                  </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-5">
                  <Field>
                    <FieldTitle className="text-muted-foreground text-sm font-semibold">Product</FieldTitle>
                    <FieldContent>
                      <Input readOnly value={PAYMENT_SUCCESS_FIXTURE.orderDetails.product} className="bg-transparent border rounded-lg h-10 px-3 text-base" />
                    </FieldContent>
                  </Field>
                  <Field>
                    <FieldTitle className="text-muted-foreground text-sm font-semibold">Status</FieldTitle>
                    <FieldContent>
                      <Input readOnly value={PAYMENT_SUCCESS_FIXTURE.orderDetails.status} className="bg-transparent border rounded-lg h-10 px-3 text-base" />
                    </FieldContent>
                  </Field>
                  <Field>
                    <FieldTitle className="text-muted-foreground text-sm font-semibold">Total</FieldTitle>
                    <FieldContent>
                      <Input readOnly value={PAYMENT_SUCCESS_FIXTURE.orderDetails.total} className="bg-transparent border rounded-lg h-10 px-3 text-base" />
                    </FieldContent>
                  </Field>
                </div>
                <DialogFooter className="sm:justify-end gap-3 pt-2">
                  <DialogClose className={buttonVariants({ variant: "outline", size: "lg", className: "px-6 rounded-full font-semibold" })}>
                    Close
                  </DialogClose>
                  <Button type="button" size="lg" className="px-6 rounded-full font-semibold" onClick={() => navigate("/account/orders")}>
                    Back to Order History
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button className="flex-1" variant="outline" size="lg" onClick={() => navigate("/")}>
              Continue Shopping
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
