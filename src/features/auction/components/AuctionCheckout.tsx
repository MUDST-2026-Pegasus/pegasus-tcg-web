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
        <FormPageSkeleton label="กำลังเตรียมคำสั่งซื้อ" />
      </div>
    );
  }
  if (!isAuthenticated) return null;
  if (!auction) {
    return (
      <div className="checkout-page">
        <div className="checkout-container">
          <h1 className="text-xl font-bold">ไม่พบสินค้าที่เลือกสั่งซื้อ</h1>
          <Button onClick={() => navigate("/account/auctions")} className="mt-4">
            การประมูลของฉัน
          </Button>
        </div>
      </div>
    );
  }

  // ร้านไม่มีตัวเลือกจัดส่ง → ยังคิดยอดไม่ได้ ห้ามสั่งซื้อ (ไม่ใช่นับค่าส่งเป็น 0)
  const noShipping = auction.shippingFee === null;
  const total = auction.totalDue ?? auction.currentPrice + (auction.shippingFee ?? 0);
  const canPurchase =
    !noShipping && !!activeAddress && !isAddressLoading && !addressError && !checkout.isPending && !existingOrderId;

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
          toast.add({ title: "สร้างคำสั่งซื้อสำเร็จ", description: `คำสั่งซื้อ ${response.orderNumber}`, type: "success" });
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
      toast.add({ title: "สั่งซื้อไม่สำเร็จ", description: "กรุณาตรวจสอบการเชื่อมต่อและลองอีกครั้ง", type: "error" });
      return;
    }
    if (error.status > 0 && error.status < 500) attempt.current = null;
    if (error.code === "SHIPPING_ADDRESS_REQUIRED" || error.code === "ADDRESS_NOT_FOUND" || error.code === "NO_SHIPPING_ADDRESS") {
      setSelectedAddressId(null);
      void queryClient.invalidateQueries({ queryKey: addressKeys.all });
      setAddressPickerOpen(true);
      toast.add({ title: "กรุณาเลือกที่อยู่จัดส่งอีกครั้ง", description: "ที่อยู่เดิมไม่พร้อมใช้งาน", type: "warning" });
      return;
    }
    if (error.code === "AUCTION_CLOSED") {
      // เลยกำหนดชำระแล้ว — กลับไปดูสถานะในหน้าการประมูลของฉัน
      toast.add({ title: "สั่งซื้อไม่สำเร็จ", description: error.message, type: "error" });
      navigate("/account/auctions", { replace: true });
      return;
    }
    if (error.code === "CART_PRICE_CHANGED" || error.code === "PRICE_CHANGED") {
      void toPay.refetch();
    }
    toast.add({ title: "สั่งซื้อไม่สำเร็จ", description: error.message, type: "error" });
  };

  const { item } = auction;

  return (
    <div className="checkout-page">
      <div className="checkout-container">
        <header className="mb-6">
          <h1 className="text-[26px] leading-tight font-bold">ตรวจสอบและสั่งซื้อ</h1>
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

          <aside className="flex min-w-0 flex-col gap-4" aria-label="สรุปคำสั่งซื้อ">
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
                <h2 className="font-semibold">วิธีชำระเงิน</h2>
                <span className="text-muted-foreground">โอนผ่าน PromptPay</span>
              </div>
            </Card>

            <Card className={`${CHECKOUT_CARD_CLASS} text-[13px]`}>
              <p className="flex items-center gap-2 text-muted-foreground">
                <TicketPercent aria-hidden className="size-4 shrink-0" />
                โค้ดส่วนลดใช้กับของประมูลไม่ได้
              </p>
            </Card>

            <Card className={CHECKOUT_CARD_CLASS}>
              <h2 className="text-[15px] font-semibold">สรุปคำสั่งซื้อ</h2>
              <div className="flex flex-wrap items-center gap-2">
                <AuctionOrderBadge auctionNumber={auction.auctionNumber} />
                {auction.deadline ? (
                  <AuctionCountdown
                    target={auction.deadline}
                    serverTime={toPay.data?.serverTime}
                    prefix="ชำระภายใน"
                    tone="urgent"
                  />
                ) : null}
              </div>
              <div className="flex items-center justify-between gap-3 text-[13px]">
                <span className="text-muted-foreground">ยอดสินค้า (1 ใบ)</span>
                <span>{checkoutMoney(auction.currentPrice)}</span>
              </div>
              <div className="flex items-center justify-between gap-3 text-[13px]">
                <span className="text-muted-foreground">ค่าจัดส่ง</span>
                <span>{noShipping ? "—" : checkoutMoney(auction.shippingFee ?? 0)}</span>
              </div>
              <Separator className="checkout-divider" />
              <div className="flex items-center justify-between gap-3 text-lg">
                <span className="font-semibold">ยอดรวม</span>
                <strong data-testid="checkout-grand-total">{noShipping ? "—" : checkoutMoney(total)}</strong>
              </div>
              {noShipping ? (
                <p role="alert" className="text-xs text-red-700">
                  ร้านนี้ยังไม่มีตัวเลือกจัดส่ง จึงยังสั่งซื้อไม่ได้ — กรุณาติดต่อร้าน
                </p>
              ) : null}
              <Button
                className="checkout-primary h-11 w-full cursor-pointer rounded-full text-sm font-semibold"
                disabled={!canPurchase}
                onClick={handlePurchase}
              >
                {checkout.isPending && <Spinner />}
                {checkout.isPending ? "กำลังสร้างคำสั่งซื้อ..." : "สั่งซื้อและไปชำระเงิน"}
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
