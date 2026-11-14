import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ShoppingCart, ChevronRight, Minus, Plus, Loader2, LibraryBig } from "lucide-react";

import { DetailPageSkeleton, ListRowsSkeleton } from "@/components/common/PageSkeletons";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/features/auth/auth.queries";
import { addToCartErrorMessage } from "@/features/cart/cart.format";
import { useMiniCart } from "@/features/cart/mini-cart.store";
import { useAddCartItem } from "@/features/cart/cart.queries";
import { initialsOf } from "@/features/account/account.format";
import { CONDITION_LABELS, PRODUCT_TYPE_LABELS, localNameOnly, marketForListing } from "../catalog.mappers";
import { effectivePrice } from "@/components/sale";
import { ListingRowPrice } from "@/features/sale/components/ListingRowPrice";
import { notifyAddedAtSalePrice } from "@/features/sale/sale.notify";
import { CardAttributesCard, CardEffectsCard, ProductBadges, ProductGallery, TrustStrip } from "../components/ProductDetailSections";
import { ListingSeller } from "../ListingSeller";
import { ProductAuctionBox } from "../components/ProductAuctionBox";
import { formatListingDelivery } from "../listing.format";
import { useGameList, useProductCollectors, useProductDetail, useProductListings, useProductMarket } from "../catalog.queries";
import type { CardCondition, ProductDetailDto } from "../catalog.types";
import { addViewedProduct } from "../search/search-history";
import { usePageTitle } from "@/hooks/use-page-title";
import { AddCardsDialog } from "@/features/collection/components/AddCardsDialog";
import { intlLocale, useTranslate, formatMoney } from "@/lib/i18n";


/** ค่าของตัวเลือก "All variants" ใน Select (แบบเดียวกับ ALL ใน UsersToolbar) — state ในหน้ายังเก็บเป็น "" เหมือนเดิม */
const ALL_VARIANTS = "all";

function formatPrice(amount: number) {
  return formatMoney(amount);
}

export function ProductDetailPage() {
  const { t } = useTranslate("buyer");
  const { productId } = useParams<{ productId: string }>();

  const productQuery = useProductDetail(productId);
  usePageTitle(productQuery.data?.product.name);

  if (!productId) {
    return (
        <div className="p-8 text-center">
          <h1 className="text-xl font-bold">{t("product.missingId", "ไม่พบรหัสสินค้า")}</h1>
          <Link to="/products" className="mt-4 inline-block underline">
            {t("product.backToList", "กลับหน้ารายการสินค้า")}
          </Link>
        </div>
    );
  }

  if (productQuery.isPending) {
    return <DetailPageSkeleton label={t("product.loading", "กำลังโหลดสินค้า")} />;
  }

  if (productQuery.isError) {
    const notFound =
        productQuery.error instanceof ApiError &&
        productQuery.error.status === 404;

    return (
        <div role="alert" className="space-y-4 p-8 text-center">
          <h1 className="text-xl font-bold">
            {notFound ? t("product.notFound", "ไม่พบสินค้านี้") : t("product.loadFailed", "โหลดสินค้าไม่สำเร็จ")}
          </h1>

          <p className="text-muted-foreground">
            {notFound
                ? t("product.notFoundHint", "สินค้านี้อาจถูกนำออก หรือ URL ไม่ถูกต้อง")
                : t("product.loadFailedHint", "กรุณาตรวจสอบการเชื่อมต่อแล้วลองอีกครั้ง")}
          </p>

          {!notFound && (
              <Button onClick={() => void productQuery.refetch()}>
                {t("actions.retry", "ลองใหม่", { ns: "common" })}
              </Button>
          )}

          <div>
            <Link to="/products" className="underline">
              {t("product.backToList", "กลับหน้ารายการสินค้า")}
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
  const { t } = useTranslate("buyer");
  const { product, variants, images } = data;
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const addCartItem = useAddCartItem();
  const miniCart = useMiniCart();
  const [savingToCollection, setSavingToCollection] = useState(false);
  const itemCount = (count: number) =>
    product.productType === "SINGLE_CARD"
      ? t("product.cardCount", "{count, plural, other {# ใบ}}", { count })
      : t("product.itemCount", "{count, plural, other {# รายการ}}", { count });
  const variantItems = [
    { value: ALL_VARIANTS, label: t("product.allVariants", "ทุกเวอร์ชัน") },
    ...variants.map((variant) => ({
      value: String(variant.id),
      label: [variant.languageCode, variant.finish !== "NOT_APPLICABLE" ? variant.finish : null, variant.edition !== "NOT_APPLICABLE" ? variant.edition : null, variant.printingNote].filter(Boolean).join(" / "),
    })),
  ];

  const [selectedImageId, setSelectedImageId] = useState<number | null>(
      null,
  );
  const [selectedVariant, setSelectedVariant] = useState("");
  const [selectedCondition, setSelectedCondition] = useState<CardCondition | "">("");
  const [collectorPage, setCollectorPage] = useState(0);
  const [quantitySelection, setQuantitySelection] = useState<{
    listingId: number | null;
    quantity: number;
  }>({ listingId: null, quantity: 1 });
  const [isBuyingNow, setIsBuyingNow] = useState(false);

  const listingsQuery = useProductListings(product.id);
  const marketQuery = useProductMarket(product.id);
  const collectorsQuery = useProductCollectors(product.id, collectorPage);
  const gamesQuery = useGameList();

  const listings = listingsQuery.data ?? [];

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

  const listingPreviewLimit = 10;
  const visibleListings = filteredListings.slice(0, listingPreviewLimit);
  const hasMoreListings = filteredListings.length > listingPreviewLimit;

  const conditionOptions: CardCondition[] = product.productType === "SINGLE_CARD"
      ? [...new Set<CardCondition>(["NM", "LP", "MP", ...availableConditions])]
      : availableConditions;
  const firstListing = filteredListings[0];
  const market = marketForListing(marketQuery.data, firstListing);
  const change30d = market?.change30dPercent;
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

  // "ดูล่าสุด" ใน dropdown ค้นหา [TCG-776] — บันทึกเมื่อรู้ราคาแล้ว
  const viewedImage = gallery[0]?.url ?? listings[0]?.card.officialImageUrl ?? null;
  const viewedPrices = listings.map((listing) => effectivePrice(listing.pricing, listing.price));
  const viewedLowest = viewedPrices.length > 0 ? Math.min(...viewedPrices) : null;
  const viewedSellers = new Set(listings.map((listing) => listing.seller.username)).size;
  useEffect(() => {
    if (!listingsReady) return;
    addViewedProduct({
      slug: product.slug,
      name: product.name,
      // ไม่เก็บเลขการ์ดลง localStorage — CodeQL มองชื่อ cardNumber เป็นข้อมูลบัตร
      subtitle: gameName ?? null,
      imageUrl: viewedImage,
      lowestPrice: viewedLowest,
      sellerCount: viewedSellers,
    });
  }, [listingsReady, product.slug, product.name, gameName, viewedImage, viewedLowest, viewedSellers]);

  async function addListingToCart(listingId: number, amount: number, trigger?: HTMLElement) {
    const opening = miniCart.capture(listingId, trigger);
    try {
      await addCartItem.mutateAsync({ listingId, quantity: amount });
      const added = listings.find((item) => item.id === listingId);
      miniCart.open(opening);
      if (added) notifyAddedAtSalePrice(added.card.productName, amount, added.pricing);
      return true;
    } catch (error) {
      toast.add({ title: t("product.addToCartFailed", "เพิ่มลงรถเข็นไม่สำเร็จ"), description: addToCartErrorMessage(error), type: "error" });
      return false;
    }
  }

  async function handleAddToCart(trigger?: HTMLElement) {
    if (!purchasableListing || selectedQuantity > availableForSelectedListing) return;
    await addListingToCart(purchasableListing.id, selectedQuantity, trigger);
  }

  function handleSaveToCollection() {
    if (isAuthLoading) return;
    if (!isAuthenticated) {
      navigate("/login", { state: { from: { pathname: `/products/${encodeURIComponent(product.slug)}` } } });
      return;
    }
    setSavingToCollection(true);
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
      toast.add({
        title: t("product.buyFailed", "ซื้อสินค้าไม่สำเร็จ"),
        description: addToCartErrorMessage(error, t("product.buyFailedHint", "ดำเนินการซื้อไม่สำเร็จ กรุณาลองอีกครั้ง")),
        type: "error",
      });
    } finally {
      setIsBuyingNow(false);
    }
  }

  function changeVariant(value: string) {
    setSelectedVariant(value);
    setSelectedCondition("");
    setSelectedImageId(null);
  }

  function changeCondition(value: CardCondition | "") {
    setSelectedCondition(value);
  }

  return (
    <div className="flex-1 bg-secondary font-sans text-foreground">
      <main className="mx-auto flex w-full max-w-[1200px] flex-col gap-8 px-5 py-8 sm:px-6 lg:py-10">
        <nav aria-label={t("product.breadcrumb", "เส้นทางนำทาง")} className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-primary">{t("nav.home", "หน้าแรก", { ns: "common" })}</Link>
          <ChevronRight className="size-4" />
          <Link to="/products" className="hover:text-primary">{t("product.products", "สินค้า")}</Link>
          <ChevronRight className="size-4" />
          {gameName && <><span>{gameName}</span><ChevronRight className="size-4" /></>}
          <span className="font-medium text-foreground">{product.name}</span>
        </nav>

        <section className="grid gap-8 lg:grid-cols-[minmax(0,1.03fr)_minmax(390px,.97fr)] lg:gap-12">
          <ProductGallery
            images={gallery.map((image) => ({ id: image.id, url: image.url, alt: image.altText ?? product.name }))}
            selectedId={selectedImageId}
            onSelect={(id) => setSelectedImageId(Number(id))}
            emptyAction={
              <Button variant="ghost" size="sm" onClick={onRefresh} disabled={refreshing} className="text-sm text-muted-foreground">
                {refreshing ? t("product.refreshing", "กำลังโหลด...") : t("product.reloadImages", "โหลดรูปใหม่")}
              </Button>
            }
          />

          <div className="flex min-w-0 flex-col gap-6">
            <div>
              <div className="flex items-start justify-between gap-3">
                <ProductBadges game={gameName ?? PRODUCT_TYPE_LABELS[product.productType]} rarity={product.rarityCode} />
                <Button type="button" variant="outline" className="shrink-0 rounded-full border-primary/30 bg-card font-semibold text-primary hover:bg-primary/5 hover:text-primary" disabled={isAuthLoading} onClick={handleSaveToCollection}>
                  <LibraryBig className="size-4" />
                  {t("product.saveToCollection", "บันทึกลงคอลเลกชัน")}
                </Button>
              </div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{product.name}{product.cardNumber && <span className="ml-2 text-muted-foreground">#{product.cardNumber.split("/")[0]}</span>}</h1>
              {[localNameOnly(product.nameLocal), product.cardNumber].some(Boolean) && <p className="mt-2 min-h-6 text-muted-foreground">{[localNameOnly(product.nameLocal), product.cardNumber].filter(Boolean).join(" · ")}</p>}
            </div>

            <Card className="gap-0 rounded-2xl border bg-card p-0 shadow-none">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div><p className="text-sm font-medium text-muted-foreground">{t("product.marketPrice", "ราคาตลาด")}</p><p className="mt-1 text-4xl font-bold">{market?.medianPrice != null ? formatPrice(market.medianPrice) : "—"}</p></div>
                  <div className={`rounded-xl px-3 py-2 text-right text-xs font-semibold ${change30d == null ? "bg-muted text-muted-foreground" : change30d < 0 ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}><span className="block text-sm">{change30d == null ? "—" : `${change30d < 0 ? "↓" : "↑"} ${Math.abs(change30d).toLocaleString(intlLocale(), { maximumFractionDigits: 2 })}%`}</span>{t("product.last30Days", "30 วันล่าสุด")}</div>
                </div>
                {market?.lowSample && <p className="mt-2 text-xs text-muted-foreground">{t("product.lowSampleDetail", "ข้อมูลราคายังน้อย (น้อยกว่า 3 รายการ)")}</p>}
                <div className="mt-5 grid grid-cols-3 gap-2 border-t pt-4 text-sm">
                  <div><span className="block text-xs text-muted-foreground">{t("product.lastSold", "ขายล่าสุด")}</span><strong>{market?.lastSold ? formatPrice(market.lastSold.price) : "—"}</strong></div>
                  <div><span className="block text-xs text-muted-foreground">{t("product.listedFrom", "ราคาเริ่มต้น")}</span><strong>{listingsReady && firstListing ? formatPrice(effectivePrice(firstListing.pricing, firstListing.price)) : "—"}</strong></div>
                  <div><span className="block text-xs text-muted-foreground">{t("product.available", "พร้อมขาย")}</span><strong>{listingsReady ? itemCount(availableQuantity) : "—"}</strong></div>
                </div>
              </CardContent>
            </Card>

            <div>
              <p className="mb-3 font-bold">{t("product.selectVariant", "เลือกเวอร์ชัน")}</p>
              <Select
                items={variantItems}
                value={selectedVariant || ALL_VARIANTS}
                onValueChange={(value) => changeVariant(!value || value === ALL_VARIANTS ? "" : value)}
              >
                <SelectTrigger aria-label={t("product.selectVariant", "เลือกเวอร์ชัน")} className="h-12 w-full rounded-xl border-border bg-card px-4">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {variantItems.map((item) => (
                      <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="font-bold">{t("product.selectCondition", "เลือกสภาพ")}</h2>
                {effectiveCondition && <button type="button" onClick={() => changeCondition("")} className="text-sm font-semibold text-primary hover:underline">{t("product.allConditions", "ทุกสภาพ")}</button>}
              </div>
              <div className="grid gap-3 sm:grid-cols-3" role="group" aria-label={t("product.selectCondition", "เลือกสภาพ")}>
                {conditionOptions.map((condition) => {
                  const offer = variantListings.find((row) => row.condition === condition);
                  const enabled = Boolean(offer) && listingsReady;
                  return (
                    <button key={condition} type="button" disabled={!enabled}
                      aria-pressed={effectiveCondition === condition}
                      onClick={() => changeCondition(condition)}
                      className={["flex min-h-[86px] flex-col rounded-xl border-2 bg-card p-3 text-left transition focus-visible:outline-2 focus-visible:outline-primary", effectiveCondition === condition ? "border-primary ring-2 ring-primary/10" : "border-border", enabled ? "hover:border-primary/40" : "cursor-not-allowed"].join(" ")}>
                      <span className="text-sm font-bold">{condition}</span>
                      <span className="text-xs text-muted-foreground">{CONDITION_LABELS[condition]}</span>
                      <span className="mt-auto pt-2 text-sm font-semibold">{offer ? formatPrice(effectivePrice(offer.pricing, offer.price)) : "—"}</span>
                    </button>
                  );
                })}
              </div>
              {listingsQuery.isPending && <p role="status" className="mt-2 text-[13px] text-muted-foreground">{t("product.loadingPrice", "กำลังโหลดราคา...")}</p>}
              {listingsQuery.isError && <p role="alert" className="mt-2 text-[13px] text-muted-foreground">{t("product.priceFailed", "โหลดราคาไม่สำเร็จ")}</p>}
            </div>

            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold">{t("product.quantity", "จำนวน")}</p>
                <p className="text-xs text-muted-foreground">{availableForSelectedListing > 0 ? t("product.availableFrom", "พร้อมขาย {count} ชิ้นจาก {seller}", { count: availableForSelectedListing, seller: (purchasableListing?.seller.displayName || purchasableListing?.seller.username) ?? "" }) : t("product.outOfStock", "สินค้าหมด")}</p>
              </div>
              <div className="flex items-center rounded-lg border bg-card">
                <Button type="button" variant="ghost" size="icon" aria-label={t("product.decreaseQuantity", "ลดจำนวนสินค้า")} disabled={!purchasableListing || selectedQuantity <= 1 || addCartItem.isPending || isBuyingNow} onClick={() => setQuantitySelection({ listingId: purchasableListing?.id ?? null, quantity: Math.max(1, selectedQuantity - 1) })}>
                  <Minus className="size-4" />
                </Button>
                <span aria-live="polite" aria-label={t("product.quantityValue", "จำนวน {count}", { count: selectedQuantity })} className="min-w-10 text-center text-sm font-semibold">{selectedQuantity}</span>
                <Button type="button" variant="ghost" size="icon" aria-label={t("product.increaseQuantity", "เพิ่มจำนวนสินค้า")} disabled={!purchasableListing || selectedQuantity >= availableForSelectedListing || addCartItem.isPending || isBuyingNow} onClick={() => setQuantitySelection({ listingId: purchasableListing?.id ?? null, quantity: Math.min(availableForSelectedListing, selectedQuantity + 1) })}>
                  <Plus className="size-4" />
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button type="button" className="h-14 text-base font-bold shadow-md" disabled={!purchasableListing || addCartItem.isPending || isBuyingNow || selectedQuantity > availableForSelectedListing || isAuthLoading} onClick={() => void handleBuyNow()}>
                {isBuyingNow ? <Loader2 className="size-5 animate-spin" /> : <ShoppingCart className="size-5" />}
                {availableForSelectedListing === 0 ? t("product.outOfStockButton", "สินค้าหมด") : isAuthLoading ? t("product.loadingButton", "กำลังโหลด…") : t("product.buyNow", "ซื้อทันที")}{purchasableListing ? ` · ${formatPrice(effectivePrice(purchasableListing.pricing, purchasableListing.price))}` : ""}
              </Button>
              <Button type="button" variant="outline" className="h-14 text-base font-bold" disabled={!purchasableListing || addCartItem.isPending || isBuyingNow || selectedQuantity > availableForSelectedListing} onClick={(event) => void handleAddToCart(event.currentTarget)}>
                {addCartItem.isPending && !isBuyingNow ? <Loader2 className="size-5 animate-spin" /> : <ShoppingCart className="size-5" />}
                {availableForSelectedListing === 0 ? t("product.outOfStockButton", "สินค้าหมด") : t("product.addToCart", "เพิ่มลงตะกร้า")}
              </Button>
            </div>
            <AddCardsDialog
              open={savingToCollection}
              onOpenChange={setSavingToCollection}
              initialCard={{
                productId: product.id,
                name: product.name,
                imageUrl: (images.find((image) => image.primary) ?? images[0])?.url ?? null,
                cardNumber: product.cardNumber,
                rarityCode: product.rarityCode,
              }}
              initialVariantId={selectedVariant ? Number(selectedVariant) : null}
            />
            {/* มีประมูลการ์ดรุ่นนี้เปิดอยู่ [TCG-636] */}
            <ProductAuctionBox
              variantIds={selectedVariant ? [Number(selectedVariant)] : variants.map((variant) => variant.id)}
              productName={product.name}
            />
            <TrustStrip />
          </div>
        </section>

        <section className="min-w-0 rounded-2xl border bg-card p-5 shadow-sm sm:p-7">
          <div className="mb-6">
            <div><p className="text-sm font-semibold text-primary">{listingsReady ? t("product.availableCount", "พร้อมขาย {count} ชิ้น", { count: availableQuantity }) : t("product.availableUnknown", "พร้อมขาย —")}</p><h2 className="mt-1 text-2xl font-bold">{t("product.marketListings", "ประกาศขายในตลาด")}</h2></div>
          </div>
          {listingsQuery.isPending ? <div role="status" aria-busy="true" aria-label={t("product.loadingListings", "กำลังโหลดประกาศขาย")}><ListRowsSkeleton rows={4} /></div> : listingsQuery.isError ? (
            <div role="alert" className="space-y-3 py-8 text-center"><p>{t("product.listingsFailed", "โหลดประกาศขายไม่สำเร็จ")}</p><Button onClick={() => void listingsQuery.refetch()}>{t("actions.retry", "ลองใหม่", { ns: "common" })}</Button></div>
          ) : !hasListings ? <p className="py-12 text-center text-sm text-muted-foreground">{t("product.noSellers", "ยังไม่มีผู้ขายสำหรับตัวเลือกนี้")}</p> : (
            <div className="divide-y">
              {visibleListings.map((listing) => (
                <article key={listing.id} className="grid gap-4 py-5 first:pt-0 last:pb-0 sm:grid-cols-[minmax(0,1.3fr)_minmax(0,.8fr)_minmax(0,.9fr)_auto] sm:items-center">
                  <ListingSeller seller={listing.seller} productSlug={product.slug} />
                  <div><span className="block text-xs text-muted-foreground">{t("product.condition", "สภาพ")}</span><strong className="text-sm">{CONDITION_LABELS[listing.condition]}</strong></div>
                  <div><span className="block text-xs text-muted-foreground">{t("product.delivery", "การจัดส่ง")}</span><strong className="text-sm">{formatListingDelivery(listing.delivery)}</strong></div>
                  <div className="flex flex-wrap items-center gap-3 sm:justify-end"><span className="min-w-20 whitespace-nowrap text-[17.5px] leading-[24.5px]"><ListingRowPrice price={listing.price} pricing={listing.pricing} /></span><Button type="button" className="h-10 min-w-20 rounded-full px-4 text-sm font-semibold" disabled={listing.quantityAvailable <= 0 || listing.delivery?.optionCount === 0 || addCartItem.isPending || isBuyingNow} onClick={(event) => void addListingToCart(listing.id, 1, event.currentTarget)}>{addCartItem.isPending ? <Loader2 className="size-4 animate-spin" /> : t("product.add", "เพิ่ม")}</Button><Button nativeButton={false} className="h-10 min-w-20 rounded-full bg-[#22292B] px-4 text-sm font-semibold text-white hover:bg-[#22292B]/80" render={<Link to={`/listings/${listing.id}`} aria-label={t("product.viewSellerListing", "ดูรายละเอียดสินค้าของ {seller}", { seller: listing.seller.displayName || listing.seller.username })} />}>{t("product.more", "เพิ่มเติม")}</Button></div>
                </article>
              ))}
            </div>
          )}
          {listingsReady && hasMoreListings && (
            <div className="relative mt-5 border-t pt-4">
              <div aria-hidden="true" className="pointer-events-none flex h-12 items-center justify-between gap-4 overflow-hidden opacity-40 blur-[5px]">
                <div className="h-4 w-1/4 rounded bg-muted-foreground/30" />
                <div className="h-4 w-1/5 rounded bg-muted-foreground/30" />
                <div className="h-4 w-1/6 rounded bg-muted-foreground/30" />
              </div>
              <div className="relative -mt-3 flex justify-center bg-gradient-to-t from-white via-white to-transparent px-3 pt-3">
                <Link to={`/products/${encodeURIComponent(product.slug)}/listings`} className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-8 text-sm font-semibold text-white transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">{t("product.viewAll", "ดูทั้งหมด")}</Link>
              </div>
            </div>
          )}
        </section>

        <section className="min-w-0 rounded-2xl border bg-card p-6 shadow-none">
          <div className="mb-3">
            <h2 className="text-lg font-semibold leading-6">Collectors with this {product.productType === "SINGLE_CARD" ? "card" : "product"}</h2>
            <p className="text-xs leading-4 text-muted-foreground">People who have made this {product.productType === "SINGLE_CARD" ? "card" : "product"} public · {collectorsQuery.data?.totalItems ?? "—"} collectors</p>
          </div>
          {collectorsQuery.isPending ? (
            <div role="status" aria-busy="true" aria-label={t("product.loadingCollectors", "กำลังโหลดนักสะสม")}><ListRowsSkeleton rows={3} /></div>
          ) : collectorsQuery.isError ? (
            <div role="alert" className="space-y-3 py-8 text-center">
              <p>{t("product.collectorsFailed", "โหลดรายชื่อนักสะสมไม่สำเร็จ")}</p>
              <Button onClick={() => void collectorsQuery.refetch()}>{t("actions.retry", "ลองใหม่", { ns: "common" })}</Button>
            </div>
          ) : collectorsQuery.data.items.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">{t("product.noCollectors", "ยังไม่มีนักสะสมที่เปิดการ์ดใบนี้เป็นสาธารณะ")}</p>
          ) : (
            <div className="divide-y">
              {collectorsQuery.data.items.map((collector) => (
                <article key={collector.username} className="flex min-h-16 items-center justify-between gap-4 py-2">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar size="lg">
                      {collector.avatarUrl && <AvatarImage src={collector.avatarUrl} alt="" />}
                      <AvatarFallback>{initialsOf(collector.displayName || collector.username)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold leading-5">{collector.displayName || collector.username}</h3>
                      <p className="truncate text-xs leading-4 text-muted-foreground">@{collector.username} · {itemCount(collector.quantity)}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <Badge variant="secondary">{t("product.inCatalog", "ในแคตตาล็อก")}</Badge>
                    <Button variant="outline" size="sm" render={<Link to={`/u/${encodeURIComponent(collector.username)}?tab=collection`} />}>{t("product.viewProfile", "ดูโปรไฟล์")}</Button>
                  </div>
                </article>
              ))}
            </div>
          )}
          {collectorsQuery.data && collectorsQuery.data.totalPages > 1 && (
            <nav aria-label={t("product.collectorPagination", "หน้านักสะสม")} className="mt-5 flex items-center justify-between gap-3 border-t pt-4">
              <Button variant="outline" disabled={collectorPage === 0} onClick={() => setCollectorPage(collectorPage - 1)}>{t("actions.previous", "ก่อนหน้า", { ns: "common" })}</Button>
              <span className="text-[13px]">{collectorPage + 1} / {collectorsQuery.data.totalPages}</span>
              <Button variant="outline" disabled={collectorPage + 1 >= collectorsQuery.data.totalPages} onClick={() => setCollectorPage(collectorPage + 1)}>{t("actions.next", "ถัดไป", { ns: "common" })}</Button>
            </nav>
          )}
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <CardAttributesCard product={product} />
          {product.productType === "SINGLE_CARD" && <CardEffectsCard productId={product.id} />}
        </section>
      </main>
    </div>
  );
}
