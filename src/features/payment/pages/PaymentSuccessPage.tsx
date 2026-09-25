import { useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Check, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Field, FieldTitle, FieldContent } from "@/components/ui/field";
import { ordersApi } from "@/features/account/orders.api";
import type { OrderDetails } from "@/features/account/orders.types";

export function PaymentSuccessPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const stateData = location.state as {
    orderId?: number;
    order?: OrderDetails;
  } | null;

  const orderId =
    stateData?.orderId ||
    (searchParams.get("orderId") ? Number(searchParams.get("orderId")) : null);

  const [order, setOrder] = useState<OrderDetails | null>(
    (stateData?.order as OrderDetails) || null,
  );
  const [isLoading, setIsLoading] = useState(!stateData?.order && !!orderId);

  useEffect(() => {
    if (!order && orderId) {
      setIsLoading(true);
      ordersApi
        .getOrder(orderId)
        .then((res) => setOrder(res))
        .catch(() => undefined)
        .finally(() => setIsLoading(false));
    }
  }, [order, orderId]);

  const orderNumber = order?.orderNumber || (orderId ? `#ORD-${orderId}` : "#ORD-99521");
  const grandTotal = order?.grandTotal ?? 0;
  const formatPrice = (amount: number) => `THB ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const sellerOrders = order?.sellerOrders ?? [];
  const allItems = sellerOrders.flatMap((so) => so.items ?? []);
  const firstItem = allItems[0];
  const itemsText =
    allItems.length === 1
      ? `${firstItem?.productName || "TCG Card"} × ${firstItem?.quantity || 1}`
      : allItems.length > 1
        ? `${firstItem?.productName || "TCG Item"} + ${allItems.length - 1} more items`
        : "TCG Items";

  const orderDate = order?.paidAt || order?.placedAt
    ? new Date(order.paidAt || order.placedAt).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : new Date().toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

  const displayStatus =
    order?.status === "PAID"
      ? "Paid"
      : order?.status === "COMPLETED"
        ? "Completed"
        : order?.status === "PENDING_PAYMENT"
          ? "Pending Payment"
          : order?.status || "Paid";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm font-medium">Verifying payment status...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16 flex justify-center items-center">
      <Card className="w-full max-w-lg border-t-4 border-t-primary shadow-sm bg-white rounded-2xl">
        <CardHeader className="flex flex-col items-center text-center gap-4 pt-8">
          <h2 className="text-xl font-black tracking-wider text-muted-foreground">
            PEGASUS
          </h2>

          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground">
              <Check className="w-6 h-6 stroke-[3]" />
            </div>
          </div>

          <div className="flex flex-col gap-1 mt-2">
            <h1 className="text-3xl font-bold text-foreground">Payment Successful</h1>
            <p className="text-muted-foreground font-medium">
              Order Number: {orderNumber}
            </p>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-6 mt-4 pb-8">
          <div className="bg-muted/50 rounded-xl p-6 flex flex-col gap-4 border">
            <h3 className="font-semibold text-lg mb-2 text-foreground">
              Transaction Summary
            </h3>

            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Date</span>
              <span className="font-medium text-foreground">{orderDate}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Payment Method</span>
              <span className="font-medium text-foreground">QR</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Items</span>
              <span className="font-medium text-foreground truncate max-w-[260px]">
                {itemsText}
              </span>
            </div>

            <Separator className="my-2" />

            <div className="flex justify-between items-center">
              <span className="font-semibold text-foreground">Total Amount</span>
              <span className="font-bold text-xl text-primary font-heading">
                {formatPrice(grandTotal)}
              </span>
            </div>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Thank you for using Pegasus TCG
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mt-2">
            <Dialog>
              <DialogTrigger
                className={buttonVariants({
                  size: "lg",
                  className: "flex-1 rounded-full font-semibold",
                })}
              >
                View Order Details
              </DialogTrigger>
              <DialogContent className="sm:max-w-md p-8 gap-6 rounded-2xl">
                <DialogHeader className="gap-2">
                  <DialogTitle className="text-2xl font-bold">
                    Order Details
                  </DialogTitle>
                  <DialogDescription className="text-base text-muted-foreground">
                    Order {orderNumber}
                  </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-5">
                  <Field>
                    <FieldTitle className="text-muted-foreground text-sm font-semibold">
                      Product
                    </FieldTitle>
                    <FieldContent>
                      <Input
                        readOnly
                        value={itemsText}
                        className="bg-transparent border rounded-lg h-10 px-3 text-base"
                      />
                    </FieldContent>
                  </Field>
                  <Field>
                    <FieldTitle className="text-muted-foreground text-sm font-semibold">
                      Status
                    </FieldTitle>
                    <FieldContent>
                      <Input
                        readOnly
                        value={displayStatus}
                        className="bg-transparent border rounded-lg h-10 px-3 text-base"
                      />
                    </FieldContent>
                  </Field>
                  <Field>
                    <FieldTitle className="text-muted-foreground text-sm font-semibold">
                      Total
                    </FieldTitle>
                    <FieldContent>
                      <Input
                        readOnly
                        value={formatPrice(grandTotal)}
                        className="bg-transparent border rounded-lg h-10 px-3 text-base"
                      />
                    </FieldContent>
                  </Field>
                </div>
                <DialogFooter className="sm:justify-end gap-3 pt-2">
                  <DialogClose
                    className={buttonVariants({
                      variant: "outline",
                      size: "lg",
                      className: "px-6 rounded-full font-semibold border-gray-300",
                    })}
                  >
                    Close
                  </DialogClose>
                  <Button
                    type="button"
                    size="lg"
                    className="px-6 rounded-full font-semibold bg-primary hover:bg-primary/90 text-white"
                    onClick={() => navigate("/account/orders")}
                  >
                    Back to Order History
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button
              className="flex-1 rounded-full font-semibold"
              variant="outline"
              size="lg"
              onClick={() => navigate("/")}
            >
              Continue Shopping
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
