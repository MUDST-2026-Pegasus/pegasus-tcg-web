import { translate, useLanguage } from "@/lib/language";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { ProductRowsSkeleton } from "@/components/common/PageSkeletons";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/toast";
import { useAuth } from "@/features/auth/auth.queries";
import { PromotionCodeForm } from "@/features/promotions/PromotionCodeForm";
import { ApiError } from "@/lib/api/errors";
import {
  useCart,
  useAcceptCartPrices,
  useRemoveCartItem,
  useUpdateCartItemQuantity,
} from "../cart.queries";
import { codeHint } from "../cart.format";
import type { CartItemResponse } from "../cart.types";
import { formatSaleBaht } from "@/components/sale";
import { CartPriceChangedDialog } from "@/features/sale/components/SaleBuyerDialogs";
import { cartSaleTotals, cartUnitPrice, saleEndedInCart } from "@/features/sale/sale.cart";
import { checkoutMoney } from "../checkout.format";
import { AppliedCodeBox, AutoPickedNote, DroppedCodeNotice, PickCodeRow } from "../components/CartCodeRows";
import { CartCodePicker } from "../components/CartCodePicker";
import { CartSellerGroup } from "../components/CartSellerGroup";
import { useCartPromotions, type PromotionOwnerKey } from "../useCartPromotions";

type SellerGroup = {
  sellerId: number | null;
  name: string;
  username: string | null;
  items: CartItemResponse[];
};

const lineTotal = (item: CartItemResponse) => (item.currentPrice ?? item.unitPriceAtAdd) * item.quantity;

function groupBySeller(items: CartItemResponse[]): SellerGroup[] {
  const groups = new Map<string, SellerGroup>();
  for (const item of items) {
    const key = String(item.sellerProfileId ?? "none");
    const group = groups.get(key) ?? {
      sellerId: item.sellerProfileId,
      name: item.sellerName || item.sellerUsername || translate("ผู้ขาย Pegasus", "Pegasus Seller"),
      username: item.sellerUsername ?? null,
      items: [],
    };
    group.items.push(item);
    groups.set(key, group);
  }
  return [...groups.values()];
}

export function CartPage() {
  useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const reorderListingIds = (location.state as { reorderListingIds?: number[] } | undefined)?.reorderListingIds;
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const isGuest = !authLoading && !isAuthenticated;

  const { data: cart, isLoading, error, refetch } = useCart();
  const updateQuantityMutation = useUpdateCartItemQuantity();
  const removeItemMutation = useRemoveCartItem();
  const acceptPricesMutation = useAcceptCartPrices();

  const [selectedItemIds, setSelectedItemIds] = useState<Set<number>>(new Set());
  const [prevItems, setPrevItems] = useState<CartItemResponse[] | null>(null);
  const [guestDraft, setGuestDraft] = useState("");

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

  const setChecked = (ids: number[], checked: boolean) => {
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      for (const id of ids) {
        if (checked) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  };

  const allChecked =
    items.length > 0 && items.every((item) => selectedItemIds.has(item.id));

  const handleUpdateQuantity = (itemId: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    updateQuantityMutation.mutate(
      { itemId, data: { quantity: newQuantity } },
      {
        onError: (err) => {
          if (err instanceof ApiError && (err.status === 409 || err.code === "INSUFFICIENT_STOCK")) {
            toast.add({
              title: translate("สินค้าเหลือไม่พอ", "Not enough stock"),
              description: err.message || translate("จำนวนที่เลือกเกินกว่าสินค้าที่มี", "The selected quantity exceeds available stock"),
              type: "error",
            });
          } else if (err instanceof ApiError && err.code === "CANNOT_BUY_OWN_LISTING") {
            toast.add({ title: translate("ไม่สามารถซื้อสินค้าของตัวเองได้", "You cannot buy your own items"), type: "error" });
          } else {
            toast.add({
              title: translate("ปรับจำนวนไม่สำเร็จ", "Could not update quantity"),
              description: err instanceof ApiError ? err.message : translate("กรุณาลองอีกครั้ง", "Please try again"),
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
        setChecked([itemId], false);
        toast.add({ title: translate("นำสินค้าออกจากตะกร้าแล้ว", "Item removed from cart"), type: "info" });
      },
      onError: (err) => {
        toast.add({
          title: translate("นำสินค้าออกไม่สำเร็จ", "Could not remove item"),
          description: err instanceof ApiError ? err.message : translate("เครือข่ายขัดข้อง", "Network error"),
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
    setChecked(ids, false);
    toast.add({ title: translate("ลบสินค้าที่เลือกแล้ว", "Selected items removed"), type: "info" });
  };

  const checkedItems = useMemo(
    () => items.filter((item) => selectedItemIds.has(item.id)),
    [items, selectedItemIds],
  );
  const groups = useMemo(() => groupBySeller(items), [items]);

  const changedItems = items.filter((item) => item.priceChanged && item.purchasable);
  const hasSelectedPriceChanges = checkedItems.some((item) => item.priceChanged);
  const hasSelectedUnavailableItems = checkedItems.some((item) => !item.purchasable);
  const checkoutBlocked = hasSelectedPriceChanges || hasSelectedUnavailableItems;
  // modal "ราคาสินค้าบางรายการเปลี่ยน" (Figma SAL-M1 Buyer) — เฉพาะราคาที่เปลี่ยนเพราะราคาลดจบ
  // การเปลี่ยนราคาทั่วไปใช้แถบเตือนเดิม (TCG-513)
  const saleEndedItems = changedItems.filter(saleEndedInCart);
  const changedKey = saleEndedItems.map((item) => `${item.id}:${item.currentPrice}`).join(",");
  const [dismissedChange, setDismissedChange] = useState("");
  const priceDialogOpen = saleEndedItems.length > 0 && dismissedChange !== changedKey;
  const handleRemoveChanged = () => {
    for (const item of saleEndedItems) handleRemoveItem(item.id);
    setDismissedChange(changedKey);
  };
  // แถว "ราคาสินค้า (ก่อนลด)" / "ส่วนลดราคาสินค้า" (Figma SAL-B3 C) — ตัวเลขจาก pricing ของ API
  const saleTotals = cartSaleTotals(checkedItems);

  const handleAcceptPrices = () => {
    acceptPricesMutation.mutate(changedItems.map((item) => item.id), {
      onSuccess: () => {
        setDismissedChange(changedKey);
        toast.add({ title: translate("ยอมรับราคาใหม่แล้ว", "New prices accepted"), type: "success" });
      },
      onError: (error) => {
        toast.add({
          title: translate("ยอมรับราคาใหม่ไม่สำเร็จ", "Could not accept new prices"),
          description: error instanceof ApiError ? error.message : translate("กรุณาลองอีกครั้ง", "Please try again"),
          type: "error",
        });
      },
    });
  };

  // The auto-pick toast offers "เปลี่ยน"; the picker lives in the hook below.
  const openPickerRef = useRef<(owner: PromotionOwnerKey) => void>(() => {});
  const handleAutoPicked = useCallback((saving: number) => {
    toast.add({
      type: "info",
      title: translate(`เลือกโค้ดที่ลดมากที่สุดให้แล้ว${saving > 0 ? ` (– ${checkoutMoney(saving)})` : ""}`, `The best discount code has been selected${saving > 0 ? ` (– ${checkoutMoney(saving)})` : ""}`),
      actionProps: { children: translate("เปลี่ยน", "Change"), onClick: () => openPickerRef.current("PLATFORM") },
    });
  }, []);

  const promotions = useCartPromotions({
    items: checkedItems,
    enabled: !isLoading && !authLoading && !checkoutBlocked,
    userId: user?.id,
    cartId: cart?.id,
    onAutoPicked: handleAutoPicked,
  });
  useEffect(() => {
    openPickerRef.current = promotions.setPicker;
  });

  const preview = checkedItems.length ? promotions.preview : undefined;
  const localSubtotal = checkedItems.reduce((sum, item) => sum + lineTotal(item), 0);
  const itemsSubtotal = preview?.itemsSubtotal ?? localSubtotal;
  const sellerDiscountTotal = preview?.sellerDiscountTotal ?? 0;
  const platformDiscountTotal = preview?.platformDiscountTotal ?? 0;
  const saving = sellerDiscountTotal + platformDiscountTotal;
  const total = Math.max(0, itemsSubtotal - saving);
  const checkedQuantity = checkedItems.reduce((sum, item) => sum + item.quantity, 0);

  const promotionsFor = (owner: PromotionOwnerKey) =>
    (promotions.promotionList.data ?? []).filter((promotion) =>
      owner === "PLATFORM" ? promotion.ownerType === "PLATFORM" : promotion.sellerProfileId === owner);
  const findPromotion = (owner: PromotionOwnerKey, code: string) =>
    promotionsFor(owner).find((promotion) => promotion.code === code);

  const codeRow = (owner: PromotionOwnerKey, label: string) => {
    const notice = promotions.notices[String(owner)];
    const row = codeControl(owner, label);
    // C2-E sits where the code was; the row stays under it so another code can be picked.
    return notice ? <div className="grid gap-2"><DroppedCodeNotice message={notice} />{row}</div> : row;
  };

  const codeControl = (owner: PromotionOwnerKey, label: string) => {
    const applied = promotions.appliedCode(owner);
    if (applied) {
      return (
        <AppliedCodeBox
          owner={owner === "PLATFORM" ? "PLATFORM" : "SELLER"}
          code={applied.code}
          promotion={findPromotion(owner, applied.code)}
          discount={applied.discount}
          pendingShipping={applied.pendingShipping}
          claimed={promotions.claimedCodes.has(applied.code)}
          onChange={() => promotions.setPicker(owner)}
        />
      );
    }
    return <PickCodeRow label={label} hint={codeHint(promotionsFor(owner))} onOpen={() => promotions.setPicker(owner)} />;
  };

  const pickerGroup = typeof promotions.picker === "number"
    ? groups.find((group) => group.sellerId === promotions.picker)
    : undefined;
  const platformApplied = promotions.appliedCode("PLATFORM");
  const claimedCount = (promotions.promotionList.data ?? []).filter((p) => p.source === "CLAIMED").length;

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
      <main className="mx-auto flex w-full max-w-[1072px] flex-col gap-6 px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-[28px] font-bold text-foreground">{translate("ตะกร้าสินค้า", "Shopping cart")}</h1>
          <p className="text-sm text-muted-foreground">
            {translate("เลือกสินค้าและโค้ดส่วนลด แล้วไปเลือกการจัดส่งในหน้าถัดไป", "Select items and discount codes, then choose shipping on the next page")}</p>
        </div>

        {error && (
          <div className="flex items-center gap-3 p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-xl">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <div className="flex-1 text-sm font-medium">
              {error instanceof ApiError ? error.message : translate("โหลดตะกร้าไม่สำเร็จ", "Could not load cart")}
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              {translate("ลองใหม่", "Try again")}</Button>
          </div>
        )}

        {changedItems.length > 0 && (
          <div role="alert" className="flex flex-wrap items-center gap-3 p-4 bg-amber-50 text-amber-900 border border-amber-200 rounded-xl">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <div className="flex-1">
              <p className="font-semibold">{translate("ราคาสินค้าบางรายการเปลี่ยนแปลง", "Some item prices have changed")}</p>
              <p className="text-sm">{translate("ตรวจสอบราคาเดิม → ราคาใหม่ แล้วกดยอมรับราคาใหม่ หรือยกเลิกเลือกรายการนั้นก่อนสั่งซื้อ", "Review the old and new prices, then accept the new price or deselect the item before ordering")}</p>
            </div>
            <Button variant="outline" disabled={acceptPricesMutation.isPending} onClick={handleAcceptPrices}>
              {acceptPricesMutation.isPending ? translate("กำลังยอมรับราคาใหม่...", "Accepting new prices…") : translate("ยอมรับราคาใหม่", "Accept new prices")}
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="flex flex-col gap-4">
            <Card className="flex-row items-center justify-between rounded-xl px-5 py-3.5 shadow-none">
              <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-foreground">
                <Checkbox
                  checked={allChecked}
                  onCheckedChange={() => setSelectedItemIds(allChecked ? new Set() : new Set(items.map((item) => item.id)))}
                  disabled={items.length === 0}
                />
                {translate("เลือกทั้งหมด (", "Select all (")}{items.length} {translate("รายการ)", "items)")}</label>
              <button
                type="button"
                className="text-sm font-medium text-destructive hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                onClick={handleRemoveSelected}
                disabled={checkedItems.length === 0 || removeItemMutation.isPending}
              >
                {translate("ลบที่เลือก", "Remove selected")}</button>
            </Card>

            {isLoading ? (
              <div role="status" aria-busy="true" aria-label={translate("กำลังโหลดตะกร้า", "Loading cart")}>
                <ProductRowsSkeleton />
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center gap-4 rounded-xl border bg-card py-16 text-center text-muted-foreground">
                <p className="text-lg">{translate("ยังไม่มีสินค้าในตะกร้า", "Your cart is empty")}</p>
                <Button variant="outline" onClick={() => navigate("/products")}>
                  {translate("เลือกซื้อสินค้า", "Browse products")}</Button>
              </div>
            ) : (
              groups.map((group) => {
                const checked = group.items.filter((item) => selectedItemIds.has(item.id));
                const sellerSubtotal = checked.reduce((sum, item) => sum + lineTotal(item), 0);
                const discount = group.sellerId != null && checked.length ? promotions.sellerDiscount(group.sellerId) : 0;
                return (
                  <CartSellerGroup
                    key={group.sellerId ?? "none"}
                    sellerName={group.name}
                    sellerUsername={group.username}
                    items={group.items}
                    selectedIds={selectedItemIds}
                    onToggleItem={toggleCheck}
                    onToggleSeller={(value) => setChecked(group.items.map((item) => item.id), value)}
                    onQuantity={handleUpdateQuantity}
                    onRemove={handleRemoveItem}
                    quantityBusy={updateQuantityMutation.isPending}
                    removeBusy={removeItemMutation.isPending}
                    codeSlot={group.sellerId != null && checked.length > 0 && !checkoutBlocked
                      ? codeRow(group.sellerId, translate("โค้ดร้าน", "Shop coupon"))
                      : null}
                    subtotal={Math.max(0, sellerSubtotal - discount)}
                  />
                );
              })
            )}
          </div>

          <div className="flex flex-col gap-4 lg:sticky lg:top-28">
            <Card className="gap-3 rounded-xl p-5 shadow-none">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground">{translate("โค้ดส่วนลด Pegasus", "Pegasus coupons")}</h2>
                {!isGuest && (
                  <Link to="/account/coupons" className="text-xs font-medium text-primary hover:underline">
                    {translate("โค้ดของฉัน", "My coupons")}{claimedCount ? ` (${claimedCount})` : ""}
                  </Link>
                )}
              </div>
              {isGuest && (
                <div className="flex items-center justify-between gap-2 rounded-lg bg-primary/5 px-3 py-2.5 text-xs">
                  <span className="text-foreground/80">{translate("เข้าสู่ระบบเพื่อใช้โค้ดที่เก็บไว้", "Log in to use your saved coupons")}</span>
                  <Link to="/login?next=%2Fcart" className="shrink-0 font-semibold text-primary hover:underline">{translate("เข้าสู่ระบบ", "Log in")}</Link>
                </div>
              )}
              {checkedItems.length === 0 || checkoutBlocked ? (
                <p className="text-xs text-muted-foreground">{translate("เลือกสินค้าก่อน แล้วจึงเลือกโค้ด", "Select items before choosing a coupon")}</p>
              ) : isGuest && !platformApplied && !promotions.notices.PLATFORM ? (
                <>
                  <PromotionCodeForm
                    id="cart-guest-code"
                    label={translate("กรอกโค้ดอื่นที่ไม่ได้เก็บไว้", "Enter another unsaved code")}
                    placeholder={translate("กรอกโค้ดอื่นที่ไม่ได้เก็บไว้", "Enter another unsaved code")}
                    showLabel={false}
                    value={guestDraft}
                    onChange={setGuestDraft}
                    onSubmit={() => promotions.tryCode("PLATFORM", guestDraft)}
                    error={promotions.typedError?.owner === "PLATFORM" ? promotions.typedError.message : null}
                    loading={promotions.checking}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    {translate("พิมพ์โค้ดเพื่อดูส่วนลดได้ แต่ต้องเข้าสู่ระบบตอนไปชำระเงิน", "Enter a code to preview the discount. Sign in when you are ready to pay")}</p>
                </>
              ) : (
                <>
                  {codeRow("PLATFORM", translate("เลือกโค้ดส่วนลด", "Select a discount code"))}
                  {promotions.autoPicked && platformApplied && <AutoPickedNote />}
                </>
              )}
            </Card>

            <Card className="gap-0 rounded-xl p-5 shadow-none">
              <h2 className="mb-4 text-base font-bold text-foreground">{translate("สรุปคำสั่งซื้อ", "Order summary")}</h2>
              <dl className="grid gap-2.5 text-sm">
                {saleTotals.saleDiscount > 0 && (
                  <>
                    <div className="flex justify-between">
                      <dt>{translate("ราคาสินค้า (ก่อนลด)", "Items before discount")}</dt>
                      <dd>{formatSaleBaht(saleTotals.listTotal)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt>{translate("ส่วนลดราคาสินค้า", "Item discount")}</dt>
                      <dd className="text-[#dc2626]">−{formatSaleBaht(saleTotals.saleDiscount)}</dd>
                    </div>
                  </>
                )}
                <div className="flex justify-between">
                  <dt>{translate("ยอดสินค้า (", "Items (")}{checkedQuantity}  {translate("ใบ)", "cards)")}</dt>
                  <dd>{checkoutMoney(itemsSubtotal)}</dd>
                </div>
                {sellerDiscountTotal > 0 && (
                  <>
                    <div className="flex justify-between">
                      <dt>{translate("ส่วนลดร้าน", "Shop discount")}</dt>
                      <dd className="text-emerald-700">– {checkoutMoney(sellerDiscountTotal)}</dd>
                    </div>
                    {preview?.sellers.filter((seller) => seller.sellerDiscount > 0).map((seller) => (
                      <div key={seller.sellerProfileId} className="flex justify-between pl-3 text-xs text-muted-foreground">
                        <dt>{[promotions.selection.sellerCodes[seller.sellerProfileId], seller.sellerName].filter(Boolean).join(" · ")}</dt>
                        <dd>– {checkoutMoney(seller.sellerDiscount)}</dd>
                      </div>
                    ))}
                  </>
                )}
                {platformDiscountTotal > 0 && (
                  <div className="flex justify-between">
                    <dt>{translate("ส่วนลด Pegasus", "Pegasus discount")}{platformApplied ? ` · ${platformApplied.code}` : ""}</dt>
                    <dd className="text-primary">– {checkoutMoney(platformDiscountTotal)}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt>{translate("ค่าจัดส่ง", "Shipping")}</dt>
                  <dd className="text-muted-foreground">{translate("คิดในหน้าถัดไป", "Calculated on the next page")}</dd>
                </div>
              </dl>

              <Separator className="my-4" />

              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">{translate("ยอดรวม (ยังไม่รวมค่าส่ง)", "Total excluding shipping")}</span>
                <strong className="text-2xl font-black text-foreground" aria-label={translate("ยอดรวม", "Total")}>{checkoutMoney(total)}</strong>
              </div>
              {saving > 0 && (
                <p className="mt-1 text-right text-xs font-semibold text-emerald-700">{translate("ประหยัดไป", "You saved")} {checkoutMoney(saving)}</p>
              )}

              <Button
                className="mt-4 h-12 w-full rounded-full text-base font-semibold"
                disabled={checkedItems.length === 0 || isLoading || checkoutBlocked || acceptPricesMutation.isPending}
                aria-describedby={checkoutBlocked ? "checkout-blocked-reason" : undefined}
                onClick={handleProceedToCheckout}
              >
                {translate("ไปชำระเงิน (", "Checkout (")}{checkedQuantity})
              </Button>

              {checkoutBlocked && (
                <div id="checkout-blocked-reason" className="mt-3 text-sm text-destructive" role="status">
                  {hasSelectedPriceChanges && <p>{translate("กรุณายอมรับราคาใหม่ หรือยกเลิกเลือกรายการที่ราคาเปลี่ยนก่อนสั่งซื้อ", "Accept the new prices or deselect the affected items before ordering")}</p>}
                  {hasSelectedUnavailableItems && <p>{translate("กรุณานำสินค้าที่ไม่พร้อมจำหน่ายออก หรือยกเลิกเลือกก่อนสั่งซื้อ", "Remove or deselect unavailable items before ordering")}</p>}
                </div>
              )}

              <p className="mt-3 text-[11px] text-muted-foreground">
                {translate("ส่วนลดคิดจากสินค้าที่เลือก ยืนยันอีกครั้งหลังเลือกการจัดส่ง", "Discounts apply to selected items and are confirmed after shipping is selected")}</p>
            </Card>
          </div>
        </div>
      </main>

      <CartPriceChangedDialog
        open={priceDialogOpen}
        items={saleEndedItems.map((item) => ({
          id: item.id,
          name: item.productName || translate(`ประกาศ #${item.listingId}`, `Listing #${item.listingId}`),
          from: item.unitPriceAtAdd,
          to: item.currentPrice,
        }))}
        newTotal={items.reduce((sum, item) => sum + cartUnitPrice(item) * item.quantity, 0)}
        pending={acceptPricesMutation.isPending || removeItemMutation.isPending}
        onRemove={handleRemoveChanged}
        onAccept={handleAcceptPrices}
        onClose={() => setDismissedChange(changedKey)}
      />

      <CartCodePicker
        promotions={promotions}
        sellerName={pickerGroup?.name}
        sellerUsername={pickerGroup?.username}
        isGuest={isGuest}
      />
    </div>
  );
}
