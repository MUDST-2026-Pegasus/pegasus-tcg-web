import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { FormPageSkeleton } from "@/components/common/PageSkeletons";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api/errors";
import { useAuth } from "@/features/auth/auth.queries";
import { useAddresses, addressKeys } from "@/features/account/address.queries";
import { formatAddressLines } from "@/features/account/address.format";
import { useCart, useShippingQuotes, cartKeys } from "../cart.queries";
import { checkoutApi } from "../checkout.api";
import { CheckoutSellerCard } from "../components/CheckoutSellerCard";
import { checkoutMoney } from "../checkout.format";
import { CheckoutAddressPicker } from "../components/CheckoutAddressPicker";
import { CodePickerDialog } from "../components/CodePickerDialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { readPromotionSelection, savePromotionSelection, type PromotionSelection } from "../promotions.types";
import type { CartItemResponse } from "../cart.types";
import "./checkout.css";

interface CheckoutLocationState { selectedCartItemIds?: number[]; }

export function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading: isAuthLoading, user } = useAuth();
  const hasRedirected = useRef(false);
  const completed = useRef(false);
  const submitting = useRef(false);
  const attempt = useRef<{ signature: string; key: string } | null>(null);
  const { data: cart, isLoading: isCartLoading, isFetching: isCartFetching, error: cartError } = useCart();
  const { data: addresses = [], isLoading: isAddressLoading, error: addressError, refetch: refetchAddresses } = useAddresses();

  const targetItemIds = useMemo(() => {
    const params = searchParams.getAll("items");
    const state = location.state as CheckoutLocationState | null;
    const raw = params.length ? params.flatMap((p) => p.split(",").map(Number)) : state?.selectedCartItemIds ?? [];
    return [...new Set(raw.filter((id) => Number.isInteger(id) && id > 0))];
  }, [searchParams, location.state]);
  const targetProductId = Number(searchParams.get("productId"));
  const targetListingId = Number(searchParams.get("listingId"));
  const checkoutItems = useMemo(() => {
    const items = cart?.items ?? [];
    if (targetItemIds.length) return items.filter((item) => targetItemIds.includes(item.id));
    if (targetProductId > 0 && targetListingId > 0) {
      return items.filter((item) => item.productId === targetProductId && item.listingId === targetListingId);
    }
    return [];
  }, [cart, targetItemIds, targetProductId, targetListingId]);
  const hasPriceChanges = checkoutItems.some((item) => item.priceChanged);
  const hasUnavailableItems = checkoutItems.some((item) => !item.purchasable);
  const cartNeedsReview = hasPriceChanges || hasUnavailableItems;
  const cartItemIds = checkoutItems.map((item) => item.id);
  const quotes = useShippingQuotes(cartItemIds, {
    userId: user?.id,
    cartId: cart?.id,
    items: checkoutItems,
    enabled: isAuthenticated && !isAuthLoading && !isCartLoading && !isCartFetching
      && !cartError && !cartNeedsReview && checkoutItems.length > 0,
  });

  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [addressPickerOpen, setAddressPickerOpen] = useState(false);
  const [shippingChoices, setShippingChoices] = useState<Record<number, number>>({});
  const [selectionQuotes, setSelectionQuotes] = useState(quotes.data);
  // Reconcile only fresh quotes: a removed choice must not reappear on a later refresh.
  if (quotes.data !== selectionQuotes && !quotes.isPlaceholderData) {
    setSelectionQuotes(quotes.data);
    const nextChoices: Record<number, number> = {};
    for (const quote of quotes.data ?? []) {
      const selected = quote.options.find((option) => option.id === shippingChoices[quote.sellerProfileId])
        ?? quote.options.find((option) => option.id === quote.defaultOptionId);
      if (selected) nextChoices[quote.sellerProfileId] = selected.id;
    }
    setShippingChoices(nextChoices);
  }
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shippingNotice, setShippingNotice] = useState<string | null>(null);
  const [promotionSelection, setPromotionSelection] = useState<PromotionSelection>(readPromotionSelection);
  const [debouncedSelection, setDebouncedSelection] = useState(promotionSelection);
  const [promotionPicker, setPromotionPicker] = useState<"PLATFORM" | number | null>(null);
  const [typedPlatformCode, setTypedPlatformCode] = useState("");
  const [promotionError, setPromotionError] = useState<string | null>(null);
  const [promotionChanged, setPromotionChanged] = useState<{ previous: number; next: number; code?: string } | null>(null);
  useEffect(() => { savePromotionSelection(promotionSelection); const timer = window.setTimeout(() => setDebouncedSelection(promotionSelection), 180); return () => window.clearTimeout(timer); }, [promotionSelection]);
  const activeAddress = addresses.find((address) => address.id === selectedAddressId)
    ?? addresses.find((address) => address.defaultShipping) ?? addresses[0] ?? null;
  const sellerGroups = useMemo(() => {
    const groups = new Map<number | null, CartItemResponse[]>();
    for (const item of checkoutItems) {
      const group = groups.get(item.sellerProfileId) ?? [];
      group.push(item);
      groups.set(item.sellerProfileId, group);
    }
    return [...groups].map(([sellerId, items]) => ({
      sellerId, items,
      quote: quotes.data?.find((quote) => quote.sellerProfileId === sellerId),
    }));
  }, [checkoutItems, quotes.data]);
  const selectedOptions = sellerGroups.map(({ sellerId, quote }) =>
    quote?.options.find((option) => option.id === (sellerId == null ? undefined : shippingChoices[sellerId]))
    ?? quote?.options.find((option) => option.id === quote.defaultOptionId)
    ?? quote?.options[0]);
  const shippingReady = !quotes.isPending && !quotes.isFetching && !quotes.isPlaceholderData && !quotes.isError
    && sellerGroups.length > 0 && selectedOptions.every(Boolean);
  const shippingFee = selectedOptions.reduce((sum, option) => sum + (option?.fee ?? 0), 0);
  const shippingOptionBySeller: Record<number, number> = {};
  sellerGroups.forEach(({ sellerId }, index) => {
    if (sellerId != null && selectedOptions[index]) shippingOptionBySeller[sellerId] = selectedOptions[index].id;
  });
  const promotionList = useQuery({
    queryKey: ["checkout-promotions", cartItemIds],
    queryFn: () => checkoutApi.getPromotions(cartItemIds),
    enabled: checkoutItems.length > 0 && !cartNeedsReview,
  });
  const promoPreview = useQuery({
    queryKey: ["checkout-promo-preview", cartItemIds, shippingOptionBySeller, debouncedSelection],
    queryFn: ({ signal }) => checkoutApi.previewPromotions({ cartItemIds, shippingOptionBySeller, ...debouncedSelection }, signal),
    enabled: shippingReady && debouncedSelection === promotionSelection,
    retry: false,
  });
  const preview = promoPreview.data;
  const previewReady = !!preview && !promoPreview.isFetching && !promoPreview.isError && debouncedSelection === promotionSelection;
  const appliedPlatformCode = preview?.codes.find((code) => code.ownerType === "PLATFORM" && code.status === "APPLIED")?.code;
  const sellerDiscounts = new Map(preview?.sellers.map((seller) => [seller.sellerProfileId, seller.sellerDiscount]));
  const setCode = (owner: "PLATFORM" | number, code: string | null) => {
    setPromotionError(null);
    setPromotionSelection((previous) => owner === "PLATFORM"
      ? { ...previous, platformCode: code }
      : { ...previous, sellerCodes: { ...previous.sellerCodes, [owner]: code || "" } });
  };
  useEffect(() => {
    if (!preview || !previewReady) return;
    const invalid = preview.codes.find((code) => code.status !== "APPLIED" && !code.pendingShipping);
    if (!invalid) return;
    setPromotionError(`${invalid.code}: ${invalid.status}${invalid.shortfall ? ` · ซื้อเพิ่มอีก ${checkoutMoney(invalid.shortfall)}` : ""}`);
    setPromotionSelection((previous) => invalid.ownerType === "PLATFORM"
      ? { ...previous, platformCode: null }
      : { ...previous, sellerCodes: Object.fromEntries(Object.entries(previous.sellerCodes).filter(([id]) => Number(id) !== invalid.sellerProfileId)) });
  }, [preview, previewReady]);
  const subtotal = sellerGroups.reduce((sum, { items, quote }) =>
    sum + (quote?.itemsSubtotal ?? items.reduce((total, item) => total + (item.currentPrice ?? item.unitPriceAtAdd) * item.quantity, 0)), 0);
  const itemCount = checkoutItems.reduce((sum, item) => sum + item.quantity, 0);
  const canPurchase = shippingReady && previewReady && !!activeAddress && !isAddressLoading && !addressError && !cartError
    && !isCartFetching && !isSubmitting && isAuthenticated && !cartNeedsReview;
  const quotePriceChanged = quotes.error instanceof ApiError
    && (quotes.error.code === "CART_PRICE_CHANGED" || quotes.error.code === "PRICE_CHANGED");

  useEffect(() => {
    if (!isAuthLoading && isAuthenticated && !isCartLoading && !isCartFetching
      && !cartError && (cartNeedsReview || quotePriceChanged)
      && !hasRedirected.current && !completed.current) {
      hasRedirected.current = true;
      if (quotePriceChanged) void queryClient.invalidateQueries({ queryKey: cartKeys.all });
      toast.add({
        title: hasPriceChanges || quotePriceChanged ? "ราคาสินค้ามีการเปลี่ยนแปลง" : "สินค้าบางรายการไม่พร้อมจำหน่าย",
        description: hasPriceChanges || quotePriceChanged
          ? "กรุณากลับไปตรวจสอบและยอมรับราคาใหม่ในตะกร้าก่อนสั่งซื้อ"
          : "กรุณานำสินค้าออกหรือยกเลิกเลือกในตะกร้าก่อนสั่งซื้อ",
        type: "warning",
      });
      navigate("/cart", { replace: true });
    }
  }, [isAuthLoading, isAuthenticated, isCartLoading, isCartFetching, cartError,
    cartNeedsReview, hasPriceChanges, quotePriceChanged, queryClient, navigate]);

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      navigate(`/login?returnTo=${encodeURIComponent(location.pathname + location.search)}`, { replace: true });
    }
  }, [isAuthLoading, isAuthenticated, location.pathname, location.search, navigate]);

  useEffect(() => {
    if (!isAuthLoading && isAuthenticated && !isCartLoading && !isCartFetching
      && !cartError && checkoutItems.length === 0 && !hasRedirected.current && !completed.current) {
      hasRedirected.current = true;
      toast.add({ title: "ไม่พบสินค้าที่เลือกสั่งซื้อ", description: "กรุณาเลือกสินค้าที่ต้องการสั่งซื้อจากตะกร้า", type: "warning" });
      navigate("/cart", { replace: true });
    }
  }, [isAuthLoading, isAuthenticated, isCartLoading, isCartFetching, cartError, checkoutItems.length, navigate]);

  const handlePurchase = async () => {
    if (!canPurchase || submitting.current) return;
    submitting.current = true;
    setIsSubmitting(true);
    const payload = { cartItemIds, shippingAddressId: activeAddress.id, shippingOptionBySeller, ...promotionSelection, expectedGrandTotal: preview!.grandTotal };
    const signature = JSON.stringify(payload);
    // Preserve the key after uncertain network failures so retrying cannot place a duplicate order.
    if (attempt.current?.signature !== signature) attempt.current = { signature, key: crypto.randomUUID() };
    try {
      const response = await checkoutApi.checkout(payload, attempt.current.key);
      completed.current = true;
      toast.add({ title: "สร้างคำสั่งซื้อสำเร็จ", description: `คำสั่งซื้อ ${response.orderNumber}`, type: "success" });
      navigate(`/payment?orderId=${response.orderId}`, { state: { orderId: response.orderId, order: response } });
      void queryClient.invalidateQueries({ queryKey: cartKeys.all });
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status > 0 && error.status < 500) attempt.current = null;
        if (error.code === "SHIPPING_OPTION_INVALID" || error.code === "SELLER_SHIPPING_UNAVAILABLE") {
          const changedSeller = sellerGroups.find((group) => group.sellerId === Number(error.details.sellerProfileId));
          const sellerNames = changedSeller
            ? changedSeller.quote?.sellerName || changedSeller.items[0].sellerName || "ร้านค้า"
            : sellerGroups.map((group) => group.quote?.sellerName || group.items[0].sellerName || "ร้านค้า").join(", ");
          setShippingNotice(error.code === "SHIPPING_OPTION_INVALID" ? sellerNames : null);
          setShippingChoices((previous) => {
            if (changedSeller?.sellerId == null) return {};
            const next = { ...previous };
            delete next[changedSeller.sellerId];
            return next;
          });
          await quotes.refetch();
        } else if (error.code === "PROMO_CHANGED") {
          setPromotionChanged({ previous: payload.expectedGrandTotal, next: Number(error.details.grandTotal) || payload.expectedGrandTotal, code: typeof error.details.code === "string" ? error.details.code : undefined });
          await promoPreview.refetch();
        } else if (error.code === "SHIPPING_ADDRESS_REQUIRED" || error.code === "ADDRESS_NOT_FOUND") {
          setSelectedAddressId(null);
          await queryClient.invalidateQueries({ queryKey: addressKeys.all });
          setAddressPickerOpen(true);
          toast.add({ title: "กรุณาเลือกที่อยู่จัดส่งอีกครั้ง", description: "ที่อยู่เดิมไม่พร้อมใช้งาน", type: "warning" });
        } else if (error.code === "PRICE_CHANGED" || error.code === "CART_PRICE_CHANGED") {
          void queryClient.invalidateQueries({ queryKey: cartKeys.all });
          hasRedirected.current = true;
          toast.add({ title: "ราคาสินค้ามีการเปลี่ยนแปลง", description: "กรุณาตรวจสอบและยอมรับราคาใหม่ในตะกร้าอีกครั้ง", type: "warning" });
          navigate("/cart");
        } else {
          toast.add({ title: error.code === "INSUFFICIENT_STOCK" ? "สินค้าไม่เพียงพอ" : "สั่งซื้อไม่สำเร็จ", description: error.message, type: "error" });
        }
      } else {
        toast.add({ title: "สั่งซื้อไม่สำเร็จ", description: "กรุณาตรวจสอบการเชื่อมต่อและลองอีกครั้ง", type: "error" });
      }
    } finally {
      submitting.current = false;
      setIsSubmitting(false);
    }
  };

  if (isAuthLoading || isCartLoading) {
    return (
      <div className="checkout-page">
        <FormPageSkeleton label="กำลังเตรียมคำสั่งซื้อ" />
      </div>
    );
  }
  if (!isAuthenticated) return null;
  if (cartNeedsReview || quotePriceChanged) return null;
  if (cartError) {
    return <div className="checkout-page"><div role="alert" className="checkout-container checkout-alert checkout-alert-error">โหลดตะกร้าไม่สำเร็จ<Button variant="outline" onClick={() => void queryClient.invalidateQueries({ queryKey: cartKeys.all })}>ลองอีกครั้ง</Button></div></div>;
  }
  if (!checkoutItems.length) {
    return <div className="checkout-page"><div className="checkout-container"><h1>ไม่พบสินค้าที่เลือกสั่งซื้อ</h1><Button onClick={() => navigate("/cart")}>กลับไปยังตะกร้า</Button></div></div>;
  }

  return (
    <div className="checkout-page">
      <div className="checkout-container">
        <header className="mb-6">
          <h1 className="text-[26px] font-bold leading-tight">ตรวจสอบและสั่งซื้อ</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">เลือกวิธีจัดส่งของแต่ละร้าน ค่าส่งคิดแยกตามร้านที่คุณสั่ง</p>
        </header>
        <div className="checkout-columns">
          <div className="flex min-w-0 flex-col gap-4">
            {shippingNotice && <div role="alert" className="checkout-alert checkout-alert-warning">
              <p className="font-semibold">ตัวเลือกการจัดส่งของ {shippingNotice} มีการเปลี่ยนแปลง</p>
              <p>เราเลือกวิธีจัดส่งให้ใหม่แล้ว โปรดตรวจสอบค่าส่งและยอดรวมอีกครั้ง</p>
            </div>}
            {quotes.isError && <div role="alert" className="checkout-alert checkout-alert-error">
              <p className="font-semibold">โหลดตัวเลือกจัดส่งไม่สำเร็จ</p>
              <p>{quotes.error instanceof ApiError ? quotes.error.message : "กรุณาตรวจสอบการเชื่อมต่อและลองอีกครั้ง"}</p>
              <button type="button" className="checkout-link justify-self-start" onClick={() => void quotes.refetch()}>ลองอีกครั้ง</button>
              <button type="button" className="checkout-link justify-self-start" onClick={() => navigate("/cart")}>กลับไปตรวจสอบตะกร้า</button>
            </div>}
            {sellerGroups.map(({ sellerId, items, quote }, index) => <CheckoutSellerCard
              key={sellerId ?? "unknown"}
              sellerId={sellerId}
              sellerName={quote?.sellerName || items[0].sellerName || "ร้านค้า"}
              items={items}
              quote={quote}
              selected={selectedOptions[index]}
              loading={quotes.isPending || quotes.isFetching}
              failed={quotes.isError}
              disabled={isSubmitting}
              onSelect={(id) => { if (sellerId != null) setShippingChoices((previous) => ({ ...previous, [sellerId]: id })); }}
              promotionCode={sellerId == null ? null : promotionSelection.sellerCodes[sellerId]}
              promotionDiscount={sellerId == null ? 0 : sellerDiscounts.get(sellerId) || 0}
              promotionCount={promotionList.data?.filter((promotion) => promotion.sellerProfileId === sellerId && promotion.applicable).length || 0}
              onOpenPromotions={sellerId == null ? undefined : () => setPromotionPicker(sellerId)}
            />)}
          </div>
          <aside className="flex min-w-0 flex-col gap-4" aria-label="สรุปคำสั่งซื้อ">
            <Card className="checkout-panel">
              <div className="flex items-center justify-between gap-3 text-[13px]">
                <h2>ที่อยู่จัดส่ง</h2>
                <button type="button" className="checkout-link" disabled={isSubmitting || !!addressError || isAddressLoading} onClick={() => setAddressPickerOpen(true)}>{activeAddress ? "เปลี่ยน" : "เพิ่มที่อยู่"}</button>
              </div>
              {isAddressLoading ? <div role="status" aria-label="กำลังโหลดที่อยู่จัดส่ง" className="grid gap-2"><div className="checkout-shipping-skeleton" /><div className="checkout-shipping-skeleton" /></div>
                : addressError ? <div role="alert" className="text-xs text-destructive">โหลดที่อยู่ไม่สำเร็จ <button type="button" className="checkout-link" onClick={() => void refetchAddresses()}>ลองอีกครั้ง</button></div>
                : activeAddress ? <div className="text-xs leading-[18px] text-muted-foreground">
                  <p>{activeAddress.recipientName} · {activeAddress.phone}</p>
                  <p>{formatAddressLines(activeAddress).join(" ")}</p>
                </div>
                : <p role="alert" className="text-xs text-destructive">เพิ่มที่อยู่จัดส่งเพื่อดำเนินการต่อ</p>}
            </Card>
            <Card className="checkout-panel">
              <div className="flex items-center justify-between gap-3 text-[13px]">
                <h2>วิธีชำระเงิน</h2><span>โอนผ่าน PromptPay</span>
              </div>
            </Card>
            <Card className="checkout-panel">
              <div className="flex items-center justify-between gap-2"><h2 className="text-[13px] font-semibold">โค้ดส่วนลด Pegasus</h2><button type="button" className="checkout-link text-xs" onClick={() => setPromotionPicker("PLATFORM")}>ดูทั้งหมด ({promotionList.data?.filter((promotion) => promotion.ownerType === "PLATFORM").length || 0})</button></div>
              {promotionSelection.platformCode && <div className="flex items-center justify-between rounded-lg border border-blue-300 bg-blue-50 px-3 py-2 text-xs text-blue-800"><strong>{promotionSelection.platformCode}</strong><span>− {checkoutMoney(preview?.platformDiscountTotal || 0)}</span><button type="button" aria-label="นำโค้ด Pegasus ออก" onClick={() => setCode("PLATFORM", null)}>✕</button></div>}
              <form className="flex gap-2" onSubmit={(event) => { event.preventDefault(); if (typedPlatformCode.trim()) { setCode("PLATFORM", typedPlatformCode.trim().toUpperCase()); setTypedPlatformCode(""); } }}><Input aria-label="กรอกโค้ด Pegasus" value={typedPlatformCode} maxLength={20} onChange={(event) => setTypedPlatformCode(event.target.value)} placeholder="กรอกโค้ดอื่น" /><Button type="submit" variant="secondary">ใช้โค้ด</Button></form>
              {promotionError && <p role="alert" className="text-xs text-destructive">{promotionError}</p>}
            </Card>
            <Card className="checkout-panel">
              <h2 className="text-[15px] font-semibold">สรุปคำสั่งซื้อ</h2>
              <div className="flex items-center justify-between gap-3 text-[13px]">
                <span className="text-muted-foreground">ยอดสินค้า ({itemCount} ใบ)</span><span>{checkoutMoney(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between gap-3 text-[13px]" aria-live="polite">
                <span className="text-muted-foreground">ค่าจัดส่ง</span><span>{shippingReady ? checkoutMoney(shippingFee) : "—"}</span>
              </div>
              <div className="grid gap-1.5 pl-3">
                {sellerGroups.map(({ sellerId, items, quote }, index) => {
                  const option = selectedOptions[index];
                  return <div key={sellerId ?? "unknown"} className="flex items-start justify-between gap-3 text-xs">
                    <span className="min-w-0 text-muted-foreground">{quote?.sellerName || items[0].sellerName || "ร้านค้า"}{option ? ` · ${option.name}` : ""}</span>
                    <span className={`shrink-0 ${option?.free ? "checkout-free" : "text-muted-foreground"}`}>{shippingReady && option ? option.free ? "ส่งฟรี" : checkoutMoney(option.fee) : "—"}</span>
                  </div>;
                })}
              </div>
              {!!preview?.sellerDiscountTotal && <div className="flex justify-between text-[13px] text-teal-700"><span>ส่วนลดร้าน</span><span>− {checkoutMoney(preview.sellerDiscountTotal)}</span></div>}
              {!!preview?.platformDiscountTotal && <div className="flex justify-between text-[13px] text-blue-700"><span>ส่วนลด Pegasus{appliedPlatformCode ? ` · ${appliedPlatformCode}` : ""}</span><span>− {checkoutMoney(preview.platformDiscountTotal)}</span></div>}
              <Separator className="checkout-divider" />
              <div className="flex items-center justify-between gap-3 text-lg" aria-live="polite">
                <span>ยอดรวม</span><strong data-testid="checkout-grand-total">{previewReady ? checkoutMoney(preview.grandTotal) : "—"}</strong>
              </div>
              {!!preview && preview.sellerDiscountTotal + preview.platformDiscountTotal > 0 && <p className="text-right text-xs font-semibold text-teal-700">ประหยัดไป {checkoutMoney(preview.sellerDiscountTotal + preview.platformDiscountTotal)}</p>}
              <Button className="checkout-primary h-11 w-full rounded-full text-sm font-semibold" disabled={!canPurchase} onClick={() => void handlePurchase()}>
                {isSubmitting && <Loader2 className="size-4 animate-spin" />}
                {isSubmitting ? "กำลังสร้างคำสั่งซื้อ..." : "สั่งซื้อและไปชำระเงิน"}
              </Button>
              <p className="text-[11px] leading-relaxed text-muted-foreground">ค่าส่งคิดจากตัวเลือกที่เลือกของแต่ละร้าน และยืนยันอีกครั้งตอนสร้างคำสั่งซื้อ</p>
              {!quotes.isPending && !quotes.isFetching && !quotes.isError && !shippingReady && <button type="button" className="checkout-link text-xs" onClick={() => navigate("/cart")}>กลับไปแก้ไขรายการที่เลือกในตะกร้า</button>}
            </Card>
          </aside>
        </div>
        <CheckoutAddressPicker
          addresses={addresses}
          selectedId={activeAddress?.id ?? null}
          onSelect={setSelectedAddressId}
          open={addressPickerOpen}
          onOpenChange={setAddressPickerOpen}
        />
        <CodePickerDialog open={promotionPicker !== null} onOpenChange={(open) => { if (!open) setPromotionPicker(null); }} owner={promotionPicker ?? "PLATFORM"} sellerName={sellerGroups.find((group) => group.sellerId === promotionPicker)?.quote?.sellerName} promotions={promotionList.data || []} selectedCode={promotionPicker === "PLATFORM" ? promotionSelection.platformCode : promotionPicker == null ? null : promotionSelection.sellerCodes[promotionPicker]} onSelect={(code) => { if (promotionPicker !== null) setCode(promotionPicker, code); }} onTryCode={(code) => { if (promotionPicker !== null) { setCode(promotionPicker, code); setPromotionPicker(null); } }} error={promotionError} />
        <Dialog open={promotionChanged !== null} onOpenChange={(open) => { if (!open) setPromotionChanged(null); }}><DialogContent><DialogHeader><DialogTitle>ยอดชำระเปลี่ยนไป</DialogTitle><DialogDescription>โค้ดหรือยอดส่วนลดเปลี่ยนระหว่างสั่งซื้อ กรุณาตรวจสอบยอดใหม่ก่อนยืนยัน</DialogDescription></DialogHeader><div className="grid gap-2 text-sm"><p>ยอดเดิม: {checkoutMoney(promotionChanged?.previous ?? 0)}</p>{promotionChanged?.code && <p className="text-amber-700">โค้ดที่เปลี่ยน: {promotionChanged.code}</p>}<p>ยอดใหม่: {promoPreview.isFetching ? "กำลังคำนวณ..." : checkoutMoney(preview?.grandTotal ?? promotionChanged?.next ?? 0)}</p>{promotionError && <p className="text-amber-700">{promotionError}</p>}</div><DialogFooter><Button variant="outline" onClick={() => { setPromotionChanged(null); setPromotionPicker("PLATFORM"); }}>เลือกโค้ดอื่น</Button><Button disabled={!previewReady} onClick={() => { setPromotionChanged(null); void handlePurchase(); }}>สั่งซื้อด้วยยอดใหม่</Button></DialogFooter></DialogContent></Dialog>
      </div>
    </div>
  );
}
