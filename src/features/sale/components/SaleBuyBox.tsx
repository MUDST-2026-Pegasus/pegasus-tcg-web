import { translate, useLanguage } from "@/lib/language";
import { DisabledActionHint } from "@/components/common/DisabledActionHint";
import { Progress } from "@/components/ui/progress";
import { useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, Loader2, Minus, Plus, ShoppingCart } from "lucide-react";
import {
  PriceTag,
  formatCountdown,
  formatSaleBaht,
  isOnSale,
  priceTagState,
  quotaProgress,
  savingPerUnit,
  useCountdown,
} from "@/components/sale";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { useMiniCart } from "@/features/cart/mini-cart.store";
import { useAddCartItem } from "@/features/cart/cart.queries";
import { addToCartErrorMessage } from "@/features/cart/cart.format";
import { useAuth } from "@/features/auth/auth.queries";
import type {
  PublicListingDetailDto,
  PublicListingDto,
} from "@/features/catalog/catalog.types";
import { buyBoxState, listingTotal } from "@/lib/listing-detail.format";
import { listingText as t } from "@/lib/listing-detail.messages";
import { cn } from "@/lib/utils";
import { notifyAddedAtSalePrice } from "../sale.notify";
import { untilLabel } from "../sale.format";

type Listing = PublicListingDto & Partial<PublicListingDetailDto["listing"]>;
/** Listing buy box. Pricing, quota and limits come from the API; shared sale logic stays here. */
export function SaleBuyBox({
  listing,
  title,
  onExpired,
  header,
  marketHint,
  versions,
  ownerActions,
  delivery,
}: {
  listing: Listing;
  title: string;
  onExpired: () => void;
  header?: ReactNode;
  marketHint?: ReactNode;
  versions?: ReactNode;
  ownerActions?: ReactNode;
  delivery?: ReactNode;
}) {
  useLanguage();
  const auth = useAuth();
  const navigate = useNavigate();
  const state = buyBoxState(listing, auth.user?.username);
  const own = state === "own";
  const soldOut =
    listing.status === "SOLD_OUT" || listing.quantityAvailable <= 0;
  const pricing = soldOut ? null : (listing.pricing ?? null);
  const sale = isOnSale(pricing) ? pricing.sale : null;
  const flash = priceTagState(pricing) === "flash" && sale != null;
  const addCartItem = useAddCartItem();
  const miniCart = useMiniCart();
  const [selection, setSelection] = useState({ id: listing.id, quantity: 1 });
  const max = listing.gradingCompany
    ? 1
    : Math.max(1, listing.quantityAvailable);
  const quantity =
    selection.id === listing.id ? Math.min(max, selection.quantity) : 1;
  const [buying, setBuying] = useState(false);
  const left = useCountdown(sale?.endsAt, onExpired);
  const progress = flash
    ? quotaProgress(listing.saleQuota, sale.quotaLeft)
    : null;
  const limit = sale?.perBuyerLimit ?? null;
  const pending = addCartItem.isPending || buying;

  const add = async (buyNow = false, trigger?: HTMLElement) => {
    if (own || soldOut || pending) return;
    if (buyNow && !auth.isAuthenticated) {
      navigate("/login", {
        state: { from: { pathname: `/listings/${listing.id}` } },
      });
      return;
    }
    const opening = miniCart.capture(listing.id, trigger);
    setBuying(buyNow);
    try {
      const item = await addCartItem.mutateAsync({
        listingId: listing.id,
        quantity,
      });
      if (buyNow)
        navigate(`/checkout?items=${item.id}&listingId=${listing.id}`);
      else {
        miniCart.open(opening);
        notifyAddedAtSalePrice(title, quantity, pricing);
      }
    } catch (error) {
      toast.add({
        title: buyNow ? t.buyFailed : t.addFailed,
        description: addToCartErrorMessage(error),
        type: "error",
      });
    } finally {
      setBuying(false);
    }
  };

  return (
    <section
      aria-label={t.buy}
      className={cn(
        "overflow-hidden rounded-[20px] border bg-card",
        flash && "border-orange-300",
      )}
      data-buy-box={state}
    >
      {flash && (
        <div className="flex items-center justify-between gap-2 bg-linear-to-r from-orange-500 to-red-600 px-6 py-3 text-[13px] font-bold text-white">
          <span>{translate("⚡ แฟลชเซล", "⚡ FLASH SALE")}</span>
          <span role="timer" className="tabular-nums">
            {t.endsIn(formatCountdown(left))}
          </span>
        </div>
      )}
      <div className="grid gap-5 p-6">
        {own && (
          <p className="rounded-xl bg-primary/5 px-3 py-3 text-sm text-primary">
            {t.own}
          </p>
        )}
        {header ?? <p className="font-semibold">{title}</p>}
        {soldOut ? (
          <div className="flex items-center gap-3 text-muted-foreground">
            <strong className="text-4xl">
              {formatSaleBaht(listing.price)}
            </strong>
            <span className="rounded-full bg-muted px-3 py-1 text-xs">
              {t.soldOut}
            </span>
          </div>
        ) : (
          <PriceTag
            pricing={pricing}
            price={listing.price}
            size="lg"
            inline
            className="[&>span:first-child>span:first-child]:text-4xl [&>span:only-child]:text-4xl"
          />
        )}
        {!flash && !soldOut && marketHint}
        {sale && !flash && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-red-50 px-3.5 py-3 text-xs text-red-700">
            <div>
              <p className="font-semibold">
                {sale.name} · {untilLabel(sale.endsAt)}
              </p>
              <p className="mt-1">
                {t.saved(formatSaleBaht(savingPerUnit(pricing)))}
              </p>
            </div>
            {sale.slug && (
              <Link
                to={`/sale/${encodeURIComponent(sale.slug)}`}
                className="font-semibold hover:underline"
              >
                {t.campaign} ›
              </Link>
            )}
          </div>
        )}
        {flash && (
          <div className="grid gap-2">
            {progress && (
              <Progress
                value={progress.sold}
                max={progress.quota}
                aria-label={t.flashQuota}
                className="[&_[data-slot=progress-track]]:h-2 [&_[data-slot=progress-indicator]]:bg-destructive"
              />
            )}
            <p className="text-xs font-medium text-orange-700">
              {[
                progress ? t.quotaSold(progress.sold, progress.quota) : null,
                sale.quotaLeft != null ? t.quotaLeft(sale.quotaLeft) : null,
                limit != null ? t.buyerLimit(limit) : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
        )}
        {own ? (
          <div className="border-t pt-5">
            <p className="mb-4 text-sm">{t.stock(listing.quantityAvailable)}</p>
            {sale && (
              <p className="mb-3 text-xs text-muted-foreground">
                {t.priceLocked}
              </p>
            )}
            {ownerActions}
          </div>
        ) : soldOut ? (
          <div className="grid gap-4 border-t pt-5">
            <Link
              className="rounded-xl bg-muted p-4 text-sm text-primary hover:underline"
              to={`/products/${encodeURIComponent(listing.card.productSlug)}/listings`}
            >
              {t.soldHint} ›
            </Link>
            <Button disabled className="h-12">
              {t.soldOut}
            </Button>
          </div>
        ) : (
          <>
            {versions && <div className="border-t pt-5">{versions}</div>}
            <div className="flex flex-wrap items-center gap-3 text-[13px]">
              <span className="text-muted-foreground">{t.quantity}</span>
              <div className="flex items-center rounded-lg border">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={t.minus}
                  disabled={quantity <= 1 || pending}
                  onClick={() =>
                    setSelection({ id: listing.id, quantity: quantity - 1 })
                  }
                >
                  <Minus className="size-4" />
                </Button>
                <span
                  className="w-7 text-center font-semibold"
                  aria-live="polite"
                >
                  {quantity}
                </span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={t.plus}
                  disabled={quantity >= max || pending}
                  onClick={() =>
                    setSelection({ id: listing.id, quantity: quantity + 1 })
                  }
                >
                  <Plus className="size-4" />
                </Button>
              </div>
              <span
                className={cn("text-orange-700", max === 1 && "text-red-600")}
              >
                {max === 1 ? t.last : t.remaining(listing.quantityAvailable)}
              </span>
              <strong className="ml-auto text-sm">
                {t.total} {formatSaleBaht(listingTotal(listing, quantity))}
              </strong>
            </div>
            {flash && limit != null && pricing && (
              <p className="text-xs text-orange-700">
                {t.flashLimit(limit, formatSaleBaht(pricing.listPrice))}
              </p>
            )}
            <div className="flex gap-2.5">
              <Button
                className={cn(
                  "h-[52px] flex-1 rounded-xl text-[15px] font-semibold",
                  flash && "bg-red-600 text-white hover:bg-red-700",
                )}
                disabled={pending}
                onClick={(event) => void add(false, event.currentTarget)}
              >
                {pending && !buying ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <ShoppingCart className="size-4" />
                )}
                {t.add}
              </Button>
              <Button
                variant="outline"
                className="h-[52px] flex-1 rounded-xl text-[15px] font-semibold"
                disabled={pending || auth.isLoading}
                onClick={(event) => void add(true, event.currentTarget)}
              >
                {buying && <Loader2 className="size-4 animate-spin" />}
                {t.buy}
              </Button>
              <DisabledActionHint label={t.wishlistUnavailable}>
                <Button
                  variant="outline"
                  className="h-[52px] w-[52px] rounded-xl"
                  size="icon"
                  disabled
                  aria-label={t.wishlist}
                >
                  <Heart className="size-5" />
                </Button>
              </DisabledActionHint>
            </div>
          </>
        )}
        {delivery}
      </div>
    </section>
  );
}
