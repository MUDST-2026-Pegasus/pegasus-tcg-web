import { Link, useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import {
  BadgeCheck,
  Clock,
  ExternalLink,
  MessageCircle,
  ShoppingCart,
  Store,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import { SaleBuyBox } from "@/features/sale/components/SaleBuyBox";
import {
  PriceTag,
  SaleProductCard,
  effectivePrice,
  isOnSale,
} from "@/components/sale";
import { useAddCartItem } from "@/features/cart/cart.queries";
import { addToCartErrorMessage } from "@/features/cart/cart.format";
import { notifyQuickAdded, notifyQuickAddError } from "@/features/cart/mini-cart.notify";
import { useChangeListingStatus } from "@/features/seller/products/products.queries";
import { useAuth } from "@/features/auth/auth.queries";
import { ApiError } from "@/lib/api";
import { CONDITION_LABELS, productHref } from "../catalog.mappers";
import {
  useCardSetList,
  useGameAttributes,
  useGameList,
  useListingDetail,
  useProductCardEffects,
  useProductDetail,
  useProductListings,
  useSellerListings,
} from "../catalog.queries";
import {
  certificateHref,
  displayValue,
  versionOffers,
} from "../listing-detail.format";
import { listingText as t } from "../listing-detail.messages";
import type {
  PublicListingDetailDto,
  PublicListingDto,
} from "../catalog.types";
import {
  ListingCardInformation,
  ListingDetailSkeleton,
  ListingGallery,
  ListingMarketHint,
} from "../components/ListingDetailSections";
import { cn } from "@/lib/utils";

export function ListingDetailPage() {
  const { listingId } = useParams<{ listingId: string }>();
  const id = Number(listingId);
  const query = useListingDetail(id);
  const valid = !!listingId && Number.isSafeInteger(id) && id > 0;
  if (valid && query.isPending) return <ListingDetailSkeleton />;
  if (!valid || query.isError) {
    const notFound =
      !valid || (query.error instanceof ApiError && query.error.status === 404);
    return (
      <main
        role="alert"
        className="mx-auto max-w-3xl space-y-5 px-5 py-24 text-center"
      >
        <h1 className="text-2xl font-bold">
          {notFound ? t.notFound : t.failed}
        </h1>
        <div className="flex justify-center gap-3">
          {!notFound && (
            <Button onClick={() => void query.refetch()}>{t.retry}</Button>
          )}
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link to="/products" />}
          >
            {t.back}
          </Button>
        </div>
      </main>
    );
  }
  if (!query.data) return null;
  return (
    <ListingDetailContent
      key={id}
      data={query.data}
      refresh={() => void query.refetch()}
    />
  );
}

function ListingDetailContent({
  data,
  refresh,
}: {
  data: PublicListingDetailDto;
  refresh: () => void;
}) {
  const { listing } = data;
  const productQuery = useProductDetail(listing.card.productSlug);
  const offersQuery = useProductListings(listing.card.productId);
  const gamesQuery = useGameList();
  const setsQuery = useCardSetList(listing.card.gameId);
  const attributesQuery = useGameAttributes(listing.card.gameId);
  const effectsQuery = useProductCardEffects(listing.card.productId);
  const moreQuery = useSellerListings(listing.seller.username);
  const changeStatus = useChangeListingStatus();
  const [confirmClose, setConfirmClose] = useState(false);
  const [closed, setClosed] = useState(false);
  const sellerName = listing.seller.displayName || listing.seller.username;
  const product = productQuery.data?.product;
  const variant = productQuery.data?.variants.find(
    (v) => v.id === listing.card.variantId,
  );
  const game = gamesQuery.data?.find((g) => g.id === listing.card.gameId);
  const cardSet = setsQuery.data?.find((s) => s.id === product?.cardSetId);
  const grade = listing.gradingCompany
    ? [listing.gradingCompany, listing.gradeValue]
        .filter((v) => v != null)
        .join(" ")
    : undefined;
  const photos = data.photoUrls.length
    ? data.photoUrls
    : [listing.primaryPhotoUrl || listing.card.officialImageUrl].filter(
        (url): url is string => Boolean(url),
      );
  const certUrl = certificateHref(listing.gradingCompany, data.certNumber);
  const offers = versionOffers(
    productQuery.data?.variants ?? [],
    offersQuery.data ?? [],
  );
  const more = (moreQuery.data?.items ?? [])
    .filter((l) => l.id !== listing.id)
    .slice(0, 5);
  const close = async () => {
    try {
      await changeStatus.mutateAsync({ id: listing.id, status: "DELISTED" });
      setConfirmClose(false);
      setClosed(true);
      toast.add({ title: t.closeDone, type: "success" });
    } catch (error) {
      toast.add({
        title: t.closeFailed,
        description: addToCartErrorMessage(error),
        type: "error",
      });
    }
  };
  if (closed)
    return (
      <main className="space-y-5 p-20 text-center">
        <h1>{t.closeDone}</h1>
        <Link to="/seller/products" className="text-primary underline">
          {t.edit}
        </Link>
      </main>
    );
  const soldOut =
    listing.status === "SOLD_OUT" || listing.quantityAvailable === 0;
  return (
    <div className="bg-secondary/60">
      <main className="mx-auto max-w-[1280px] space-y-7 px-5 pt-7 pb-16 lg:px-20">
        <nav
          aria-label="Breadcrumb"
          className="flex flex-wrap gap-2 text-[13px] text-muted-foreground"
        >
          <Link to="/">{t.home}</Link>
          <span>›</span>
          {game && (
            <>
              <Link to={`/products?game=${game.slug}`}>
                {game.nameLocal || game.name}
              </Link>
              <span>›</span>
            </>
          )}
          <Link to={productHref(listing.card.productSlug)}>
            {listing.card.productName}
          </Link>
          <span>›</span>
          <span className="text-foreground">{t.listingBy(sellerName)}</span>
        </nav>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,560fr)_minmax(0,520fr)]">
          <ListingGallery
            photos={photos}
            title={listing.card.productName}
            catalog={!data.photoUrls.length}
            grade={grade}
            cert={data.certNumber}
          />
          <div className="min-w-0 space-y-5">
            <header>
              <div className="mb-3 flex flex-wrap gap-2 text-[11px] font-medium">
                {game && (
                  <span className="rounded-full bg-sky-50 px-2.5 py-1 text-primary">
                    {game.nameLocal || game.name}
                  </span>
                )}
                {product?.rarityCode && (
                  <span className="rounded-full bg-violet-50 px-2.5 py-1 text-violet-700">
                    {product.rarityCode}
                  </span>
                )}
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">
                  {soldOut ? t.soldOut : t.active}
                </span>
              </div>
              <h1 className="text-3xl leading-tight font-bold tracking-tight">
                {listing.card.productName}
              </h1>
              {product?.nameLocal && (
                <p className="mt-2 text-sm text-muted-foreground">
                  {product.nameLocal}
                </p>
              )}
              <p className="mt-3 text-xs">
                {[
                  cardSet?.nameLocal || cardSet?.name,
                  product?.cardNumber ? `#${product.cardNumber}` : null,
                  variant?.languageCode,
                  displayValue(variant?.finish),
                  displayValue(variant?.edition),
                ]
                  .filter(Boolean)
                  .join(" · ") || listing.card.variantLabel}
              </p>
            </header>
            <SaleBuyBox
              listing={listing}
              title={listing.card.productName}
              onExpired={refresh}
              header={
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "rounded-lg px-2.5 py-1.5 text-sm font-bold",
                      grade
                        ? "bg-[#1e242b] text-white"
                        : "bg-amber-100 text-amber-800",
                    )}
                  >
                    {grade || listing.condition}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">
                      {grade ||
                        `${t.condition} ${CONDITION_LABELS[listing.condition]}`}
                    </p>
                    {grade ? (
                      data.certNumber && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Cert #{data.certNumber}
                        </p>
                      )
                    ) : (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {t.raw}
                      </p>
                    )}
                  </div>
                  {certUrl && (
                    <a
                      href={certUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex shrink-0 items-center gap-1 text-xs text-primary"
                    >
                      {t.verifyCert}
                      <ExternalLink className="size-3" />
                    </a>
                  )}
                </div>
              }
              marketHint={
                <ListingMarketHint
                  market={listing.gradingCompany ? null : data.market}
                  price={effectivePrice(listing.pricing, listing.price)}
                />
              }
              versions={
                offers.length ? (
                  <>
                    <p className="mb-3 text-xs text-muted-foreground">
                      {t.version}
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {offers.map(({ variant: v, cheapest, count }) => {
                        const active = v.id === listing.card.variantId;
                        const content = (
                          <>
                            <strong className="text-xs">
                              {[
                                v.languageCode,
                                displayValue(v.finish),
                                displayValue(v.edition),
                              ]
                                .filter(Boolean)
                                .join(" · ")}
                            </strong>
                            {cheapest ? (
                              <span
                                className={cn(
                                  "mt-1 block text-xs",
                                  isOnSale(cheapest.pricing)
                                    ? "text-red-600"
                                    : "text-primary",
                                )}
                              >
                                <PriceTag
                                  pricing={cheapest.pricing}
                                  price={cheapest.price}
                                  size="sm"
                                  showBadge={false}
                                  inline
                                />{" "}
                                · {t.offerCount(count)}
                              </span>
                            ) : (
                              <span className="mt-1 block text-xs text-muted-foreground">
                                {t.noOffers}
                              </span>
                            )}
                          </>
                        );
                        return cheapest ? (
                          <Link
                            key={v.id}
                            aria-current={active ? "true" : undefined}
                            to={`/listings/${cheapest.id}`}
                            className={cn(
                              "rounded-xl border p-3",
                              active
                                ? "border-primary bg-sky-50 ring-1 ring-primary"
                                : "hover:border-primary/50",
                            )}
                          >
                            {content}
                          </Link>
                        ) : (
                          <button
                            key={v.id}
                            disabled
                            className="rounded-xl border p-3 text-left opacity-60"
                          >
                            {content}
                          </button>
                        );
                      })}
                    </div>
                  </>
                ) : undefined
              }
              ownerActions={
                <div className="flex gap-3">
                  <Button
                    nativeButton={false}
                    className="h-12 flex-1 rounded-xl"
                    render={<Link to={`/seller/products/${listing.id}/edit`} />}
                  >
                    {t.edit}
                  </Button>
                  <Button
                    variant="outline"
                    className="h-12 flex-1 rounded-xl"
                    onClick={() => setConfirmClose(true)}
                  >
                    {t.close}
                  </Button>
                </div>
              }
              delivery={
                listing.delivery?.optionCount > 0 ? (
                  <div className="flex flex-wrap justify-between gap-3 rounded-xl bg-muted/60 px-3 py-3 text-xs">
                    <span className="flex items-center gap-1.5">
                      <Truck className="size-4 text-emerald-700" />
                      {listing.delivery.freeShipping
                        ? t.freeShipping
                        : t.shipping}
                    </span>
                    {listing.delivery.fastestEstDaysMin != null && (
                      <span className="flex items-center gap-1.5">
                        <Clock className="size-4 text-emerald-700" />
                        {listing.delivery.fastestEstDaysMin}
                        {listing.delivery.fastestEstDaysMax != null &&
                        listing.delivery.fastestEstDaysMax !==
                          listing.delivery.fastestEstDaysMin
                          ? `–${listing.delivery.fastestEstDaysMax}`
                          : ""}{" "}
                        {t.days}
                      </span>
                    )}
                  </div>
                ) : undefined
              }
            />
            <section className="space-y-4 rounded-[20px] border bg-card p-5">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage
                    src={listing.seller.avatarUrl ?? undefined}
                    alt=""
                  />
                  <AvatarFallback>{sellerName.slice(0, 2)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <Link
                    to={`/u/${encodeURIComponent(listing.seller.username)}`}
                    className="inline-flex items-center gap-1 text-sm font-semibold"
                  >
                    {sellerName}
                    {listing.seller.verified && (
                      <BadgeCheck
                        aria-label={t.verified}
                        className="size-3.5 text-primary"
                      />
                    )}
                  </Link>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {listing.seller.ratingAvg != null
                      ? `★ ${listing.seller.ratingAvg} (${listing.seller.ratingCount} ${t.reviews}) · `
                      : ""}
                    {t.sold} {listing.seller.salesCount} ใบ
                  </p>
                </div>
                <span title={t.chatUnavailable}>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    disabled
                    aria-label={t.chat}
                  >
                    <MessageCircle className="size-4" />
                  </Button>
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  nativeButton={false}
                  render={
                    <Link
                      to={`/u/${encodeURIComponent(listing.seller.username)}`}
                    />
                  }
                >
                  <Store className="size-3.5" />
                  {t.shop}
                </Button>
              </div>
              {listing.publicNote && (
                <div className="rounded-xl bg-muted/60 p-3">
                  <p className="text-[11px] text-muted-foreground">{t.note}</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm">
                    {listing.publicNote}
                  </p>
                </div>
              )}
              <p className="text-[11px] text-muted-foreground">
                {listing.publishedAt
                  ? `${t.published} ${new Date(listing.publishedAt).toLocaleDateString("th-TH")} · `
                  : ""}
                {t.listing} #{listing.id}
              </p>
            </section>
          </div>
        </div>
        {productQuery.isPending ? (
          <p role="status">{t.loadingInfo}</p>
        ) : productQuery.isError ? (
          <div role="alert" className="rounded-2xl border bg-card p-6">
            {t.infoFailed}
            <Button
              variant="outline"
              onClick={() => void productQuery.refetch()}
            >
              {t.retry}
            </Button>
          </div>
        ) : (
          productQuery.data && (
            <ListingCardInformation
              data={productQuery.data}
              listing={listing}
              variant={variant}
              cardSet={cardSet}
              gameName={game?.nameLocal || game?.name}
              gameCode={game?.code}
              definitions={attributesQuery.data ?? []}
              effects={effectsQuery.data ?? []}
              cert={data.certNumber}
              errorAction={
                attributesQuery.isError || effectsQuery.isError ? (
                  <Button
                    variant="outline"
                    onClick={() => {
                      void attributesQuery.refetch();
                      void effectsQuery.refetch();
                    }}
                  >
                    {t.retry}
                  </Button>
                ) : undefined
              }
            />
          )
        )}
        {soldOut && (offersQuery.data?.length ?? 0) > 0 && (
          <section>
            <h2 className="mb-4 text-xl font-bold">{t.otherSellers}</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {offersQuery.data
                ?.filter((l) => l.id !== listing.id)
                .slice(0, 5)
                .map((l) => (
                  <RelatedListing key={l.id} listing={l} />
                ))}
            </div>
          </section>
        )}
        {more.length > 0 && (
          <section>
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 className="text-xl font-bold">
                {t.moreFrom} {sellerName}
              </h2>
              <Link
                to={`/u/${encodeURIComponent(listing.seller.username)}`}
                className="text-xs text-primary hover:underline"
              >
                {t.all} ›
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {more.map((l) => (
                <RelatedListing key={l.id} listing={l} />
              ))}
            </div>
          </section>
        )}
        {moreQuery.isError && (
          <Button variant="outline" onClick={() => void moreQuery.refetch()}>
            {t.retry}
          </Button>
        )}
        <Dialog open={confirmClose} onOpenChange={setConfirmClose}>
          <DialogContent>
            <DialogTitle>{t.closeConfirm}</DialogTitle>
            <DialogDescription>{listing.card.productName}</DialogDescription>
            <Button
              variant="destructive"
              disabled={changeStatus.isPending}
              onClick={() => void close()}
            >
              {t.close}
            </Button>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}

function RelatedListing({ listing }: { listing: PublicListingDto }) {
  const addCart = useAddCartItem();
  const navigate = useNavigate();
  const auth = useAuth();
  const own = auth.user?.username === listing.seller.username;
  const add = async () => {
    try {
      const item = await addCart.mutateAsync({ listingId: listing.id, quantity: 1 });
      notifyQuickAdded(item, () => navigate("/cart"));
    } catch (error) {
      notifyQuickAddError(error);
    }
  };
  return (
    <div className="relative min-w-0">
      <SaleProductCard
        title={listing.card.productName}
        type={
          listing.gradingCompany
            ? [listing.gradingCompany, listing.gradeValue]
                .filter((v) => v != null)
                .join(" ")
            : listing.condition
        }
        image={listing.primaryPhotoUrl || listing.card.officialImageUrl}
        href={`/listings/${listing.id}`}
        pricing={listing.pricing}
        price={listing.price}
        className="h-full [&_[data-slot=card]]:rounded-2xl [&_[data-slot=card]]:p-3 [&_[data-slot=card]>div]:px-0 [&_[data-slot=card]>div:first-child>div]:aspect-[187/220]"
      />
      {!own && (
        <Button
          variant="secondary"
          size="icon-sm"
          className="absolute right-3 bottom-3 bg-sky-50 text-primary"
          aria-label={`${t.add} ${listing.card.productName}`}
          disabled={addCart.isPending || listing.quantityAvailable <= 0}
          onClick={() => void add()}
        >
          <ShoppingCart className="size-4" />
        </Button>
      )}
    </div>
  );
}
