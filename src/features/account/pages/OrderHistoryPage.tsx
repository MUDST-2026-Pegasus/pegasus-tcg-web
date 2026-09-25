import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronDown,
  ChevronUp,
  Download,
  Loader2,
  Package,
  TriangleAlert,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { AccountSidebar } from "@/features/account/components/AccountSidebar";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { ApiError } from "@/lib/api/errors";
import { useAuth } from "@/features/auth/auth.queries";
import { ordersApi } from "../orders.api";
import { useBuyerOrders } from "../orders.queries";
import type { OrderDetails, OrderItemDetails } from "../orders.types";

import { toSidebarUser } from "../account.format";

export function OrderHistoryPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: ordersData, isLoading, error, refetch } = useBuyerOrders();

  const [selectedOrderForDetails, setSelectedOrderForDetails] =
    useState<OrderDetails | null>(null);
  const [cancellingOrderId, setCancellingOrderId] = useState<number | null>(null);

  const sidebarUser = toSidebarUser(user);

  const orders: OrderDetails[] = useMemo(() => {
    if (Array.isArray(ordersData)) return ordersData;
    if (ordersData && typeof ordersData === "object") {
      return (
        (ordersData as any).items ??
        (ordersData as any).content ??
        (ordersData as any).data?.items ??
        (ordersData as any).data ??
        []
      );
    }
    return [];
  }, [ordersData]);

  const handleCancelOrder = async (orderId: number) => {
    if (!confirm("Are you sure you want to cancel this order?")) return;
    setCancellingOrderId(orderId);
    try {
      await ordersApi.cancelOrder(orderId, "Buyer requested cancellation");
      toast.add({
        title: "Order Cancelled",
        description: "Your order has been cancelled successfully.",
        type: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    } catch (err) {
      toast.add({
        title: "Cancellation Failed",
        description:
          err instanceof ApiError
            ? err.message
            : "Could not cancel this order. Please try again.",
        type: "error",
      });
    } finally {
      setCancellingOrderId(null);
    }
  };

  return (
    <div className="min-h-[956px] bg-muted/60 px-4 py-8 font-sans sm:px-6 lg:px-12">
      <div className="mx-auto grid max-w-[1440px] gap-8 lg:grid-cols-[280px_1fr]">
        <AccountSidebar user={sidebarUser} />

        <div className="flex min-w-0 flex-col gap-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-foreground">Order History</h1>
            <p className="text-sm text-muted-foreground">
              {orders.length} order{orders.length !== 1 ? "s" : ""} placed
            </p>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 bg-white rounded-xl border gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground font-medium">
                Loading orders...
              </p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border gap-3 p-6">
              <p className="text-sm text-destructive font-medium">
                Failed to load orders.
              </p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Try Again
              </Button>
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border gap-4 text-center p-6">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <p className="text-lg font-semibold text-foreground">No orders yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Once you purchase cards, your orders will appear here.
                </p>
              </div>
              <Button onClick={() => navigate("/products")}>Start Shopping</Button>
            </div>
          ) : (
            orders.map((order) => (
              <OrderCardItem
                key={order.id}
                order={order}
                onViewDetails={() => setSelectedOrderForDetails(order)}
                onPayNow={() => navigate(`/payment?orderId=${order.id}`)}
                onCancelOrder={() => handleCancelOrder(order.id)}
                isCancelling={cancellingOrderId === order.id}
              />
            ))
          )}
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrderForDetails && (
        <OrderDetailsModal
          order={selectedOrderForDetails}
          open={!!selectedOrderForDetails}
          onClose={() => setSelectedOrderForDetails(null)}
        />
      )}
    </div>
  );
}

function OrderCardItem({
  order,
  onViewDetails,
  onPayNow,
  onCancelOrder,
  isCancelling,
}: {
  order: OrderDetails;
  onViewDetails: () => void;
  onPayNow: () => void;
  onCancelOrder: () => void;
  isCancelling: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  const status = order.status;
  const isPending = status === "PENDING_PAYMENT";
  const isPaid = status === "PAID";
  const isShipped = status === "SHIPPED";
  const isCompleted = status === "COMPLETED";
  const isCancelled = status === "CANCELLED";

  const allItems: OrderItemDetails[] = (order.sellerOrders ?? []).flatMap(
    (so) => so.items ?? [],
  );
  const firstItem = allItems[0];
  const otherItems = allItems.slice(1);

  const placedDate = order.placedAt
    ? new Date(order.placedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Recent";

  let statusBadgeVariant: "default" | "secondary" | "destructive" | "outline" =
    "secondary";
  let statusBadgeLabel = status;
  let statusBadgeClass = "";

  if (isPending) {
    statusBadgeVariant = "secondary";
    statusBadgeLabel = "Pending Payment";
    statusBadgeClass = "bg-amber-500 text-white hover:bg-amber-600 border-transparent";
  } else if (isPaid) {
    statusBadgeVariant = "secondary";
    statusBadgeLabel = "Paid";
    statusBadgeClass = "bg-blue-100 text-blue-800 hover:bg-blue-100";
  } else if (isShipped) {
    statusBadgeVariant = "secondary";
    statusBadgeLabel = "Shipped";
    statusBadgeClass = "bg-purple-100 text-purple-800 hover:bg-purple-100";
  } else if (isCompleted) {
    statusBadgeVariant = "secondary";
    statusBadgeLabel = "Completed";
    statusBadgeClass = "bg-emerald-100 text-emerald-800 hover:bg-emerald-100";
  } else if (isCancelled) {
    statusBadgeVariant = "outline";
    statusBadgeLabel = "Cancelled";
    statusBadgeClass = "text-muted-foreground";
  }

  const formatPrice = (amount: number) => `฿${amount.toLocaleString()}`;

  return (
    <Card
      className={cn(
        "gap-0 overflow-hidden rounded-xl border py-0 shadow-none bg-white",
        isPending && "border-[#ff95004d]",
      )}
    >
      <CardHeader className="rounded-none border-b bg-[#faf9fe] px-4 py-3">
        <div className="flex gap-6 items-center">
          <div>
            <p className="text-xs text-muted-foreground font-medium">ORDER ID</p>
            <p className="font-semibold text-sm">{order.orderNumber}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">DATE</p>
            <p className="font-medium text-sm">{placedDate}</p>
          </div>
        </div>
        <CardAction>
          <Badge
            variant={statusBadgeVariant}
            className={cn(
              "before:size-1.5 before:rounded-full before:bg-current before:content-[''] font-medium text-xs",
              statusBadgeClass,
            )}
          >
            {statusBadgeLabel}
          </Badge>
        </CardAction>
      </CardHeader>

      <CardContent className="grid gap-6 p-4 sm:grid-cols-[96px_1fr_auto] sm:items-center">
        <div className="size-24 rounded-lg border bg-[#f4f4f5] overflow-hidden shrink-0 flex items-center justify-center p-1">
          {firstItem?.imageUrl ? (
            <img
              src={firstItem.imageUrl}
              alt={firstItem.productName}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
              Card Art
            </div>
          )}
        </div>

        <div className="min-w-0">
          <CardTitle className="text-lg font-semibold truncate">
            {firstItem?.productName || "Pegasus TCG Card"}
          </CardTitle>
          <p className="mt-1 text-sm text-muted-foreground truncate">
            {[firstItem?.variantLabel, firstItem?.condition]
              .filter(Boolean)
              .join(" • ")}
            {firstItem && ` • Qty: ${firstItem.quantity}`}
          </p>
          {order.sellerOrders?.[0]?.sellerName && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Seller:{" "}
              <span className="text-foreground font-medium">
                {order.sellerOrders[0].sellerName}
              </span>
            </p>
          )}

          {otherItems.length > 0 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-2 flex items-center gap-1 text-sm text-primary font-medium hover:underline cursor-pointer"
            >
              <span>+ {otherItems.length} other item{otherItems.length > 1 ? "s" : ""}</span>
              {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            </button>
          )}

          {isShipped && (
            <div className="mt-3 flex items-center gap-2">
              <Progress
                value={60}
                className="max-w-64 flex-1 gap-0 [&_[data-slot=progress-track]]:h-1"
              />
              <span className="text-[10px] font-medium text-muted-foreground">
                In Transit
              </span>
            </div>
          )}

          {isPending && (
            <p className="mt-2 flex items-center gap-1 text-xs font-semibold text-[#ff9500]">
              <TriangleAlert className="size-3.5" /> Payment due in 24 hours
            </p>
          )}
        </div>

        <div className="sm:text-right">
          <p className="text-xs font-medium text-muted-foreground">Order Total</p>
          <p className="text-2xl font-bold font-heading text-foreground">
            {formatPrice(order.grandTotal)}
          </p>
        </div>
      </CardContent>

      {/* Expanded Items */}
      {expanded && otherItems.length > 0 && (
        <div className="px-4 pb-4 border-t pt-3 flex flex-col gap-3 bg-muted/20">
          {otherItems.map((item) => (
            <div key={item.id} className="flex items-center gap-3">
              <div className="size-12 rounded border bg-[#f4f4f5] overflow-hidden shrink-0 flex items-center justify-center p-0.5">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.productName}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <span className="text-[10px] text-muted-foreground">Card</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.productName}</p>
                <p className="text-xs text-muted-foreground">
                  {[item.variantLabel, item.condition].filter(Boolean).join(" • ")} • Qty: {item.quantity}
                </p>
              </div>
              <div className="text-sm font-semibold">
                {formatPrice(item.lineTotal)}
              </div>
            </div>
          ))}
        </div>
      )}

      <CardFooter className="flex flex-wrap justify-between gap-3 rounded-none border-t bg-[#faf9fe] px-4 py-3">
        <div>
          {isCompleted && (
            <Button variant="link" size="sm" className="px-0">
              Download Invoice <Download data-icon="inline-end" />
            </Button>
          )}
          {isPending && (
            <Button
              variant="destructive"
              size="xs"
              onClick={onCancelOrder}
              disabled={isCancelling}
            >
              {isCancelling ? "Cancelling..." : "Cancel Order"}
            </Button>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <Button variant="outline" size="sm" onClick={onViewDetails}>
            View Details
          </Button>
          {isPending && (
            <Button size="sm" onClick={onPayNow} className="bg-primary hover:bg-primary/90 text-white">
              Pay Now
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}

function OrderDetailsModal({
  order,
  open,
  onClose,
}: {
  order: OrderDetails;
  open: boolean;
  onClose: () => void;
}) {
  const formatPrice = (amount: number) => `฿${amount.toLocaleString()}`;

  // Parse address snapshot if JSON
  let addressText = "Standard Shipping Address";
  if (order.shippingAddressSnapshot) {
    try {
      const snap = JSON.parse(order.shippingAddressSnapshot);
      addressText = [
        snap.recipientName && `${snap.recipientName} (${snap.phone || ""})`,
        snap.line1,
        snap.subdistrict,
        snap.district,
        snap.province,
        snap.postalCode,
      ]
        .filter(Boolean)
        .join(", ");
    } catch {
      addressText = order.shippingAddressSnapshot;
    }
  }

  const sellerOrders = order.sellerOrders ?? [];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto gap-6 p-6 rounded-2xl">
        <DialogHeader>
          <div className="flex justify-between items-start">
            <div>
              <DialogTitle className="text-2xl font-bold">
                Order Details
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Order #{order.orderNumber}
              </p>
            </div>
            <Badge variant="outline" className="text-sm font-semibold">
              {order.status}
            </Badge>
          </div>
        </DialogHeader>

        {/* Shipping Address */}
        <div className="bg-muted/40 p-4 rounded-xl border text-sm">
          <p className="font-semibold text-foreground mb-1">Shipping Destination</p>
          <p className="text-muted-foreground leading-relaxed">{addressText}</p>
        </div>

        {/* Sub-Orders by Seller */}
        <div className="flex flex-col gap-6">
          <h3 className="font-bold text-base text-foreground">Items by Seller</h3>
          {sellerOrders.map((so) => (
            <div key={so.id} className="border rounded-xl p-4 flex flex-col gap-3">
              <div className="flex justify-between items-center text-sm border-b pb-2">
                <div className="flex flex-col">
                  <span className="font-semibold text-foreground">
                    Seller: {so.sellerName || "Pegasus Seller"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Order #{so.sellerOrderNumber}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs bg-muted px-2 py-0.5 rounded font-medium">
                    Package Status: {so.status}
                  </span>
                </div>
              </div>

              {/* Items */}
              <div className="flex flex-col gap-3">
                {(so.items ?? []).map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="size-14 rounded border bg-[#f4f4f5] overflow-hidden shrink-0 flex items-center justify-center p-1">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.productName}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <span className="text-[10px] text-muted-foreground">Art</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {item.productName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {[item.variantLabel, item.condition]
                          .filter(Boolean)
                          .join(" • ")}{" "}
                        • Qty: {item.quantity}
                      </p>
                    </div>
                    <div className="text-sm font-bold text-foreground">
                      {formatPrice(item.lineTotal)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Shipments info if any */}
              {so.shipments && so.shipments.length > 0 && (
                <div className="bg-muted/50 p-2.5 rounded-lg text-xs flex flex-col gap-1 mt-1">
                  {so.shipments.map((ship) => (
                    <div key={ship.id} className="flex justify-between">
                      <span className="font-medium text-foreground">
                        Carrier: {ship.carrierName || ship.carrierCode}
                      </span>
                      <span className="text-muted-foreground">
                        Tracking: {ship.trackingNumber || "Pending"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <Separator />

        {/* Pricing Summary */}
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Items Subtotal</span>
            <span className="font-medium text-foreground">
              {formatPrice(order.itemsSubtotal)}
            </span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Shipping Total</span>
            <span className="font-medium text-foreground">
              {formatPrice(order.shippingTotal)}
            </span>
          </div>
          {order.discountTotal > 0 && (
            <div className="flex justify-between text-emerald-600">
              <span>Discount</span>
              <span>-{formatPrice(order.discountTotal)}</span>
            </div>
          )}
          <Separator className="my-1" />
          <div className="flex justify-between text-base font-bold text-foreground">
            <span>Grand Total</span>
            <span className="text-lg text-primary">
              {formatPrice(order.grandTotal)}
            </span>
          </div>
        </div>

        <DialogFooter className="pt-2">
          <DialogClose
            className={buttonVariants({
              variant: "outline",
              className: "w-full sm:w-auto rounded-full px-6",
            })}
          >
            Close
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
