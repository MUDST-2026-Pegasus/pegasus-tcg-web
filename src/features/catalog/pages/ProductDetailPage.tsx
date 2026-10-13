import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ShoppingCart, ChevronRight, Sparkles, PackageCheck, Truck, ShieldCheck, BadgeCheck, Minus, Plus, Loader2 } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/features/auth/auth.queries";
import { useAddCartItem } from "@/features/cart/cart.queries";
import { CONDITION_LABELS, PRODUCT_TYPE_LABELS } from "../catalog.mappers";
import { useGameList, useProductCardEffects, useProductCollectors, useProductDetail, useProductListings } from "../catalog.queries";
import type { CardCondition, ProductDetailDto } from "../catalog.types";

function formatPrice(amount: number, currency = "THB") {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency,
  }).format(amount);
}

function ProductImage({
                        src,
                        alt,
                        className,
                      }: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
        <div className="flex min-h-24 items-center justify-center p-4 text-center text-sm text-muted-foreground">
          โหลดรูปไม่ได้ กรุณาลองโหลดข้อมูลใหม่
        </div>
    );
  }

  return (
      <img
          src={src}
          alt={alt}
          className={className}
          onError={() => setFailed(true)}
      />
  );
}

export function ProductDetailPage() {
  const { productId } = useParams<{ productId: string }>();

  const productQuery = useProductDetail(productId);

  if (!productId) {
    return (
        <div className="p-8 text-center">
          <h1 className="text-xl font-bold">ไม่พบรหัสสินค้า</h1>
          <Link to="/products" className="mt-4 inline-block underline">
            กลับหน้ารายการสินค้า
          </Link>
        </div>
    );
  }

  if (productQuery.isPending) {
    return (
        <div role="status" className="p-8 text-center">
          กำลังโหลดสินค้า...
        </div>
    );
  }

  if (productQuery.isError) {
    const notFound =
        productQuery.error instanceof ApiError &&
        productQuery.error.status === 404;

    return (
        <div role="alert" className="space-y-4 p-8 text-center">
          <h1 className="text-xl font-bold">
            {notFound ? "ไม่พบสินค้านี้" : "โหลดสินค้าไม่สำเร็จ"}
          </h1>

          <p className="text-muted-foreground">
            {notFound
                ? "สินค้านี้อาจถูกนำออก หรือ URL ไม่ถูกต้อง"
                : "กรุณาตรวจสอบการเชื่อมต่อแล้วลองอีกครั้ง"}
          </p>

          {!notFound && (
              <Button onClick={() => void productQuery.refetch()}>
                ลองใหม่
              </Button>
          )}

          <div>
            <Link to="/products" className="underline">
              กลับหน้ารายการสินค้า
            </Link>
          </div>
        </div>
    );
  }

  return (
      <ProductDetailContent
          key={productQuery.data.product.id}
          data={productQuery.data}
          refreshing={productQuery.isFetching}
          onRefresh={() => void productQuery.refetch()}
      />
  );
}

function ProductDetailContent({
                                data,
                                refreshing,
                                onRefresh,
                              }: {
  data: ProductDetailDto;
  refreshing: boolean;
  onRefresh: () => void;
}) {
  const { product, variants, images } = data;
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const addCartItem = useAddCartItem();
  const itemLabel = product.productType === "SINGLE_CARD" ? "cards" : "items";

  const [selectedImageId, setSelectedImageId] = useState<number | null>(
      null,
  );
  const [selectedVariant, setSelectedVariant] = useState("");
  const [selectedCondition, setSelectedCondition] = useState<CardCondition | "">("");
  const [page, setPage] = useState(0);
  const [collectorPage, setCollectorPage] = useState(0);
  const [quantitySelection, setQuantitySelection] = useState<{
    listingId: number | null;
    quantity: number;
  }>({ listingId: null, quantity: 1 });
  const [isBuyingNow, setIsBuyingNow] = useState(false);

  const listingsQuery = useProductListings(product.id);
  const collectorsQuery = useProductCollectors(product.id, collectorPage);
  const effectsQuery = useProductCardEffects(product.id);
  const gamesQuery = useGameList();

  const listings = listingsQuery.data ?? [];
  const effects = effectsQuery.data ?? [];

  const gallery = [...images]
      .filter(
          (image) =>
              !selectedVariant ||
              image.catalogVariantId === null ||
              image.catalogVariantId === Number(selectedVariant),
      )
      .sort(
          (a, b) =>
              Number(b.primary) - Number(a.primary) ||
              a.sortOrder - b.sortOrder,
      );

  const currentImage =
      gallery.find((image) => image.id === selectedImageId) ??
      gallery[0];

  const variantListings = selectedVariant
      ? listings.filter(
          (listing) =>
              listing.card.variantId === Number(selectedVariant),
      )
      : listings;

  // condition เป็นข้อมูลของ listing ไม่ใช่ CatalogVariant
  const availableConditions = [
    ...new Set(variantListings.map((listing) => listing.condition)),
  ].sort();

  const effectiveCondition = selectedCondition && availableConditions.includes(
      selectedCondition,
  )
      ? selectedCondition
      : "";

  // รักษาลำดับราคาที่ backend ส่งมา
  const filteredListings = effectiveCondition
      ? variantListings.filter(
          (listing) => listing.condition === effectiveCondition,
      )
      : variantListings;

  const pageSize = 20;
  const pageCount = Math.max(
      1,
      Math.ceil(filteredListings.length / pageSize),
  );
  const currentPage = Math.min(page, pageCount - 1);
  const visibleListings = filteredListings.slice(
      currentPage * pageSize,
      (currentPage + 1) * pageSize,
  );

  const attributes = product.attributes ?? {};
  const displayAttribute = (key: string) => {
    const value = attributes[key];
    return typeof value === "string" || typeof value === "number" ? String(value) : "—";
  };
  const attributeRows = [
    ["Card number", product.cardNumber || "—"],
    ["Rarity", product.rarityCode || "—"],
    ["Card type", displayAttribute("card_type")],
    ["Stage", displayAttribute("stage")],
    ["HP", displayAttribute("hp")],
    ["Artist", displayAttribute("artist")],
  ];
  const conditionOptions: CardCondition[] = product.productType === "SINGLE_CARD"
      ? [...new Set<CardCondition>(["NM", "LP", "MP", ...availableConditions])]
      : availableConditions;
  const firstListing = filteredListings[0];
  const purchasableListing = filteredListings.find((listing) => listing.quantityAvailable > 0);
  const availableForSelectedListing = purchasableListing?.quantityAvailable ?? 0;
  const quantity = quantitySelection.listingId === (purchasableListing?.id ?? null)
    ? quantitySelection.quantity
    : 1;
  const selectedQuantity = Math.min(quantity, Math.max(availableForSelectedListing, 1));
  const gameName = gamesQuery.data?.find((game) => game.id === product.gameId)?.name;
  const listingsReady = listingsQuery.isSuccess;
  const availableQuantity = filteredListings.reduce((sum, row) => sum + row.quantityAvailable, 0);
  const hasListings = filteredListings.length > 0;

  async function addListingToCart(listingId: number, amount: number) {
    try {
      await addCartItem.mutateAsync({ listingId, quantity: amount });
      toast.add({
        title: "เพิ่มลงรถเข็นแล้ว",
        description: `เพิ่มสินค้า ${amount} ${amount === 1 ? itemLabel.slice(0, -1) : itemLabel}`,
        type: "success",
      });
      return true;
    } catch (error) {
      const message = error instanceof ApiError && error.status === 409
        ? error.code === "CANNOT_BUY_OWN_LISTING"
          ? "ไม่สามารถซื้อสินค้าที่คุณเป็นผู้ขายเองได้"
          : error.code === "INSUFFICIENT_STOCK"
            ? "สินค้าเหลือไม่พอตามจำนวนที่เลือก กรุณาปรับจำนวนแล้วลองอีกครั้ง"
            : error.message
        : error instanceof Error
          ? error.message
          : "เพิ่มสินค้าไม่สำเร็จ กรุณาลองอีกครั้ง";
      toast.add({ title: "เพิ่มลงรถเข็นไม่สำเร็จ", description: message, type: "error" });
      return false;
    }
  }

  async function handleAddToCart() {
    if (!purchasableListing || selectedQuantity > availableForSelectedListing) return;
    await addListingToCart(purchasableListing.id, selectedQuantity);
  }

  async function handleBuyNow() {
    if (!purchasableListing || selectedQuantity > availableForSelectedListing) return;
    if (isAuthLoading) return;
    if (!isAuthenticated) {
      navigate("/login", {
        state: { from: { pathname: `/products/${encodeURIComponent(product.slug)}` } },
      });
      return;
    }

    setIsBuyingNow(true);
    try {
      const addedItem = await addCartItem.mutateAsync({
        listingId: purchasableListing.id,
        quantity: selectedQuantity,
      });
      // Checkout currently submits cart-item IDs to the backend. Keep the
      // product/listing IDs for context, but identify this purchase by the
      // exact cart item returned by the add request.
      const params = new URLSearchParams({
        items: String(addedItem.id),
        productId: String(product.id),
        listingId: String(purchasableListing.id),
      });
      navigate(`/checkout?${params.toString()}`);
    } catch (error) {
      const message = error instanceof ApiError && error.status === 409
        ? error.code === "CANNOT_BUY_OWN_LISTING"
          ? "ไม่สามารถซื้อสินค้าที่คุณเป็นผู้ขายเองได้"
          : error.code === "INSUFFICIENT_STOCK"
            ? "สินค้าเหลือไม่พอตามจำนวนที่เลือก กรุณาปรับจำนวนแล้วลองอีกครั้ง"
            : error.message
        : error instanceof Error
          ? error.message
          : "ดำเนินการซื้อไม่สำเร็จ กรุณาลองอีกครั้ง";
      toast.add({ title: "ซื้อสินค้าไม่สำเร็จ", description: message, type: "error" });
    } finally {
      setIsBuyingNow(false);
    }
  }

  function changeVariant(value: string) {
    setSelectedVariant(value);
    setSelectedCondition("");
    setSelectedImageId(null);
    setPage(0);
  }

  function changeCondition(value: CardCondition | "") {
    setSelectedCondition(value);
    setPage(0);
  }

  return (
    <div className="flex-1 bg-[#F4F4F5] font-sans text-foreground">
      <main className="mx-auto flex w-full max-w-[1200px] flex-col gap-8 px-5 py-8 sm:px-6 lg:py-10">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-primary">Home</Link>
          <ChevronRight className="size-4" />
          <Link to="/products" className="hover:text-primary">Products</Link>
          <ChevronRight className="size-4" />
          {gameName && <><span>{gameName}</span><ChevronRight className="size-4" /></>}
          <span className="font-medium text-foreground">{product.name}</span>
        </nav>

        <section className="grid gap-8 lg:grid-cols-[minmax(0,1.03fr)_minmax(390px,.97fr)] lg:gap-12">
          <div className={`grid min-w-0 gap-4 ${gallery.length > 0 ? "sm:grid-cols-[78px_minmax(0,1fr)]" : "sm:grid-cols-1"}`}>
            {gallery.length > 0 && <div className="order-2 flex gap-3 overflow-x-auto sm:order-1 sm:flex-col">
              {gallery.map((image, index) => (
                <button key={image.id} type="button" onClick={() => setSelectedImageId(image.id)}
                  aria-label={`ดูรูปสินค้าที่ ${index + 1}`} aria-pressed={currentImage?.id === image.id}
                  className={`flex aspect-[3/4] w-[70px] shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 bg-white p-1.5 transition sm:w-full ${currentImage?.id === image.id ? "border-primary shadow-sm" : "border-transparent hover:border-primary/40"}`}>
                  <ProductImage key={image.url} src={image.url} alt={image.altText ?? product.name} className="h-full w-full object-contain" />
                </button>
              ))}
            </div>}
            <div className="order-1 flex min-h-[500px] flex-col items-center justify-center gap-4 rounded-2xl border bg-white p-8 shadow-sm sm:order-2 lg:min-h-[620px]">
              {currentImage ? (
                <ProductImage key={currentImage.url} src={currentImage.url} alt={currentImage.altText ?? product.name}
                  className="max-h-[560px] w-full object-contain drop-shadow-[0_18px_24px_rgba(24,24,27,0.22)]" />
              ) : <p className="text-center text-sm text-muted-foreground">ยังไม่มีรูปสินค้า</p>}
              {!currentImage && <Button variant="ghost" size="sm" onClick={onRefresh} disabled={refreshing} className="text-sm text-muted-foreground">
                {refreshing ? "กำลังโหลด..." : "โหลดรูปใหม่"}
              </Button>}
            </div>
          </div>

          <div className="flex min-w-0 flex-col gap-6">
            <div>
              <div className="mb-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary">{gameName ?? PRODUCT_TYPE_LABELS[product.productType]}</span>
                {product.rarityCode && <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">{product.rarityCode}</span>}
              </div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{product.name}{product.cardNumber && <span className="ml-2 text-muted-foreground">#{product.cardNumber.split("/")[0]}</span>}</h1>
              <p className="mt-2 min-h-6 text-muted-foreground">{[product.nameLocal, product.cardNumber].filter(Boolean).join(" · ") || "—"}</p>
            </div>

            <Card className="gap-0 rounded-2xl border bg-white p-0 shadow-none">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div><p className="text-sm font-medium text-muted-foreground">Market price</p><p className="mt-1 text-4xl font-bold">—</p></div>
                  <div className="rounded-xl bg-muted px-3 py-2 text-right text-xs font-semibold text-muted-foreground"><span className="block text-sm">—</span>last 30 days</div>
                </div>
                <div className="mt-5 grid grid-cols-3 gap-2 border-t pt-4 text-sm">
                  <div><span className="block text-xs text-muted-foreground">Last sold</span><strong>—</strong></div>
                  <div><span className="block text-xs text-muted-foreground">Listed from</span><strong>{listingsReady && firstListing ? formatPrice(firstListing.price, firstListing.currency) : "—"}</strong></div>
                  <div><span className="block text-xs text-muted-foreground">Available</span><strong>{listingsReady ? `${availableQuantity} ${itemLabel}` : "—"}</strong></div>
                </div>
              </CardContent>
            </Card>

            <div>
              <label htmlFor="variant" className="mb-3 block font-bold">Select variant</label>
              <select id="variant" value={selectedVariant} onChange={(event) => changeVariant(event.target.value)} className="h-12 w-full rounded-xl border bg-white px-4 text-sm">
                <option value="">All variants</option>
                {variants.map((variant) => <option key={variant.id} value={variant.id}>{[variant.languageCode, variant.finish !== "NOT_APPLICABLE" ? variant.finish : null, variant.edition !== "NOT_APPLICABLE" ? variant.edition : null, variant.printingNote].filter(Boolean).join(" / ")}</option>)}
              </select>
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="font-bold">Select condition</h2>
                {effectiveCondition && <button type="button" onClick={() => changeCondition("")} className="text-sm font-semibold text-primary hover:underline">All conditions</button>}
              </div>
              <div className="grid gap-3 sm:grid-cols-3" role="group" aria-label="Select condition">
                {conditionOptions.map((condition) => {
                  const offer = variantListings.find((row) => row.condition === condition);
                  const enabled = Boolean(offer) && listingsReady;
                  return (
                    <button key={condition} type="button" disabled={!enabled}
                      aria-pressed={effectiveCondition === condition}
                      onClick={() => changeCondition(condition)}
                      className={["flex min-h-[86px] flex-col rounded-xl border-2 bg-white p-3 text-left transition focus-visible:outline-2 focus-visible:outline-primary", effectiveCondition === condition ? "border-primary ring-2 ring-primary/10" : "border-border", enabled ? "hover:border-primary/40" : "cursor-not-allowed"].join(" ")}>
                      <span className="text-sm font-bold">{condition}</span>
                      <span className="text-xs text-muted-foreground">{CONDITION_LABELS[condition]}</span>
                      <span className="mt-auto pt-2 text-sm font-semibold">{offer ? formatPrice(offer.price, offer.currency) : "—"}</span>
                    </button>
                  );
                })}
              </div>
              {listingsQuery.isPending && <p role="status" className="mt-2 text-[13px] text-muted-foreground">กำลังโหลดราคา...</p>}
              {listingsQuery.isError && <p role="alert" className="mt-2 text-[13px] text-muted-foreground">โหลดราคาไม่สำเร็จ</p>}
            </div>

            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold">Quantity</p>
                <p className="text-xs text-muted-foreground">{availableForSelectedListing > 0 ? `${availableForSelectedListing} available from ${purchasableListing?.seller.displayName || purchasableListing?.seller.username}` : "Out of stock"}</p>
              </div>
              <div className="flex items-center rounded-lg border bg-white">
                <Button type="button" variant="ghost" size="icon" aria-label="ลดจำนวนสินค้า" disabled={!purchasableListing || selectedQuantity <= 1 || addCartItem.isPending || isBuyingNow} onClick={() => setQuantitySelection({ listingId: purchasableListing?.id ?? null, quantity: Math.max(1, selectedQuantity - 1) })}>
                  <Minus className="size-4" />
                </Button>
                <span aria-live="polite" aria-label={`จำนวน ${selectedQuantity}`} className="min-w-10 text-center text-sm font-semibold">{selectedQuantity}</span>
                <Button type="button" variant="ghost" size="icon" aria-label="เพิ่มจำนวนสินค้า" disabled={!purchasableListing || selectedQuantity >= availableForSelectedListing || addCartItem.isPending || isBuyingNow} onClick={() => setQuantitySelection({ listingId: purchasableListing?.id ?? null, quantity: Math.min(availableForSelectedListing, selectedQuantity + 1) })}>
                  <Plus className="size-4" />
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button type="button" className="h-14 text-base font-bold shadow-md" disabled={!purchasableListing || addCartItem.isPending || isBuyingNow || selectedQuantity > availableForSelectedListing || isAuthLoading} onClick={() => void handleBuyNow()}>
                {isBuyingNow ? <Loader2 className="size-5 animate-spin" /> : <ShoppingCart className="size-5" />}
                {availableForSelectedListing === 0 ? "Out of Stock" : isAuthLoading ? "Loading…" : "Buy now"}{purchasableListing ? ` · ${formatPrice(purchasableListing.price, purchasableListing.currency)}` : ""}
              </Button>
              <Button type="button" variant="outline" className="h-14 text-base font-bold" disabled={!purchasableListing || addCartItem.isPending || isBuyingNow || selectedQuantity > availableForSelectedListing} onClick={() => void handleAddToCart()}>
                {addCartItem.isPending && !isBuyingNow ? <Loader2 className="size-5 animate-spin" /> : <ShoppingCart className="size-5" />}
                {availableForSelectedListing === 0 ? "Out of Stock" : "Add to cart"}
              </Button>
            </div>
            <div className="grid grid-cols-3 divide-x rounded-2xl border bg-white px-2 py-4 text-center">
              <div className="px-2"><Truck className="mx-auto mb-2 size-5 text-primary" /><p className="text-xs font-semibold">Tracked shipping</p></div>
              <div className="px-2"><ShieldCheck className="mx-auto mb-2 size-5 text-primary" /><p className="text-xs font-semibold">Buyer protection</p></div>
              <div className="px-2"><BadgeCheck className="mx-auto mb-2 size-5 text-primary" /><p className="text-xs font-semibold">Verified sellers</p></div>
            </div>
          </div>
        </section>

        <section className="min-w-0 rounded-2xl border bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-6 flex items-end justify-between gap-3">
            <div><p className="text-sm font-semibold text-primary">{listingsReady ? `${availableQuantity} available` : "— available"}</p><h2 className="mt-1 text-2xl font-bold">Market listings</h2></div>
            <Link to={`/products/${encodeURIComponent(product.slug)}/listings`} className="rounded-md px-1 py-2 text-sm font-semibold text-primary hover:underline focus-visible:outline-2 focus-visible:outline-primary">View all</Link>
          </div>
          {listingsQuery.isPending ? <p role="status" className="py-10 text-center text-sm text-muted-foreground">กำลังโหลดประกาศขาย...</p> : listingsQuery.isError ? (
            <div role="alert" className="space-y-3 py-8 text-center"><p>โหลดประกาศขายไม่สำเร็จ</p><Button onClick={() => void listingsQuery.refetch()}>ลองใหม่</Button></div>
          ) : !hasListings ? <p className="py-12 text-center text-sm text-muted-foreground">ยังไม่มีผู้ขายสำหรับตัวเลือกนี้</p> : (
            <div className="divide-y">
              {visibleListings.map((listing) => (
                <article key={listing.id} className="grid gap-4 py-5 first:pt-0 last:pb-0 sm:grid-cols-[minmax(0,1.3fr)_minmax(0,.8fr)_minmax(0,.8fr)_auto] sm:items-center">
                  <div className="min-w-0"><Link to={`/u/${encodeURIComponent(listing.seller.username)}`} className="block truncate font-bold hover:text-primary hover:underline">{listing.seller.displayName || listing.seller.username}</Link><p className="mt-1 truncate text-sm text-muted-foreground">@{listing.seller.username}</p></div>
                  <div><span className="block text-xs text-muted-foreground">Condition</span><strong className="text-sm">{CONDITION_LABELS[listing.condition]}</strong><p className="mt-1 text-xs text-muted-foreground">{listing.card.variantLabel}</p></div>
                  <div><span className="block text-xs text-muted-foreground">Delivery</span><strong className="text-sm">—</strong><p className="mt-1 text-xs text-muted-foreground">{listing.quantityAvailable} available</p></div>
                  <div className="flex items-center gap-[14px] sm:justify-end"><strong className="whitespace-nowrap text-[17.5px] leading-[24.5px]">{new Intl.NumberFormat("th-TH", { style: "currency", currency: listing.currency, maximumFractionDigits: 0 }).format(listing.price)}</strong><Button type="button" className="h-[31.5px] w-[58.74px] px-0 text-[12.25px]" disabled={listing.quantityAvailable <= 0 || addCartItem.isPending || isBuyingNow} onClick={() => void addListingToCart(listing.id, 1)}>{addCartItem.isPending ? <Loader2 className="size-4 animate-spin" /> : "Add"}</Button><Button className="h-[31.5px] w-[66px] rounded-full bg-[#22292B] px-0 text-[12.25px] font-normal text-white hover:bg-[#22292B]/80" render={<Link to={`/listings/${listing.id}`} aria-label={`ดูรายละเอียดสินค้าของ ${listing.seller.displayName || listing.seller.username}`} />}>more</Button></div>
                </article>
              ))}
            </div>
          )}
          {listingsReady && pageCount > 1 && <nav aria-label="หน้าประกาศขาย" className="mt-5 flex items-center justify-between gap-3 border-t pt-4"><Button variant="outline" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>ก่อนหน้า</Button><span className="text-[13px]">{currentPage + 1} / {pageCount}</span><Button variant="outline" disabled={currentPage + 1 >= pageCount} onClick={() => setPage(currentPage + 1)}>ถัดไป</Button></nav>}
        </section>

        <section className="min-w-0 rounded-2xl border bg-white p-6 shadow-none">
          <div className="mb-3">
            <h2 className="text-lg font-semibold leading-6">Collectors with this {product.productType === "SINGLE_CARD" ? "card" : "product"}</h2>
            <p className="text-xs leading-4 text-muted-foreground">People who have made this {product.productType === "SINGLE_CARD" ? "card" : "product"} public · {collectorsQuery.data?.totalItems ?? "—"} collectors</p>
          </div>
          {collectorsQuery.isPending ? (
            <p role="status" className="py-10 text-center text-sm text-muted-foreground">กำลังโหลดนักสะสม...</p>
          ) : collectorsQuery.isError ? (
            <div role="alert" className="space-y-3 py-8 text-center">
              <p>โหลดรายชื่อนักสะสมไม่สำเร็จ</p>
              <Button onClick={() => void collectorsQuery.refetch()}>ลองใหม่</Button>
            </div>
          ) : collectorsQuery.data.items.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">ยังไม่มีนักสะสมที่เปิดการ์ดใบนี้เป็นสาธารณะ</p>
          ) : (
            <div className="divide-y">
              {collectorsQuery.data.items.map((collector) => (
                <article key={collector.username} className="flex min-h-16 items-center justify-between gap-4 py-2">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar size="lg">
                      {collector.avatarUrl && <AvatarImage src={collector.avatarUrl} alt="" />}
                      <AvatarFallback>{(collector.displayName || collector.username).split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold leading-5">{collector.displayName || collector.username}</h3>
                      <p className="truncate text-xs leading-4 text-muted-foreground">@{collector.username} · {collector.quantity} {collector.quantity === 1 ? itemLabel.slice(0, -1) : itemLabel}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <Badge variant="secondary">In catalog</Badge>
                    <Button variant="outline" size="sm" render={<Link to={`/collectors/${encodeURIComponent(collector.username)}?from=${encodeURIComponent(product.slug)}`} state={{ displayName: collector.displayName, avatarUrl: collector.avatarUrl }} />}>View profile</Button>
                  </div>
                </article>
              ))}
            </div>
          )}
          {collectorsQuery.data && collectorsQuery.data.totalPages > 1 && (
            <nav aria-label="หน้านักสะสม" className="mt-5 flex items-center justify-between gap-3 border-t pt-4">
              <Button variant="outline" disabled={collectorPage === 0} onClick={() => setCollectorPage(collectorPage - 1)}>ก่อนหน้า</Button>
              <span className="text-[13px]">{collectorPage + 1} / {collectorsQuery.data.totalPages}</span>
              <Button variant="outline" disabled={collectorPage + 1 >= collectorsQuery.data.totalPages} onClick={() => setCollectorPage(collectorPage + 1)}>ถัดไป</Button>
            </nav>
          )}
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card className="gap-0 rounded-2xl border bg-white p-0 shadow-none"><CardContent className="p-6 sm:p-7">
            <h2 className="mb-6 flex items-center gap-3 text-2xl font-bold"><Sparkles className="size-5 text-primary" />Card attributes</h2>
            <dl className="grid grid-cols-2 gap-x-8 gap-y-5 text-sm">{attributeRows.map(([label, value]) => <div key={label}><dt className="text-muted-foreground">{label}</dt><dd className="mt-1 break-words font-semibold">{value}</dd></div>)}</dl>
            {product.description && <p className="mt-5 whitespace-pre-wrap border-t pt-4 text-sm leading-relaxed text-muted-foreground">{product.description}</p>}
          </CardContent></Card>
          {product.productType === "SINGLE_CARD" && (
            <Card className="gap-0 rounded-2xl border bg-white p-0 shadow-none"><CardContent className="p-6 sm:p-7">
              <h2 className="mb-6 flex items-center gap-3 text-2xl font-bold"><PackageCheck className="size-5 text-primary" />Abilities &amp; Attacks</h2>
              {effectsQuery.isPending ? (
                <p role="status" className="text-sm text-muted-foreground">กำลังโหลดความสามารถการ์ด...</p>
              ) : effectsQuery.isError ? (
                <div role="alert" className="space-y-2 text-sm"><p>โหลดความสามารถการ์ดไม่สำเร็จ</p><Button variant="outline" onClick={() => void effectsQuery.refetch()}>ลองใหม่</Button></div>
              ) : effects.length === 0 ? (
                <p className="text-sm text-muted-foreground">ยังไม่มีข้อมูลความสามารถและท่าโจมตีของการ์ดใบนี้</p>
              ) : (
                <div className="divide-y">
                  {effects.map((effect, index) => (
                    <div key={`${effect.effectType}-${effect.displayOrder}-${index}`} className="py-4 first:pt-0 last:pb-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary">{effect.effectType === "ABILITY" ? "Ability" : effect.effectType === "ATTACK" ? "Attack" : "Rule"}</Badge>
                        <h3 className="font-semibold">{effect.name}</h3>
                        {effect.damage !== null && <strong className="ml-auto text-lg">{effect.damage}</strong>}
                      </div>
                      {effect.energyCost.length > 0 && <p className="mt-2 text-xs text-muted-foreground">Energy: {effect.energyCost.join(" · ")}</p>}
                      {effect.effectText && <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{effect.effectText}</p>}
                    </div>
                  ))}
                </div>
              )}

            </CardContent></Card>
          )}
        </section>
      </main>
    </div>
  );
}
