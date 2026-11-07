import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  CheckCircle2,
  Loader2,
  Plus,
  Store,
  TriangleAlert,
  Truck,
  X,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  PriceTag,
  formatSaleBaht,
  isOnSale,
  useCountdown,
} from "@/components/sale";
import { toast } from "@/components/ui/toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSellerListings } from "@/features/catalog/catalog.queries";
import { cartLineTotals, cartUnitPrice, saleEndedInCart } from "@/features/sale/sale.cart";
import { useMiniCartQuery, useAddCartItem } from "../cart.queries";
import { useMiniCart } from "../mini-cart.store";
import { groupMiniCart, miniCartSummary } from "../mini-cart.format";
import { miniCartText as t } from "../mini-cart.messages";
import { addToCartErrorMessage } from "../cart.format";
import type { CartItemResponse } from "../cart.types";
import { cn } from "@/lib/utils";

export function MiniCartDrawer() {
  const mini = useMiniCart();
  const mobile = useIsMobile();
  const location = useLocation();
  const { close } = mini;
  useEffect(() => {
    close();
  }, [location.key, close]); // Navigation, including browser Back, closes the transient panel.
  return (
    <Sheet
      open={mini.isOpen}
      onOpenChangeComplete={(open) => {
        // External purchase buttons are not SheetTrigger nodes. Restore after modal inertness is removed.
        if (!open && mini.trigger?.isConnected)
          mini.trigger.focus({ preventScroll: true });
      }}
      onOpenChange={(open) => {
        if (!open) mini.close();
      }}
    >
      <SheetContent
        side={mobile ? "bottom" : "right"}
        showCloseButton={false}
        finalFocus={() => (mini.trigger?.isConnected ? mini.trigger : false)}
        className={cn(
          "gap-0 overflow-hidden p-0",
          mobile
            ? "h-[85dvh] max-h-[85dvh] rounded-t-2xl"
            : "data-[side=right]:w-[420px] data-[side=right]:sm:max-w-[420px]",
        )}
      >
        {mini.isOpen && <MiniCartBody />}
      </SheetContent>
    </Sheet>
  );
}

function ItemPrice({ item, recent }: { item: CartItemResponse; recent: boolean }) {
  if (!item.purchasable)
    return (
      <span className="text-muted-foreground">
        {formatSaleBaht(cartUnitPrice(item) * item.quantity)}
      </span>
    );
  const totals = cartLineTotals(item);
  const pricing = item.pricing
    ? {
        ...item.pricing,
        listPrice: totals.listTotal,
        salePrice: totals.subtotal,
      }
    : null;
  return (
    <PriceTag
      pricing={pricing}
      price={cartUnitPrice(item) * item.quantity}
      showBadge={false}
      size="sm"
      className={cn("items-end", !recent && "[&>span]:text-foreground")}
    />
  );
}

function ItemRow({
  item,
  recent = false,
  previous = 0,
}: {
  item: CartItemResponse;
  recent?: boolean;
  previous?: number;
}) {
  const mini = useMiniCart();
  return (
    <article
      className="flex items-start gap-3"
      data-mini-cart-item={item.listingId}
    >
      {item.imageUrl && (
        <img
          src={item.imageUrl}
          alt=""
          className={cn(
            "shrink-0 rounded object-contain",
            recent ? "h-20 w-14" : "h-[60px] w-11",
          )}
        />
      )}
      <div className="min-w-0 flex-1">
        <Link
          to={`/listings/${item.listingId}`}
          onClick={mini.close}
          className="line-clamp-2 text-[13px] font-semibold"
        >
          {item.productName}
        </Link>
        <p className="mt-1 text-[11px] text-muted-foreground">
          {[
            item.condition,
            item.variantLabel,
            recent ? item.sellerName : `x${item.quantity}`,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
        {recent && (
          <p className="mt-1 text-xs font-medium text-emerald-700">
            {t.quantity(item.quantity, previous)}
          </p>
        )}
        {item.priceChanged && (
          <p className="mt-1.5 w-fit rounded bg-amber-100 px-2 py-1 text-[11px] text-amber-800">
            {saleEndedInCart(item) ? `${t.saleEnded} · ` : ""}
            {t.changed(
              formatSaleBaht(item.unitPriceAtAdd),
              formatSaleBaht(cartUnitPrice(item)),
            )}
          </p>
        )}
        {!item.purchasable && (
          <p className="mt-1.5 w-fit rounded bg-red-50 px-2 py-1 text-[11px] text-red-600">
            {t.unavailable}
          </p>
        )}
      </div>
      <div className="shrink-0 pt-5 text-right text-sm font-semibold">
        <ItemPrice item={item} recent={recent} />
      </div>
    </article>
  );
}

function MiniCartBody() {
  const mini = useMiniCart();
  const query = useMiniCartQuery();
  const items = query.data?.items ?? [];
  const recent = items.find((item) => item.listingId === mini.listingId);
  const summary = miniCartSummary(items, mini.previousQuantity);
  const groups = groupMiniCart(items);
  const more = useSellerListings(recent?.sellerUsername ?? "");
  const upsell = (more.data?.items ?? [])
    .filter(
      (listing) =>
        listing.quantityAvailable > 0 &&
        !items.some((item) => item.listingId === listing.id),
    )
    .slice(0, 3);
  const addCart = useAddCartItem();
  const endsAt = items
    .flatMap((item) =>
      isOnSale(item.pricing) ? [item.pricing.sale.endsAt] : [],
    )
    .sort()[0];
  useCountdown(endsAt, () => {
    void query.refetch();
  });
  const add = async (listingId: number) => {
    const captured = mini.capture(listingId);
    try {
      await addCart.mutateAsync({ listingId, quantity: 1 });
      mini.open({ ...captured, trigger: mini.trigger });
    } catch (error) {
      toast.add({
        title: t.addFailed,
        description: addToCartErrorMessage(error),
        type: "error",
      });
    }
  };
  const checkoutHref = `/checkout?items=${items
    .filter((item) => item.purchasable)
    .map((item) => item.id)
    .join(",")}`;
  return (
    <div
      className="flex min-h-0 flex-1 flex-col"
      data-mini-cart-state={summary.state}
    >
      <header className="flex shrink-0 items-center gap-2.5 border-b px-5 py-5">
        <CheckCircle2 className="size-5 shrink-0 fill-emerald-700 text-white" />
        <SheetTitle className="flex-1 text-base font-bold">
          {mini.previousQuantity > 0 ? t.updated : t.added}
        </SheetTitle>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={t.close}
          onClick={mini.close}
        >
          <X className="size-4" />
        </Button>
        <SheetDescription className="sr-only">{t.cart}</SheetDescription>
      </header>
      <div
        className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain p-5"
        data-mini-cart-body
      >
        {query.isPending ? (
          <p role="status" className="flex items-center gap-2">
            <Loader2 className="size-4 animate-spin" />
            {t.loading}
          </p>
        ) : query.isError ? (
          <div role="alert" className="space-y-3">
            <p>{t.failed}</p>
            <Button variant="outline" onClick={() => void query.refetch()}>
              {t.retry}
            </Button>
          </div>
        ) : (
          <>
            {recent && (
              <section
                aria-label={t.justAdded}
                className="rounded-2xl bg-emerald-50 p-3.5"
              >
                <ItemRow
                  item={recent}
                  recent
                  previous={mini.previousQuantity}
                />
              </section>
            )}
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{t.cart}</h3>
              <p className="text-xs text-muted-foreground">
                {t.count(summary.quantity, summary.shops)}
              </p>
            </div>
            {groups.map((group) => (
              <section
                key={group.key}
                className="space-y-3.5 rounded-xl border p-3.5"
              >
                <h4 className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Store className="size-3.5" />
                  {group.name}
                </h4>
                {group.items.map((item) => (
                  <ItemRow key={item.id} item={item} />
                ))}
              </section>
            ))}
            {!items.length && (
              <p className="text-muted-foreground">{t.empty}</p>
            )}
            {upsell.length > 0 && recent && (
              <section className="pt-1">
                <h3 className="mb-3 flex items-center gap-1.5 text-xs font-medium">
                  <Truck className="size-4 shrink-0 text-emerald-700" />
                  {t.more(recent.sellerName || recent.sellerUsername || "")}
                </h3>
                <div className="grid grid-cols-3 gap-2.5">
                  {upsell.map((listing) => (
                    <article
                      key={listing.id}
                      className="min-w-0 rounded-xl border p-2"
                      data-upsell-listing={listing.id}
                    >
                      {(listing.primaryPhotoUrl ||
                        listing.card.officialImageUrl) && (
                        <img
                          src={
                            listing.primaryPhotoUrl ||
                            listing.card.officialImageUrl!
                          }
                          alt=""
                          className="mb-2 aspect-[3/4] w-full rounded object-contain"
                        />
                      )}
                      <Link
                        to={`/listings/${listing.id}`}
                        onClick={mini.close}
                        className="line-clamp-2 text-[11px] font-medium"
                      >
                        {listing.card.productName}
                      </Link>
                      <div className="mt-2 flex flex-wrap items-end justify-between gap-1">
                        <PriceTag
                          pricing={listing.pricing}
                          price={listing.price}
                          size="sm"
                          showBadge={false}
                        />
                        <Button
                          variant="secondary"
                          size="icon-xs"
                          aria-label={t.quickAdd(listing.card.productName)}
                          disabled={addCart.isPending}
                          onClick={() => void add(listing.id)}
                        >
                          <Plus className="size-3.5" />
                        </Button>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
      <footer
        className="shrink-0 space-y-3 border-t bg-card p-5"
        data-mini-cart-footer
      >
        {summary.attention > 0 && (
          <p
            role="alert"
            className="flex gap-2 rounded-lg bg-amber-100 px-3 py-2 text-xs text-amber-800"
          >
            <TriangleAlert className="size-4 shrink-0" />
            {t.attention(summary.attention)}
          </p>
        )}
        {summary.sale && (
          <>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{t.beforeDiscount}</span>
              <strong className="text-foreground">
                {formatSaleBaht(summary.listTotal)}
              </strong>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{t.discount}</span>
              <strong className="text-red-600">
                −{formatSaleBaht(summary.saleDiscount)}
              </strong>
            </div>
          </>
        )}
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">{t.subtotal}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {t.shipping}
            </p>
          </div>
          <strong className="text-2xl">
            {formatSaleBaht(summary.subtotal)}
          </strong>
        </div>
        <div className="flex gap-2.5">
          {summary.attention > 0 ? (
            <Button
              className="h-12 w-full rounded-xl"
              nativeButton={false}
              render={<Link to="/cart" onClick={mini.close} />}
            >
              {t.review}
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                className="h-12 flex-1 rounded-xl"
                nativeButton={false}
                render={<Link to="/cart" onClick={mini.close} />}
              >
                {t.view}
              </Button>
              {items.length > 0 && !query.isError && !query.isPending && (
                <Button
                  className="h-12 flex-1 rounded-xl"
                  nativeButton={false}
                  render={<Link to={checkoutHref} onClick={mini.close} />}
                >
                  {t.checkout}
                </Button>
              )}
            </>
          )}
        </div>
        <button
          type="button"
          className="block w-full cursor-pointer text-center text-sm text-primary"
          onClick={mini.close}
        >
          {t.continue}
        </button>
      </footer>
    </div>
  );
}
