import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AlertCircle, Lock, Minus, Plus } from "lucide-react";
import { ProductRowsSkeleton } from "@/components/common/PageSkeletons";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api/errors";
import {
  useCart,
  useAcceptCartPrices,
  useRemoveCartItem,
  useUpdateCartItemQuantity,
} from "../cart.queries";
import { CONDITION_LABELS } from "@/features/catalog/catalog.mappers";
import type { CardCondition } from "@/features/catalog/catalog.types";
import type { CartItemResponse } from "../cart.types";

export function CartPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const reorderListingIds = (location.state as { reorderListingIds?: number[] } | undefined)?.reorderListingIds;

  const { data: cart, isLoading, error, refetch } = useCart();
  const updateQuantityMutation = useUpdateCartItemQuantity();
  const removeItemMutation = useRemoveCartItem();
  const acceptPricesMutation = useAcceptCartPrices();

  const [selectedItemIds, setSelectedItemIds] = useState<Set<number>>(new Set());
  const [prevItems, setPrevItems] = useState<CartItemResponse[] | null>(null);

  const items = useMemo(() => cart?.items ?? [], [cart]);

  if (cart && cart.items !== prevItems) {
    setPrevItems(cart.items);
    if (reorderListingIds && reorderListingIds.length > 0) {
      const reorderedSet = new Set(reorderListingIds);
      const matchingIds = cart.items
        .filter((item) => reorderedSet.has(item.listingId))
        .map((item) => item.id);
      setSelectedItemIds(new Set(matchingIds));
    } else {
      setSelectedItemIds(new Set(cart.items.map((item) => item.id)));
    }
  }

  useEffect(() => {
    if (!isLoading && cart && reorderListingIds && reorderListingIds.length > 0) {
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [isLoading, cart, reorderListingIds, navigate, location.pathname]);

  const toggleCheck = (id: number) => {
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const allChecked =
    items.length > 0 && items.every((item) => selectedItemIds.has(item.id));

  const toggleAll = () => {
    if (allChecked) {
      setSelectedItemIds(new Set());
    } else {
      setSelectedItemIds(new Set(items.map((item) => item.id)));
    }
  };

  const handleUpdateQuantity = (itemId: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    updateQuantityMutation.mutate(
      { itemId, data: { quantity: newQuantity } },
      {
        onError: (err) => {
          if (err instanceof ApiError) {
            if (err.status === 409 || err.code === "INSUFFICIENT_STOCK") {
              toast.add({
                title: "Insufficient Stock",
                description: err.message || "Requested quantity exceeds available stock.",
                type: "error",
              });
            } else if (err.code === "CANNOT_BUY_OWN_LISTING") {
              toast.add({
                title: "Cannot Buy Own Listing",
                description: "You cannot purchase your own listing.",
                type: "error",
              });
            } else {
              toast.add({
                title: "Cannot Update Quantity",
                description: err.message,
                type: "error",
              });
            }
          } else {
            toast.add({
              title: "Error",
              description: "Failed to update item quantity",
              type: "error",
            });
          }
        },
      },
    );
  };

  const handleRemoveItem = (itemId: number) => {
    removeItemMutation.mutate(itemId, {
      onSuccess: () => {
        setSelectedItemIds((prev) => {
          const next = new Set(prev);
          next.delete(itemId);
          return next;
        });
        toast.add({
          title: "Item Removed",
          description: "Item has been removed from your cart.",
          type: "info",
        });
      },
      onError: (err) => {
        toast.add({
          title: "Failed to Remove Item",
          description: err instanceof ApiError ? err.message : "Network error",
          type: "error",
        });
      },
    });
  };

  const handleRemoveSelected = async () => {
    const ids = Array.from(selectedItemIds);
    for (const id of ids) {
      try {
        await removeItemMutation.mutateAsync(id);
      } catch {
        // continue with other items
      }
    }
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      for (const id of ids) {
        next.delete(id);
      }
      return next;
    });
    toast.add({
      title: "Selected Items Removed",
      description: "Selected items were removed from your cart.",
      type: "info",
    });
  };

  const checkedItems = useMemo(
    () => items.filter((item) => selectedItemIds.has(item.id)),
    [items, selectedItemIds],
  );

  const changedItems = items.filter((item) => item.priceChanged && item.purchasable);
  const hasSelectedPriceChanges = checkedItems.some((item) => item.priceChanged);
  const hasSelectedUnavailableItems = checkedItems.some((item) => !item.purchasable);
  const checkoutBlocked = hasSelectedPriceChanges || hasSelectedUnavailableItems;
  const handleAcceptPrices = () => {
    acceptPricesMutation.mutate(changedItems.map((item) => item.id), {
      onSuccess: () => {
        toast.add({ title: "ยอมรับราคาใหม่แล้ว", type: "success" });
      },
      onError: (error) => {
        toast.add({
          title: "ยอมรับราคาใหม่ไม่สำเร็จ",
          description: error instanceof ApiError ? error.message : "กรุณาลองอีกครั้ง",
          type: "error",
        });
      },
    });
  };

  const subtotal = useMemo(
    () =>
      checkedItems.reduce(
        (acc, item) => acc + (item.currentPrice ?? item.unitPriceAtAdd) * item.quantity,
        0,
      ),
    [checkedItems],
  );

  // Group checked items by seller to calculate estimated shipping
  const estimatedShipping = useMemo(() => {
    if (checkedItems.length === 0) return 0;
    const sellers = new Set(checkedItems.map((i) => i.sellerProfileId ?? 1));
    return sellers.size * 50;
  }, [checkedItems]);

  const total = subtotal > 0 ? subtotal + estimatedShipping : 0;

  const formatPrice = (price: number) => `฿${price.toLocaleString()}`;

  const handleProceedToCheckout = () => {
    if (checkedItems.length === 0 || checkoutBlocked || isLoading || acceptPricesMutation.isPending) return;
    navigate("/checkout", {
      state: {
        selectedCartItemIds: checkedItems.map((i) => i.id),
      },
    });
  };

  return (
    <div className="bg-muted flex-1 font-sans min-h-screen">
      <main className="max-w-[1200px] w-full mx-auto px-6 py-12 flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-bold text-foreground">Shopping Cart</h1>
          <p className="text-muted-foreground text-lg">
            Review your items and complete your purchase.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-3 p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-xl">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <div className="flex-1 text-sm font-medium">
              {error instanceof ApiError ? error.message : "Failed to load cart."}
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        )}

        {changedItems.length > 0 && (
          <div role="alert" className="flex flex-wrap items-center gap-3 p-4 bg-amber-50 text-amber-900 border border-amber-200 rounded-xl">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <div className="flex-1">
              <p className="font-semibold">ราคาสินค้าบางรายการเปลี่ยนแปลง</p>
              <p className="text-sm">ตรวจสอบราคาเดิม → ราคาใหม่ แล้วกดยอมรับราคาใหม่ หรือยกเลิกเลือกรายการนั้นก่อนสั่งซื้อ</p>
            </div>
            <Button variant="outline" disabled={acceptPricesMutation.isPending} onClick={handleAcceptPrices}>
              {acceptPricesMutation.isPending ? "กำลังยอมรับราคาใหม่..." : "ยอมรับราคาใหม่"}
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left Column: Cart Items */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {/* Select All */}
            <Card className="rounded-xl border shadow-none bg-white p-0 !py-0 gap-0">
              <CardContent className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Checkbox
                    id="select-all"
                    checked={allChecked}
                    onCheckedChange={toggleAll}
                    disabled={items.length === 0}
                  />
                  <label
                    htmlFor="select-all"
                    className="text-base font-medium cursor-pointer text-foreground"
                  >
                    Select All ({items.length} items)
                  </label>
                </div>
                <button
                  className="text-destructive text-sm font-medium hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleRemoveSelected}
                  disabled={checkedItems.length === 0 || removeItemMutation.isPending}
                >
                  Remove Selected
                </button>
              </CardContent>
            </Card>

            {/* Items */}
            {isLoading ? (
              <div role="status" aria-busy="true" aria-label="Loading your cart">
                <ProductRowsSkeleton />
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground bg-white rounded-xl border flex flex-col items-center gap-4">
                <p className="text-lg">Your cart is empty.</p>
                <Button variant="outline" onClick={() => navigate("/products")}>
                  Explore Products
                </Button>
              </div>
            ) : (
              items.map((item) => {
                const isItemChecked = selectedItemIds.has(item.id);
                const displayPrice = item.currentPrice ?? item.unitPriceAtAdd;

                return (
                  <Card
                    key={item.id}
                    className="rounded-xl border shadow-none bg-white p-0 !py-0 gap-0"
                  >
                    <CardContent className="p-6 flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                      <div className="flex items-center gap-4 sm:gap-6 self-start sm:self-auto h-full mt-2 sm:mt-0">
                        <Checkbox
                          aria-label={`เลือก ${item.productName || `Listing #${item.listingId}`}`}
                          checked={isItemChecked}
                          onCheckedChange={() => toggleCheck(item.id)}
                        />
                        <div className="w-24 h-32 bg-[#F9F9F9] border border-border/50 rounded-lg overflow-hidden shrink-0 flex items-center justify-center p-1">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.productName || "Product"}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-xs text-muted-foreground bg-muted/40 rounded">
                              <span>No Image</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex-1 flex flex-col justify-between min-h-32 py-1 w-full">
                        <div className="flex flex-col gap-1">
                          <h3 className="font-bold text-xl text-foreground">
                            {item.productName || `Listing #${item.listingId}`}
                          </h3>
                          <p className="text-muted-foreground text-sm">
                            {item.variantLabel || "Card variant"}
                            {item.condition && (
                              <span>
                                {" • Condition: "}
                                {CONDITION_LABELS[item.condition as CardCondition] ?? item.condition}
                              </span>
                            )}
                          </p>
                          <p className="text-sm mt-1 text-foreground">
                            Seller:{" "}
                            {item.sellerUsername ? (
                              <Link
                                to={`/u/${encodeURIComponent(item.sellerUsername)}`}
                                className="text-primary font-medium hover:underline focus-visible:underline"
                              >
                                {item.sellerName || item.sellerUsername}
                              </Link>
                            ) : (
                              <span className="text-primary font-medium">
                                {item.sellerName || "Pegasus Seller"}
                              </span>
                            )}
                          </p>

                          {item.priceChanged && (
                            <p className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-md border border-amber-200 w-fit mt-1">
                              Price updated: {formatPrice(item.unitPriceAtAdd)} → {item.currentPrice == null ? "ไม่พร้อมจำหน่าย" : formatPrice(item.currentPrice)}
                            </p>
                          )}

                          {!item.purchasable && (
                            <p className="text-xs text-destructive bg-destructive/10 px-2 py-1 rounded-md border border-destructive/20 w-fit mt-1">
                              Listing no longer available
                            </p>
                          )}
                        </div>
                        <button
                          className="text-destructive text-sm font-medium hover:underline text-left w-fit mt-3"
                          onClick={() => handleRemoveItem(item.id)}
                          disabled={removeItemMutation.isPending}
                        >
                          Remove
                        </button>
                      </div>

                      <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:h-32 py-1 w-full sm:w-auto mt-4 sm:mt-0">
                        <div className="text-2xl font-bold text-foreground">
                          {formatPrice(displayPrice)}
                        </div>
                        <div className="flex items-center rounded-full border border-border px-4 py-1.5 gap-4">
                          <button
                            className="text-muted-foreground hover:text-foreground disabled:opacity-50"
                            onClick={() =>
                              handleUpdateQuantity(item.id, item.quantity - 1)
                            }
                            disabled={
                              item.quantity <= 1 || updateQuantityMutation.isPending
                            }
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-4 text-center font-medium">
                            {item.quantity}
                          </span>
                          <button
                            className="text-muted-foreground hover:text-foreground disabled:opacity-50"
                            onClick={() =>
                              handleUpdateQuantity(item.id, item.quantity + 1)
                            }
                            disabled={
                              (item.quantityAvailable !== null &&
                                item.quantity >= item.quantityAvailable) ||
                              updateQuantityMutation.isPending
                            }
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>

          {/* Right Column: Order Summary */}
          <div className="lg:col-span-1">
            <Card className="rounded-xl border shadow-none bg-white p-6 !py-6 flex flex-col gap-6">
              <h2 className="text-2xl font-bold text-foreground">Order Summary</h2>

              <div className="flex flex-col gap-4 text-base">
                <div className="flex items-center justify-between">
                  <span className="text-foreground">
                    Subtotal ({checkedItems.length} items)
                  </span>
                  <span className="font-medium text-foreground">
                    {formatPrice(subtotal)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-foreground">Estimated Shipping</span>
                  <span className="font-medium text-foreground">
                    {subtotal > 0 ? formatPrice(estimatedShipping) : "฿0"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-foreground">Tax</span>
                  <span className="font-medium text-foreground">Included</span>
                </div>
              </div>

              <Separator className="my-2 bg-border/50" />

              <div className="flex items-center justify-between mb-2">
                <span className="text-xl font-bold text-foreground">Total</span>
                <span className="text-4xl font-bold text-primary">
                  {formatPrice(total)}
                </span>
              </div>

              <Button
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-lg py-6 rounded-full shadow-md"
                disabled={checkedItems.length === 0 || isLoading || checkoutBlocked || acceptPricesMutation.isPending}
                aria-describedby={checkoutBlocked ? "checkout-blocked-reason" : undefined}
                onClick={handleProceedToCheckout}
              >
                Proceed to Checkout
              </Button>

              {checkoutBlocked && (
                <div id="checkout-blocked-reason" className="text-sm text-destructive" role="status">
                  {hasSelectedPriceChanges && <p>กรุณายอมรับราคาใหม่ หรือยกเลิกเลือกรายการที่ราคาเปลี่ยนก่อนสั่งซื้อ</p>}
                  {hasSelectedUnavailableItems && <p>กรุณานำสินค้าที่ไม่พร้อมจำหน่ายออก หรือยกเลิกเลือกก่อนสั่งซื้อ</p>}
                </div>
              )}

              <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm font-medium mt-2">
                <Lock className="w-4 h-4" />
                <span>Secure Checkout Guarantee</span>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
