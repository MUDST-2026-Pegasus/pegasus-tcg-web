import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronRight, Plus, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Field, FieldTitle } from "@/components/ui/field";
import { toast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api/errors";
import { useAuth } from "@/features/auth/auth.queries";
import { useAddresses } from "@/features/account/address.queries";
import { formatAddressLines } from "@/features/account/address.format";
import { AddressFormDialog } from "@/features/account/components/AddressFormDialog";
import type { Address } from "@/features/account/address.types";
import { useCart, cartKeys } from "../cart.queries";
import { checkoutApi } from "../checkout.api";

export function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

  const selectedCartItemIds = (location.state as { selectedCartItemIds?: number[] })
    ?.selectedCartItemIds;

  // Protect checkout: must be authenticated
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      navigate("/login?returnTo=/checkout", { replace: true });
    }
  }, [isAuthenticated, isAuthLoading, navigate]);

  const { data: cart, isLoading: isCartLoading } = useCart();
  const { data: addresses = [], isLoading: isAddressLoading } = useAddresses();

  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<string | null>("qr");

  const [isShippingOpen, setIsShippingOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isNewAddressOpen, setIsNewAddressOpen] = useState(false);

  const [tempAddressId, setTempAddressId] = useState<string | null>(null);
  const [tempPayment, setTempPayment] = useState<string | null>("qr");

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter items to checkout
  const checkoutItems = useMemo(() => {
    const items = cart?.items ?? [];
    if (!selectedCartItemIds || selectedCartItemIds.length === 0) {
      return items;
    }
    const idSet = new Set(selectedCartItemIds);
    return items.filter((item) => idSet.has(item.id));
  }, [cart, selectedCartItemIds]);

  // Set default address when addresses load
  useEffect(() => {
    if (addresses.length > 0 && !selectedAddress) {
      const defaultAddr =
        addresses.find((a) => a.defaultShipping) || addresses[0];
      setSelectedAddress(defaultAddr);
      setTempAddressId(defaultAddr.id.toString());
    }
  }, [addresses, selectedAddress]);

  const handleShippingOpenChange = (open: boolean) => {
    if (open) {
      setTempAddressId(selectedAddress ? selectedAddress.id.toString() : null);
    }
    setIsShippingOpen(open);
  };

  const handlePaymentOpenChange = (open: boolean) => {
    if (open) setTempPayment(selectedPayment);
    setIsPaymentOpen(open);
  };

  const subtotal = useMemo(
    () =>
      checkoutItems.reduce(
        (acc, item) => acc + (item.currentPrice ?? item.unitPriceAtAdd) * item.quantity,
        0,
      ),
    [checkoutItems],
  );

  const shippingFee = useMemo(() => {
    if (checkoutItems.length === 0) return 0;
    const sellers = new Set(checkoutItems.map((i) => i.sellerProfileId ?? 1));
    return sellers.size * 50;
  }, [checkoutItems]);

  const grandTotal = subtotal + shippingFee;

  const formatPrice = (price: number) => `฿${price.toLocaleString()}`;

  const handlePurchase = async () => {
    if (!selectedAddress || !selectedPayment || checkoutItems.length === 0) {
      toast.add({
        title: "Incomplete Details",
        description: "Please select a shipping address and payment method.",
        type: "warning",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await checkoutApi.checkout({
        shippingAddressId: selectedAddress.id,
        cartItemIds: selectedCartItemIds && selectedCartItemIds.length > 0
          ? selectedCartItemIds
          : undefined,
      });

      queryClient.invalidateQueries({ queryKey: cartKeys.all });

      toast.add({
        title: "Order Placed",
        description: `Order ${response.orderNumber} placed successfully.`,
        type: "success",
      });

      navigate("/payment", {
        state: {
          orderId: response.orderId,
          order: response,
        },
      });
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409 || err.code === "INSUFFICIENT_STOCK") {
          toast.add({
            title: "Insufficient Stock",
            description: err.message || "One or more items in your cart are out of stock.",
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
            title: "Purchase Failed",
            description: err.message,
            type: "error",
          });
        }
      } else {
        toast.add({
          title: "Error",
          description: "An unexpected error occurred during checkout.",
          type: "error",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const firstItem = checkoutItems[0];
  const moreItemCount = checkoutItems.length - 1;

  if (isAuthLoading || isCartLoading || isAddressLoading) {
    return (
      <div className="min-h-screen bg-muted flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm font-medium">Preparing checkout...</p>
      </div>
    );
  }

  if (checkoutItems.length === 0) {
    return (
      <div className="min-h-screen bg-muted py-16 px-4 flex flex-col items-center">
        <Card className="max-w-md w-full p-8 text-center flex flex-col items-center gap-4 bg-white rounded-xl">
          <h2 className="text-xl font-bold">No Items to Checkout</h2>
          <p className="text-sm text-muted-foreground">Your selected checkout items are empty.</p>
          <Button onClick={() => navigate("/cart")}>Return to Cart</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted py-10 px-4 flex flex-col items-center">
      <div className="text-center mb-6 flex flex-col gap-1">
        <h1 className="text-xl sm:text-2xl font-bold font-heading text-foreground">
          Review & Purchase
        </h1>
        <p className="text-muted-foreground text-sm">
          Please review your order details below.
        </p>
      </div>

      <div className="w-full max-w-[600px] flex flex-col gap-6">
        <Card className="rounded-xl border-0 shadow-[0_2px_8px_rgb(0,0,0,0.04)] bg-white overflow-hidden">
          <CardContent className="p-0">
            {/* Item Section */}
            <div className="p-6 flex items-center gap-4">
              <div className="w-[84px] h-[104px] bg-[#f4f4f5] flex items-center justify-center shrink-0 rounded-md border border-border/50 overflow-hidden p-1">
                {firstItem?.imageUrl ? (
                  <img
                    src={firstItem.imageUrl}
                    alt={firstItem.productName || "Product"}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-[52px] h-[72px] bg-gradient-to-b from-orange-400 to-yellow-300 border-[3px] border-white shadow-sm flex flex-col">
                    <div className="h-1/2 bg-white/20"></div>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-1 flex-1 min-w-0">
                <h2 className="font-semibold text-sm sm:text-base leading-snug text-foreground truncate">
                  {firstItem?.productName || `Listing #${firstItem?.listingId}`}
                </h2>
                <p className="text-primary font-medium text-sm mt-1">
                  {formatPrice(firstItem ? (firstItem.currentPrice ?? firstItem.unitPriceAtAdd) : 0)}
                  <span className="text-muted-foreground font-normal">
                    {" "}/ {firstItem?.condition || "Near Mint"}
                  </span>
                  {firstItem && firstItem.quantity > 1 && (
                    <span className="text-muted-foreground font-normal">
                      {" "}× {firstItem.quantity}
                    </span>
                  )}
                </p>
                {moreItemCount > 0 && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    + {moreItemCount} other item{moreItemCount > 1 ? "s" : ""}
                  </p>
                )}
              </div>
            </div>

            <Separator />

            {/* Shipping Address */}
            <Dialog open={isShippingOpen} onOpenChange={handleShippingOpenChange}>
              <DialogTrigger className="flex justify-between items-center w-full px-6 py-4 cursor-pointer group hover:bg-muted/30 transition-colors bg-transparent border-0 outline-none text-left">
                <span className="font-medium text-sm text-foreground">
                  Shipping Address
                </span>
                <div className="flex items-center text-muted-foreground group-hover:text-foreground transition-colors text-sm max-w-[320px]">
                  <span className="truncate">
                    {selectedAddress
                      ? formatAddressLines(selectedAddress).join(", ")
                      : "please enter your address"}
                  </span>
                  <ChevronRight className="w-4 h-4 ml-1 opacity-70 shrink-0" />
                </div>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md gap-6 rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-base">
                    Select address{" "}
                    <span className="text-xs text-muted-foreground font-normal">
                      {addresses.length} of 10
                    </span>
                  </DialogTitle>
                </DialogHeader>
                <div className="py-2 max-h-[360px] overflow-y-auto">
                  {addresses.length === 0 ? (
                    <div className="flex flex-col items-center py-6 gap-6">
                      <p className="text-sm text-muted-foreground">
                        You don't have any addresses yet.
                      </p>
                      <button
                        onClick={() => setIsNewAddressOpen(true)}
                        className="w-full border border-dashed border-border rounded-xl p-4 text-foreground font-medium flex items-center justify-center gap-2 hover:bg-muted/50 transition-colors text-sm"
                      >
                        <Plus className="w-4 h-4 text-primary" /> Add New Address
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <RadioGroup
                        value={tempAddressId || ""}
                        onValueChange={setTempAddressId}
                        className="gap-3"
                      >
                        {addresses.map((addr) => {
                          const formatted = formatAddressLines(addr).join(", ");
                          return (
                            <Field
                              key={addr.id}
                              orientation="horizontal"
                              className="items-center justify-between rounded-xl border p-4 cursor-pointer hover:bg-muted/50 transition-colors gap-3"
                              onClick={() => setTempAddressId(addr.id.toString())}
                            >
                              <div className="flex flex-col min-w-0 pr-2">
                                <span className="font-medium text-sm text-foreground">
                                  {addr.recipientName} ({addr.phone})
                                </span>
                                <FieldTitle className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                                  {formatted}
                                </FieldTitle>
                              </div>
                              <RadioGroupItem value={addr.id.toString()} />
                            </Field>
                          );
                        })}
                      </RadioGroup>
                      {addresses.length < 10 && (
                        <button
                          onClick={() => setIsNewAddressOpen(true)}
                          className="w-full border border-dashed border-border rounded-xl p-3 text-foreground font-medium flex items-center justify-center gap-2 hover:bg-muted/50 transition-colors text-sm mt-2"
                        >
                          <Plus className="w-4 h-4 text-primary" /> Add New Address
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <DialogFooter className="sm:justify-end">
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto rounded-full px-8 border-gray-300"
                    onClick={() => {
                      if (tempAddressId) {
                        const found = addresses.find(
                          (a) => a.id.toString() === tempAddressId,
                        );
                        if (found) setSelectedAddress(found);
                      }
                      setIsShippingOpen(false);
                    }}
                  >
                    Confirm
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Separator />

            {/* Payment Method */}
            <Dialog open={isPaymentOpen} onOpenChange={handlePaymentOpenChange}>
              <DialogTrigger className="flex justify-between items-center w-full px-6 py-4 cursor-pointer group hover:bg-muted/30 transition-colors bg-transparent border-0 outline-none text-left">
                <span className="font-medium text-sm text-foreground">
                  Payment Method
                </span>
                <div className="flex items-center text-muted-foreground group-hover:text-foreground transition-colors text-sm">
                  <span>
                    {selectedPayment === "qr" ? "Qr Payment" : "Not Selected"}
                  </span>
                  <ChevronRight className="w-4 h-4 ml-1 opacity-70" />
                </div>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md gap-6 rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="text-base">
                    Select a payment method
                  </DialogTitle>
                </DialogHeader>
                <div className="py-2">
                  <RadioGroup
                    value={tempPayment || ""}
                    onValueChange={setTempPayment}
                    className="gap-3"
                  >
                    <Field
                      orientation="horizontal"
                      className="items-center justify-between rounded-xl border p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => setTempPayment("qr")}
                    >
                      <div className="flex items-center gap-3">
                        <div className="bg-black text-white text-[10px] font-bold w-9 h-6 flex items-center justify-center rounded uppercase">
                          QR
                        </div>
                        <FieldTitle className="font-medium text-sm">
                          Qr Payment
                        </FieldTitle>
                      </div>
                      <RadioGroupItem value="qr" />
                    </Field>
                  </RadioGroup>
                </div>
                <div className="mt-2">
                  <Button
                    className="w-full rounded-full bg-primary hover:bg-primary/90 text-white font-medium"
                    onClick={() => {
                      if (tempPayment) {
                        setSelectedPayment(tempPayment);
                        setIsPaymentOpen(false);
                      }
                    }}
                  >
                    CONFIRM
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Separator />

            {/* Breakdown Section */}
            <div className="px-6 py-5 flex flex-col gap-3 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Shipping Fee</span>
                <span>{formatPrice(shippingFee)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Purchase Fee</span>
                <span>฿0</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Authentication Fee</span>
                <span>฿0</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Duty & Taxes</span>
                <span>Included</span>
              </div>
            </div>

            <Separator />

            {/* Total Section */}
            <div className="px-6 py-5 flex justify-between items-center">
              <span className="font-bold text-lg text-foreground">Total</span>
              <span className="font-bold text-[28px] font-heading text-foreground">
                {formatPrice(grandTotal)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Button
          disabled={!selectedAddress || !selectedPayment || isSubmitting}
          className="w-full h-[52px] rounded-xl text-base font-semibold disabled:bg-[#e4e4e7] disabled:text-[#a1a1aa] disabled:opacity-100 transition-colors bg-primary hover:bg-primary/90 text-white"
          onClick={handlePurchase}
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Processing...</span>
            </div>
          ) : (
            "Purchase"
          )}
        </Button>
      </div>

      {/* Address Form Dialog */}
      <AddressFormDialog
        open={isNewAddressOpen}
        onOpenChange={setIsNewAddressOpen}
      />
    </div>
  );
}
