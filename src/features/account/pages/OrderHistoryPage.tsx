import { useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ChevronDown,
  ChevronUp,
  CircleCheck,
  Clock,
  Download,
  Loader2,
  Package,
  RotateCcw,
  Truck,
  TriangleAlert,
  X,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { ProductRowsSkeleton } from "@/components/common/PageSkeletons";
import { AccountSidebar } from "@/features/account/components/AccountSidebar";
import { CancelOrderConfirmationDialog } from "@/features/account/components/CancelOrderConfirmationDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { ApiError } from "@/lib/api/errors";
import { OrderRefunds } from "@/features/finance/BuyerRefunds";
import { refundKeys, useBuyerRefunds } from "@/features/finance/refunds.queries";
import { BuyerAfterSales } from "@/features/finance/BuyerAfterSales";
import { useAuth } from "@/features/auth/auth.queries";
import { ordersApi } from "../orders.api";
import { useBuyerOrders } from "../orders.queries";
import type { OrderDetails, OrderItemDetails } from "../orders.types";
import {
  canBuyerCancel,
  confirmableSellerOrders,
  firstTracking,
  formatOrderDateTime,
  nextAutoCompleteAt,
  orderStage,
} from "../order-stage";

import {
  formatOrderStatus,
  getOrderStatusBadge,
  toSidebarUser,
} from "../account.format";

export function OrderHistoryPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const linkedOrderId = Number(searchParams.get("orderId"));
  const linkedOrder = useQuery({
    queryKey: ["orders", linkedOrderId],
    queryFn: () => ordersApi.getOrder(linkedOrderId),
    enabled: Number.isSafeInteger(linkedOrderId) && linkedOrderId > 0,
    retry: false,
  });
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: ordersData, isLoading, error, refetch } = useBuyerOrders();
  const refunds = useBuyerRefunds();

  const [selectedOrderForDetails, setSelectedOrderForDetails] =
    useState<OrderDetails | null>(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [selectedOrderToCancel, setSelectedOrderToCancel] =
    useState<OrderDetails | null>(null);
  const [cancellingOrderId, setCancellingOrderId] = useState<number | null>(null);
  const [confirmingOrderId, setConfirmingOrderId] = useState<number | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<OrderDetails | null>(null);
  const detailOrder = selectedOrderForDetails ?? linkedOrder.data;

  const sidebarUser = toSidebarUser(user);

  const orders: OrderDetails[] = useMemo(() => {
    if (Array.isArray(ordersData)) return ordersData;
    if (ordersData && typeof ordersData === "object") {
      const record = ordersData as Record<string, unknown>;
      if (Array.isArray(record.items)) return record.items as OrderDetails[];
      if (Array.isArray(record.content)) return record.content as OrderDetails[];
      if (typeof record.data === "object" && record.data !== null) {
        const nested = record.data as Record<string, unknown>;
        if (Array.isArray(nested.items)) return nested.items as OrderDetails[];
      }
    }
    return [];
  }, [ordersData]);

  const handleOpenCancelModal = (order: OrderDetails) => {
    setSelectedOrderToCancel(order);
    setIsCancelModalOpen(true);
  };

  const handleConfirmCancelOrder = async () => {
    if (!selectedOrderToCancel) return;
    const orderId = selectedOrderToCancel.id;
    setCancellingOrderId(orderId);
    try {
      await ordersApi.cancelOrder(orderId, "Buyer requested cancellation");
      toast.add({
        title: "Order Cancelled",
        description: "Your order has been cancelled successfully.",
        type: "success",
      });
      setIsCancelModalOpen(false);
      setSelectedOrderToCancel(null);
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      // Cancelling a paid order opens a refund that needs the buyer's bank account.
      queryClient.invalidateQueries({ queryKey: refundKeys.mine });
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

  const handleConfirmReceived = async (orderId: number) => {
    setConfirmingOrderId(orderId);
    try {
      const updated = await ordersApi.confirmReceived(orderId);
      setSelectedOrderForDetails((current) => (current && current.id === orderId ? updated : current));
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.add({ title: "Receipt confirmed", description: "Your order has been updated.", type: "success" });
    } catch (err) {
      toast.add({
        title: "Could not confirm receipt",
        description: err instanceof ApiError ? err.message : "Please try again.",
        type: "error",
      });
    } finally {
      setConfirmingOrderId(null);
    }
  };

  return (
    <div className="min-h-[956px] bg-muted/60 px-4 py-8 font-sans sm:px-6 lg:px-12">
      <div className="mx-auto grid max-w-[1440px] gap-8 lg:grid-cols-[280px_1fr]">
        <AccountSidebar user={sidebarUser} />

        <div className="flex min-w-0 flex-col gap-4">
          {refunds.isError && (
            <p role="alert" className="rounded-xl border bg-white p-3 text-sm text-destructive">
              โหลดข้อมูลการคืนเงินไม่สำเร็จ{" "}
              <Button variant="link" size="sm" className="px-0" onClick={() => void refunds.refetch()}>ลองใหม่</Button>
            </p>
          )}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-foreground">Order History</h1>
            <p className="text-sm text-muted-foreground">
              {orders.length} order{orders.length !== 1 ? "s" : ""} placed
            </p>
          </div>

          {isLoading ? (
            <div role="status" aria-busy="true" aria-label="Loading orders">
              <ProductRowsSkeleton />
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
                onCancelOrder={() => handleOpenCancelModal(order)}
                onConfirmReceived={() => setConfirmTarget(order)}
                isCancelling={cancellingOrderId === order.id}
                isConfirming={confirmingOrderId === order.id}
              />
            ))
          )}
        </div>
      </div>

      {/* Custom Cancel Order Confirmation Dialog */}
      <CancelOrderConfirmationDialog
        open={isCancelModalOpen}
        onOpenChange={(open) => {
          setIsCancelModalOpen(open);
          if (!open) {
            setSelectedOrderToCancel(null);
          }
        }}
        order={selectedOrderToCancel}
        onConfirm={handleConfirmCancelOrder}
        isCancelling={cancellingOrderId === selectedOrderToCancel?.id}
      />

      {/* Order Details Modal */}
      {detailOrder && (
        <OrderDetailsModal
          order={detailOrder}
          open={!!detailOrder}
          onClose={() => {
            setSelectedOrderForDetails(null);
            setSearchParams((current) => {
              current.delete("orderId");
              return current;
            }, { replace: true });
          }}
          onConfirmReceived={() => setConfirmTarget(detailOrder)}
          isConfirming={confirmingOrderId === detailOrder.id}
        />
      )}

      <AlertDialog open={!!confirmTarget} onOpenChange={(open) => !open && setConfirmTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm receipt?</AlertDialogTitle>
            <AlertDialogDescription>
              Confirm that you received the shipped items in this order. This completes their seller orders, adds the cards to your collection and releases payment to the sellers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="border-t pt-4">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              onClick={() => {
                const target = confirmTarget;
                setConfirmTarget(null);
                if (target) void handleConfirmReceived(target.id);
              }}
            >
              Confirm receipt
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function OrderCardItem({
  order,
  onViewDetails,
  onPayNow,
  onCancelOrder,
  onConfirmReceived,
  isCancelling,
  isConfirming,
}: {
  order: OrderDetails;
  onViewDetails: () => void;
  onPayNow: () => void;
  onCancelOrder: () => void;
  onConfirmReceived: () => void;
  isCancelling: boolean;
  isConfirming: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  const { stage, label, badgeClassName } = orderStage(order);
  const canCancel = canBuyerCancel(order);
  const autoCompleteAt = nextAutoCompleteAt(order);
  const tracking = firstTracking(order);
  const cancelReason = (order.sellerOrders ?? []).find((so) => so.cancelReason)?.cancelReason;

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

  const formatPrice = (amount: number) => `฿${amount.toLocaleString()}`;

  return (
    <Card
      data-stage={stage}
      className={cn(
        "gap-0 overflow-hidden rounded-xl border py-0 shadow-none bg-white",
        stage === "AWAITING_PAYMENT" && "border-[#ff95004d]",
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
            variant="secondary"
            className={cn(
              "before:size-1.5 before:rounded-full before:bg-current before:content-[''] font-medium text-xs",
              badgeClassName,
            )}
          >
            {label}
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

          <StageHint
            stage={stage}
            canCancel={canCancel}
            cancellableUntil={order.cancellableUntil ?? null}
            autoCompleteAt={autoCompleteAt}
            tracking={tracking}
            cancelReason={cancelReason ?? null}
          />
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

      <OrderRefunds salesOrderId={order.id} />

      <CardFooter className="flex flex-wrap justify-between gap-3 rounded-none border-t bg-[#faf9fe] px-4 py-3">
        <div>
          {stage === "COMPLETED" && (
            <Button variant="link" size="sm" className="px-0">
              Download Invoice <Download data-icon="inline-end" />
            </Button>
          )}
          {canCancel && (
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
          {stage === "AWAITING_PAYMENT" && (
            <Button size="sm" onClick={onPayNow} className="bg-primary hover:bg-primary/90 text-white">
              Pay Now
            </Button>
          )}
          {stage === "IN_TRANSIT" && (
            <Button size="sm" onClick={onConfirmReceived} disabled={isConfirming}>
              {isConfirming ? "Confirming..." : "Confirm Received"}
            </Button>
          )}
          {stage === "COMPLETED" && (
            <Button size="sm" onClick={onViewDetails}>
              Write a Review
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}

/** One-line status note under the item, telling the buyer what happens next. */
function StageHint({
  stage,
  canCancel,
  cancellableUntil,
  autoCompleteAt,
  tracking,
  cancelReason,
}: {
  stage: ReturnType<typeof orderStage>["stage"];
  canCancel: boolean;
  cancellableUntil: string | null;
  autoCompleteAt: string | null;
  tracking: { carrier: string; trackingNumber: string } | null;
  cancelReason: string | null;
}) {
  const base = "mt-2 flex items-center gap-1 text-xs font-semibold";
  switch (stage) {
    case "AWAITING_PAYMENT":
      return (
        <p className={cn(base, "text-[#ff9500]")}>
          <TriangleAlert className="size-3.5" /> Pay by bank transfer and upload your slip — unpaid orders are cancelled automatically
        </p>
      );
    case "PAYMENT_REVIEW":
      return (
        <p className={cn(base, "text-amber-700")}>
          <Clock className="size-3.5" /> Slip received — we are verifying your payment
        </p>
      );
    case "PREPARING":
      return (
        <p className={cn(base, "text-muted-foreground")}>
          <Package className="size-3.5" /> Seller is preparing your order
          {canCancel && cancellableUntil && ` • Cancel before ${formatOrderDateTime(cancellableUntil)}`}
        </p>
      );
    case "IN_TRANSIT":
      return (
        <div className="mt-3 flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Progress
              value={66}
              className="max-w-64 flex-1 gap-0 [&_[data-slot=progress-track]]:h-1"
            />
            <span className="text-[10px] font-medium text-muted-foreground">
              {tracking ? `${tracking.carrier} ${tracking.trackingNumber}` : "In Transit"}
            </span>
          </div>
          {autoCompleteAt && (
            <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Truck className="size-3" /> Auto-confirms on {formatOrderDateTime(autoCompleteAt)} unless you request a return
            </p>
          )}
        </div>
      );
    case "RETURN_IN_PROGRESS":
      return (
        <p className={cn(base, "text-orange-700")}>
          <RotateCcw className="size-3.5" /> Return in progress — payment to the seller is on hold until it is settled
        </p>
      );
    case "COMPLETED":
      return (
        <p className={cn(base, "text-emerald-700")}>
          <CircleCheck className="size-3.5" /> Delivered — cards added to your collection
        </p>
      );
    case "CANCELLED":
      return cancelReason ? (
        <p className={cn(base, "text-muted-foreground")}>Cancelled: {cancelReason}</p>
      ) : null;
    case "REFUNDED":
      return (
        <p className={cn(base, "text-violet-700")}>
          <RotateCcw className="size-3.5" /> Refund issued — track the transfer in the refund panel below
        </p>
      );
  }
}

function OrderDetailsModal({
  order,
  open,
  onClose,
  onConfirmReceived,
  isConfirming = false,
}: {
  order: OrderDetails;
  open: boolean;
  onClose: () => void;
  onConfirmReceived?: () => void;
  isConfirming?: boolean;
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
  const canConfirmReceived = confirmableSellerOrders(order).length > 0;
  const { label: stageLabel, badgeClassName } = orderStage(order);

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent
          showCloseButton={false}
          className="sm:max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden rounded-2xl gap-0 bg-white shadow-xl"
        >
          {/* Sticky Header with Title, Formatted Status Badge, and Sticky "✕" Close Button */}
          <div className="sticky top-0 z-20 flex items-start justify-between border-b bg-white px-6 py-4 shrink-0">
            <DialogHeader className="gap-0.5">
              <DialogTitle className="text-xl sm:text-2xl font-bold text-foreground">
                Order Details
              </DialogTitle>
              <p className="text-sm text-muted-foreground">
                Order #{order.orderNumber}
              </p>
            </DialogHeader>

            <div className="flex items-center gap-3">
              <Badge
                variant="secondary"
                className={cn("text-sm font-semibold shrink-0", badgeClassName)}
              >
                {stageLabel}
              </Badge>
              <DialogClose
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
                    aria-label="Close"
                  />
                }
              >
                <X className="size-4" />
              </DialogClose>
            </div>
          </div>

          {/* Scrollable Modal Content */}
          <div className="overflow-y-auto px-6 py-5 flex flex-col gap-6 flex-1">
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
                      <Badge
                        variant={getOrderStatusBadge(so.status).variant}
                        className={cn("text-xs font-medium", getOrderStatusBadge(so.status).className)}
                      >
                        Package Status: {formatOrderStatus(so.status)}
                      </Badge>
                      {so.autoCompleteAt && ["SHIPPED", "DELIVERED"].includes(so.status) && (
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          Auto-confirms {formatOrderDateTime(so.autoCompleteAt)}
                        </p>
                      )}
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

                  {so.cancelReason && (
                    <p className="text-xs text-muted-foreground">Cancel reason: {so.cancelReason}</p>
                  )}

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

                  <BuyerAfterSales order={so} />
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

            {canConfirmReceived && (
              <div className="flex justify-end pt-2 border-t">
                <Button onClick={onConfirmReceived} disabled={isConfirming}>
                  {isConfirming ? <Loader2 className="size-4 animate-spin mr-1.5" /> : null}
                  {isConfirming ? "Confirming..." : "Confirm receipt"}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

    </>
  );
}
