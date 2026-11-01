import { useState, useMemo, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ChevronDown,
  ChevronUp,
  CircleCheck,
  Clock,
  Download,
  Package,
  RotateCcw,
  RotateCw,
  Truck,
  TriangleAlert,
} from "lucide-react";
import { useQueries, useQuery, useQueryClient } from "@tanstack/react-query";

import { ProductRowsSkeleton } from "@/components/common/PageSkeletons";
import { AccountSidebar } from "@/features/account/components/AccountSidebar";
import { CancelOrderConfirmationDialog } from "@/features/account/components/CancelOrderConfirmationDialog";
import { ReorderPreviewModal } from "@/features/account/components/ReorderPreviewModal";
import { OrderDetailsModal } from "@/features/account/components/OrderDetailsModal";
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
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { ApiError } from "@/lib/api/errors";
import { OrderRefunds } from "@/features/finance/BuyerRefunds";
import { refundKeys, useBuyerRefunds } from "@/features/finance/refunds.queries";
import { reviewKeys } from "@/features/finance/reviews.queries";
import { afterSalesApi } from "@/features/finance/after-sales.api";
import { useAuth } from "@/features/auth/auth.queries";
import { ordersApi } from "../orders.api";
import { useBuyerOrders } from "../orders.queries";
import type { OrderDetails, OrderItemDetails } from "../orders.types";
import {
  canBuyerCancel,
  firstTracking,
  formatOrderDateTime,
  nextAutoCompleteAt,
  orderStage,
} from "../order-stage";

import {
  toSidebarUser,
} from "../account.format";
import {
  ORDER_FILTER_TABS,
  matchesOrderFilter,
  type OrderFilterTab,
} from "../order-filter";

export { OrderDetailsModal };

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

  const scrollPosRef = useRef(0);
  const [selectedOrderForDetails, setSelectedOrderForDetails] =
    useState<OrderDetails | null>(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [selectedOrderToCancel, setSelectedOrderToCancel] =
    useState<OrderDetails | null>(null);
  const [cancellingOrderId, setCancellingOrderId] = useState<number | null>(null);
  const [confirmingOrderId, setConfirmingOrderId] = useState<number | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<OrderDetails | null>(null);
  const [activeFilter, setActiveFilter] = useState<OrderFilterTab>("ALL");
  const [reorderOrderId, setReorderOrderId] = useState<number | null>(null);
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

  const tabCounts = useMemo(() => {
    const counts: Record<OrderFilterTab, number> = {
      ALL: orders.length,
      PENDING: 0,
      PREPARING: 0,
      IN_TRANSIT: 0,
      COMPLETED: 0,
      RETURN_REFUND: 0,
      CANCELLED: 0,
    };
    for (const order of orders) {
      const { stage } = orderStage(order);
      if (stage === "AWAITING_PAYMENT" || stage === "PAYMENT_REVIEW") {
        counts.PENDING++;
      } else if (stage === "PREPARING") {
        counts.PREPARING++;
      } else if (stage === "IN_TRANSIT") {
        counts.IN_TRANSIT++;
      } else if (stage === "COMPLETED") {
        counts.COMPLETED++;
      } else if (stage === "RETURN_IN_PROGRESS" || stage === "REFUNDED") {
        counts.RETURN_REFUND++;
      } else if (stage === "CANCELLED") {
        counts.CANCELLED++;
      }
    }
    return counts;
  }, [orders]);

  const filteredOrders = useMemo(() => {
    if (activeFilter === "ALL") return orders;
    return orders.filter((order) => matchesOrderFilter(order, activeFilter));
  }, [orders, activeFilter]);

  const handleOpenCancelModal = (order: OrderDetails) => {
    setSelectedOrderToCancel(order);
    setIsCancelModalOpen(true);
  };

  const handleOpenDetails = (order: OrderDetails) => {
    scrollPosRef.current =
      window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
    setSelectedOrderForDetails(order);
  };

  const handleCloseDetails = () => {
    const savedY = scrollPosRef.current;
    setSelectedOrderForDetails(null);
    if (searchParams.has("orderId")) {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);
          next.delete("orderId");
          return next;
        },
        { replace: true, preventScrollReset: true },
      );
    }
    const restoreScroll = () => {
      window.scrollTo({ top: savedY, behavior: "instant" });
    };
    requestAnimationFrame(restoreScroll);
    setTimeout(restoreScroll, 0);
    setTimeout(restoreScroll, 50);
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

          {/* Status Filter Tab Bar */}
          <div
            role="tablist"
            aria-label="Order status filter"
            className="flex flex-wrap items-center gap-2 pb-1"
          >
            {ORDER_FILTER_TABS.map((tab) => {
              const isActive = activeFilter === tab.key;
              const count = tabCounts[tab.key] ?? 0;
              return (
                <button
                  key={tab.key}
                  role="tab"
                  type="button"
                  aria-selected={isActive}
                  onClick={() => setActiveFilter(tab.key)}
                  className={cn(
                    "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors cursor-pointer select-none shrink-0 whitespace-nowrap",
                    isActive
                      ? "bg-[#006699] text-white shadow-sm font-semibold"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <span>{tab.label}</span>
                  <span
                    className={cn(
                      "min-w-5 rounded-full px-2 py-0.5 text-xs font-semibold text-center leading-none",
                      isActive
                        ? "bg-[#004e75] text-white"
                        : "bg-slate-100 text-slate-600"
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
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
          ) : filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border gap-3 text-center p-6">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <p className="text-base font-semibold text-foreground">No orders found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  There are no orders matching the selected status.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setActiveFilter("ALL")}>
                View all orders
              </Button>
            </div>
          ) : (
            filteredOrders.map((order) => (
              <OrderCardItem
                key={order.id}
                order={order}
                onViewDetails={() => handleOpenDetails(order)}
                onReorder={() => setReorderOrderId(order.id)}
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
          onClose={handleCloseDetails}
          onReorder={(order) => {
            setReorderOrderId(order.id);
          }}
          onConfirmReceived={() => setConfirmTarget(detailOrder)}
          isConfirming={confirmingOrderId === detailOrder.id}
        />
      )}

      {/* Reorder Preview Modal */}
      {Boolean(reorderOrderId) && (
        <ReorderPreviewModal
          isOpen={Boolean(reorderOrderId)}
          onClose={() => setReorderOrderId(null)}
          orderId={reorderOrderId}
          order={orders.find((o) => o.id === reorderOrderId) ?? null}
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
              type="button"
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
  onReorder,
  onPayNow,
  onCancelOrder,
  onConfirmReceived,
  isCancelling,
  isConfirming,
}: {
  order: OrderDetails;
  onViewDetails: () => void;
  onReorder: () => void;
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
  // Only completed parcels can be reviewed, once each: a refunded or cancelled seller
  // in the same order, or one already reviewed, must not keep the button up.
  const reviewable = stage === "COMPLETED"
    ? (order.sellerOrders ?? []).filter((so) => so.status === "COMPLETED")
    : [];
  const myReviews = useQueries({
    queries: reviewable.map((so) => ({
      queryKey: reviewKeys.mine(so.id),
      queryFn: () => afterSalesApi.myReview(so.id),
    })),
  });
  const canReview = myReviews.some((review) => review.isSuccess && !review.data);

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
              type="button"
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
            <Button type="button" variant="link" size="sm" className="px-0">
              Download Invoice <Download data-icon="inline-end" />
            </Button>
          )}
          {canCancel && (
            <Button
              type="button"
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
          <Button type="button" variant="outline" size="sm" onClick={onViewDetails} className="rounded-full">
            View Details
          </Button>
          {stage === "COMPLETED" && (
            <Button
              type="button"
              size="sm"
              onClick={onReorder}
              className="bg-[#006699] hover:bg-[#005580] text-white px-4 py-2 rounded-full font-medium text-sm flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <RotateCw className="size-3.5" />
              Reorder
            </Button>
          )}
          {stage === "AWAITING_PAYMENT" && (
            <Button type="button" size="sm" onClick={onPayNow} className="bg-primary hover:bg-primary/90 text-white rounded-full">
              Pay Now
            </Button>
          )}
          {stage === "IN_TRANSIT" && (
            <Button type="button" size="sm" onClick={onConfirmReceived} disabled={isConfirming} className="rounded-full">
              {isConfirming ? "Confirming..." : "Confirm Received"}
            </Button>
          )}
          {canReview && (
            <Button type="button" size="sm" onClick={onViewDetails} className="rounded-full">
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
