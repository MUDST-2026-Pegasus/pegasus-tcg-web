import { translate, useLanguage } from "@/lib/language";
import { useEffect, useRef, useState } from "react";
import { Lock, TicketPercent } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

import { FormPageSkeleton } from "@/components/common/PageSkeletons";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api/errors";
import { useAuth } from "@/features/auth/auth.queries";
import { addressKeys, useAddresses } from "@/features/account/address.queries";
import { CHECKOUT_CARD_CLASS } from "@/features/cart/checkout.styles";
import { checkoutMoney } from "@/features/cart/checkout.format";
import { CheckoutAddressPicker } from "@/features/cart/components/CheckoutAddressPicker";
import { CheckoutAddressSummary } from "@/features/cart/components/CheckoutAddressSummary";

import { useCheckoutAuction, useMyAuctions } from "../auction.queries";
import { AuctionCountdown } from "./AuctionCountdown";
import { AuctionOrderBadge } from "./AuctionOrderBadge";

/** ไปหน้าชำระเงินเดิม พร้อมเลขประมูลให้หน้านั้นแสดงป้าย */
function paymentUrl(orderId: number, auctionNumber: string) {
  return `/payment?orderId=${orderId}&auction=${encodeURIComponent(auctionNumber)}`;
}

/**
 * หน้า checkout เดิมในโหมดประมูล (`/checkout?auction={id}`) [TCG-631 · FE-5]
 * การ์ดใบเดียว ราคาล็อก แก้จำนวน/ลบไม่ได้ · ไม่มีโค้ดส่วนลด · ค่าส่งตามค่าเริ่มต้นของร้าน
 * นับเวลาชำระจากกำหนดที่ได้ตอนปิดประมูล · สร้างคำสั่งซื้อผ่าน `POST /auctions/:id/checkout`
 */
export function AuctionCheckout({ auctionId }: { auctionId: number }) {
  useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  // แถวที่ต้องชำระมีไม่กี่ใบ หน้าแรกของแท็บ "ต้องชำระ" พอ
  const toPay = useMyAuctions("TO_PAY");
  const auction = toPay.data?.page.items.find((a) => a.id === auctionId) ?? null;
  const { data: addresses = [], isLoading: isAddressLoading, error: addressError, refetch: refetchAddresses } = useAddresses();
  const checkout = useCheckoutAuction(auctionId);

  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [addressPickerOpen, setAddressPickerOpen] = useState(false);
  // กดซ้ำด้วยที่อยู่เดิมใช้ key เดิม → ได้คำสั่งซื้อเดิม ไม่ใช่สองใบ
  const attempt = useRef<{ addressId: number; key: string } | null>(null);

  const activeAddress =
    addresses.find((a) => a.id === selectedAddressId) ?? addresses.find((a) => a.defaultShipping) ?? addresses[0] ?? null;

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      navigate(`/login?returnTo=${encodeURIComponent(location.pathname + location.search)}`, { replace: true });
    }
  }, [isAuthLoading, isAuthenticated, location.pathname, location.search, navigate]);

  // กด checkout ไปแล้ว — ไปหน้าชำระเงินของคำสั่งซื้อเดิม
  const existingOrderId = auction?.orderId ?? null;
  useEffect(() => {
    if (auction && existingOrderId) navigate(paymentUrl(existingOrderId, auction.auctionNumber), { replace: true });
  }, [auction, existingOrderId, navigate]);

  if (isAuthLoading || toPay.isLoading) {
    return (
      <div className="checkout-page">
        <FormPageSkeleton label={translate("กำลังเตรียมคำสั่งซื้อ", "Preparing order")} />
      </div>
    );
  }
  if (!isAuthenticated) return null;
  if (!auction) {
    return (
      <div className="checkout-page">
        <div className="checkout-container">
          <h1 className="text-xl font-bold">{translate("ไม่พบสินค้าที่เลือกสั่งซื้อ", "The selected item was not found")}</h1>
          <Button onClick={() => navigate("/account/auctions")} className="mt-4">{translate("การประมูลของฉัน", "My auctions")}</Button>
        </div>
      </div>
    );
  }

  const total = auction.totalDue ?? auction.currentPrice + auction.shippingFee;
  const canPurchase = !!activeAddress && !isAddressLoading && !addressError && !checkout.isPending && !existingOrderId;

  const handlePurchase = () => {
    if (!canPurchase || !activeAddress) return;
    if (attempt.current?.addressId !== activeAddress.id) {
      attempt.current = { addressId: activeAddress.id, key: crypto.randomUUID() };
    }
    checkout.mutate(
      {
        payload: { shippingAddressId: activeAddress.id, shippingOptionId: null, buyerNote: null, expectedGrandTotal: total },
        idempotencyKey: attempt.current.key,
      },
      {
        onSuccess: (response) => {
          toast.add({ title: translate("สร้างคำสั่งซื้อสำเร็จ", "Order created"), description: translate(`คำสั่งซื้อ ${response.orderNumber}`, `Order ${response.orderNumber}`), type: "success" });
          navigate(paymentUrl(response.orderId, auction.auctionNumber), {
            state: { orderId: response.orderId, order: response },
          });
        },
        onError: handleError,
      },
    );
  };

  const handleError = (error: Error) => {
    if (!(error instanceof ApiError)) {
      toast.add({ title: translate("สั่งซื้อไม่สำเร็จ", "Unable to place order"), description: translate("กรุณาตรวจสอบการเชื่อมต่อและลองอีกครั้ง", "Please check your connection and try again"), type: "error" });
      return;
    }
    if (error.status > 0 && error.status < 500) attempt.current = null;
    if (error.code === "SHIPPING_ADDRESS_REQUIRED" || error.code === "ADDRESS_NOT_FOUND" || error.code === "NO_SHIPPING_ADDRESS") {
      setSelectedAddressId(null);
      void queryClient.invalidateQueries({ queryKey: addressKeys.all });
      setAddressPickerOpen(true);
      toast.add({ title: translate("กรุณาเลือกที่อยู่จัดส่งอีกครั้ง", "Please select a shipping address again"), description: translate("ที่อยู่เดิมไม่พร้อมใช้งาน", "The previous address is unavailable"), type: "warning" });
      return;
    }
    if (error.code === "AUCTION_CLOSED") {
      // เลยกำหนดชำระแล้ว — กลับไปดูสถานะในหน้าการประมูลของฉัน
      toast.add({ title: translate("สั่งซื้อไม่สำเร็จ", "Unable to place order"), description: error.message, type: "error" });
      navigate("/account/auctions", { replace: true });
      return;
    }
    if (error.code === "CART_PRICE_CHANGED" || error.code === "PRICE_CHANGED") {
      void toPay.refetch();
    }
    toast.add({ title: translate("สั่งซื้อไม่สำเร็จ", "Unable to place order"), description: error.message, type: "error" });
  };

  const { item } = auction;

  return (
    <div className="checkout-page">
      <div className="checkout-container">
        <header className="mb-6">
          <h1 className="text-[26px] leading-tight font-bold">{translate("ตรวจสอบและสั่งซื้อ", "Review and place order")}</h1>
        </header>

        <div className="checkout-columns">
          <div className="flex min-w-0 flex-col gap-4">
            <Card className={CHECKOUT_CARD_CLASS}>
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-[15px] font-semibold">{auction.shopName}</h2>
                <AuctionOrderBadge auctionNumber={auction.auctionNumber} />
              </div>
              <div className="flex items-center gap-3">
                <div className="checkout-item-thumb">
                  {item.card.officialImageUrl ? (
                    <img src={item.card.officialImageUrl} alt={item.card.productName} className="size-full object-cover" />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{item.card.productName}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {item.condition} · {item.setName} · x1
                  </p>
                </div>
                <span className="flex shrink-0 items-center gap-1 text-sm font-semibold tabular-nums">
                  <Lock aria-hidden className="size-3.5 text-muted-foreground" />
                  {checkoutMoney(auction.currentPrice)}
                </span>
              </div>
            </Card>
          </div>

          <aside className="flex min-w-0 flex-col gap-4" aria-label={translate("สรุปคำสั่งซื้อ", "Order summary")}>
            <CheckoutAddressSummary
              address={activeAddress}
              loading={isAddressLoading}
              error={!!addressError}
              disabled={checkout.isPending}
              onChange={() => setAddressPickerOpen(true)}
              onRetry={() => void refetchAddresses()}
            />

            <Card className={`${CHECKOUT_CARD_CLASS} text-[13px]`}>
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-semibold">{translate("วิธีชำระเงิน", "Payment method")}</h2>
                <span className="text-muted-foreground">{translate("โอนผ่าน PromptPay", "Pay via PromptPay")}</span>
              </div>
            </Card>

            <Card className={`${CHECKOUT_CARD_CLASS} text-[13px]`}>
              <p className="flex items-center gap-2 text-muted-foreground">
                <TicketPercent aria-hidden className="size-4 shrink-0" />{translate("โค้ดส่วนลดใช้กับของประมูลไม่ได้", "Discount codes cannot be used for auction items")}</p>
            </Card>

            <Card className={CHECKOUT_CARD_CLASS}>
              <h2 className="text-[15px] font-semibold">{translate("สรุปคำสั่งซื้อ", "Order summary")}</h2>
              <div className="flex flex-wrap items-center gap-2">
                <AuctionOrderBadge auctionNumber={auction.auctionNumber} />
                {auction.deadline ? (
                  <AuctionCountdown
                    target={auction.deadline}
                    serverTime={toPay.data?.serverTime}
                    prefix={translate("ชำระภายใน", "Pay within")}
                    tone="urgent"
                  />
                ) : null}
              </div>
              <div className="flex items-center justify-between gap-3 text-[13px]">
                <span className="text-muted-foreground">{translate("ยอดสินค้า (1 ใบ)", "Item subtotal (1 card)")}</span>
                <span>{checkoutMoney(auction.currentPrice)}</span>
              </div>
              <div className="flex items-center justify-between gap-3 text-[13px]">
                <span className="text-muted-foreground">{translate("ค่าจัดส่ง", "Shipping")}</span>
                <span>{checkoutMoney(auction.shippingFee)}</span>
              </div>
              <Separator className="checkout-divider" />
              <div className="flex items-center justify-between gap-3 text-lg">
                <span className="font-semibold">{translate("ยอดรวม", "Total")}</span>
                <strong data-testid="checkout-grand-total">{checkoutMoney(total)}</strong>
              </div>
              <Button
                className="checkout-primary h-11 w-full cursor-pointer rounded-full text-sm font-semibold"
                disabled={!canPurchase}
                onClick={handlePurchase}
              >
                {checkout.isPending && <Spinner />}
                {checkout.isPending ? translate("กำลังสร้างคำสั่งซื้อ...", "Creating order...") : translate("สั่งซื้อและไปชำระเงิน", "Place order and pay")}
              </Button>
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
      </div>
    </div>
  );
}
