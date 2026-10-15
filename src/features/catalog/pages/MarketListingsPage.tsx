import { useState } from "react";
import { ChevronRight, Loader2 } from "lucide-react";
import { Link, useParams } from "react-router-dom";

import { ListRowsSkeleton } from "@/components/common/PageSkeletons";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { addToCartErrorMessage } from "@/features/cart/cart.format";
import { useAddCartItem } from "@/features/cart/cart.queries";
import { ApiError } from "@/lib/api";
import { CONDITION_LABELS, productHref } from "../catalog.mappers";
import { useGameList, useProductDetail, useProductListings } from "../catalog.queries";
import type { ProductDetailDto, PublicListingDto } from "../catalog.types";

const PAGE_SIZE = 20;

function formatListingPrice(amount: number, currency: string) {
  return new Intl.NumberFormat("th-TH", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

const RARITY_LABELS: Record<string, string> = {
  RR: "Double Rare",
  UR: "Ultra Rare",
  SAR: "Special Art Rare",
  SR: "Super Rare",
  SIR: "Special Illustration Rare",
};

export function MarketListingsPage() {
  const { productId } = useParams<{ productId: string }>();
  const productQuery = useProductDetail(productId);

  if (productQuery.isPending) {
    return <MarketListingsSkeleton />;
  }

  if (productQuery.isError) {
    const notFound = productQuery.error instanceof ApiError && productQuery.error.status === 404;
    return (
      <div role="alert" className="bg-[#f4f4f5] px-5 py-12 text-center">
        <h1 className="text-xl font-bold">{notFound ? "ไม่พบสินค้านี้" : "โหลดสินค้าไม่สำเร็จ"}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{notFound ? "กรุณาตรวจสอบลิงก์สินค้า" : "กรุณาลองใหม่อีกครั้ง"}</p>
        {notFound ? <Link className="mt-4 inline-block text-primary underline" to="/products">กลับหน้าสินค้า</Link> : <Button className="mt-4" onClick={() => void productQuery.refetch()}>ลองใหม่</Button>}
      </div>
    );
  }

  return <MarketListingsContent key={productQuery.data.product.id} data={productQuery.data} />;
}

/** วางตรงกับ MarketListingsContent — breadcrumb, หัวข้อ, การ์ดสรุปสินค้า, รายการประกาศขาย */
function MarketListingsSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="กำลังโหลดสินค้า" className="min-h-full bg-[#f4f4f5]">
      <div className="mx-auto flex w-full max-w-[1050px] flex-col gap-6 px-5 py-8 pb-12 sm:px-6">
        <Skeleton className="h-3.5 w-56 rounded-md" />
        <Skeleton className="h-9 w-64 rounded-lg" />
        <div className="flex items-center gap-[18px] rounded-2xl border border-[#e3e7e8] bg-white p-4 sm:p-[22px]">
          <Skeleton className="h-[140px] w-[130px] shrink-0 rounded-[10px]" />
          <div className="flex flex-1 flex-col gap-3">
            <Skeleton className="h-5 w-40 rounded-full" />
            <Skeleton className="h-7 w-3/5 rounded-md" />
            <Skeleton className="h-3.5 w-28 rounded-md" />
          </div>
        </div>
        <div className="rounded-2xl border border-[#e3e7e8] bg-white p-4 sm:p-[22px]">
          <Skeleton className="mb-3 h-7 w-48 rounded-md" />
          <ListRowsSkeleton rows={6} className="divide-[#e3e7e8]" />
        </div>
      </div>
    </div>
  );
}

function MarketListingsContent({ data }: { data: ProductDetailDto }) {
  const { product, images } = data;
  const listingsQuery = useProductListings(product.id);
  const gamesQuery = useGameList();
  const [page, setPage] = useState(0);
  const listings = listingsQuery.data ?? [];
  const pageCount = Math.max(1, Math.ceil(listings.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);
  const visibleListings = listings.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);
  const image = [...images].sort((a, b) => Number(b.primary) - Number(a.primary) || a.sortOrder - b.sortOrder)[0];
  const imageUrl = image?.url ?? listings[0]?.card.officialImageUrl;
  const gameName = gamesQuery.data?.find((game) => game.id === product.gameId)?.name;
  const title = `${product.name}${product.cardNumber ? ` #${product.cardNumber.split("/")[0]}` : ""}`;
  const addCartItem = useAddCartItem();
  const addingListingId = addCartItem.isPending ? addCartItem.variables?.listingId : undefined;

  /** ปุ่ม Add ใส่ทีละ 1 ชิ้น — อยากได้หลายชิ้นปรับจำนวนต่อในตะกร้า */
  async function addListingToCart(listing: PublicListingDto) {
    try {
      await addCartItem.mutateAsync({ listingId: listing.id, quantity: 1 });
      toast.add({
        title: "เพิ่มลงรถเข็นแล้ว",
        description: `${listing.seller.displayName || listing.seller.username} · ${CONDITION_LABELS[listing.condition]}`,
        type: "success",
      });
    } catch (error) {
      toast.add({ title: "เพิ่มลงรถเข็นไม่สำเร็จ", description: addToCartErrorMessage(error), type: "error" });
    }
  }

  return (
    <div className="min-h-full bg-[#f4f4f5] font-sans text-foreground">
      <main className="mx-auto flex w-full max-w-[1050px] flex-col gap-6 px-5 py-8 pb-12 sm:px-6">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-primary">Home</Link>
          <ChevronRight className="size-3.5" />
          <Link to={productHref(product.slug)} className="hover:text-primary">{title}</Link>
          <ChevronRight className="size-3.5" />
          <span className="font-medium text-foreground">Market listings</span>
        </nav>

        <h1 className="text-[30px] font-bold leading-9 tracking-tight">Market listings</h1>

        <section aria-label="Product summary" className="flex flex-col gap-5 rounded-2xl border border-[#e3e7e8] bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:p-[22px]">
          <div className="flex min-w-0 flex-col items-start gap-[18px] sm:flex-row sm:items-center">
            <div className="flex h-[140px] w-[130px] shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-[#f3f4f5]">
              {imageUrl ? <img src={imageUrl} alt={image?.altText || product.name} className="h-full w-full object-contain" /> : <span className="px-3 text-center text-xs text-muted-foreground">ยังไม่มีรูปสินค้า</span>}
            </div>
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap gap-1.5">
                {gameName && <Badge variant="secondary" className="rounded-full text-[11px] font-medium">{gameName}</Badge>}
                {product.rarityCode && <Badge variant="secondary" className="rounded-full text-[11px] font-medium">{RARITY_LABELS[product.rarityCode] ?? product.rarityCode}</Badge>}
              </div>
              <h2 className="break-words text-2xl font-bold leading-7">{title}</h2>
              {product.cardNumber && <p className="text-xs text-muted-foreground">{product.cardNumber}</p>}
              <p className="text-[13px] font-medium text-primary">{listingsQuery.isSuccess ? `${listings.length} listings available` : "— listings available"}</p>
            </div>
          </div>
          <div className="shrink-0 text-left sm:text-right">
            <p className="text-xs text-muted-foreground">Market price</p>
            <p className="mt-1 text-[28px] font-bold leading-8">—</p>
          </div>
        </section>

        <section aria-labelledby="listing-heading" className="rounded-2xl border border-[#e3e7e8] bg-white p-4 sm:p-[22px]">
          <div className="mb-2">
            <p className="text-xs font-semibold text-primary">{listingsQuery.isSuccess ? `${listings.length} available` : "— available"}</p>
            <h2 id="listing-heading" className="text-[22px] font-bold leading-7">Market listings</h2>
          </div>
          {listingsQuery.isPending ? <div role="status" aria-busy="true" aria-label="กำลังโหลดประกาศขาย"><ListRowsSkeleton rows={6} className="divide-[#e3e7e8]" /></div> : listingsQuery.isError ? (
            <div role="alert" className="space-y-3 py-10 text-center text-sm"><p>โหลดประกาศขายไม่สำเร็จ</p><Button onClick={() => void listingsQuery.refetch()}>ลองใหม่</Button></div>
          ) : listings.length === 0 ? <p className="py-12 text-center text-sm text-muted-foreground">ยังไม่มีประกาศขายสินค้านี้</p> : (
            <div className="divide-y divide-[#e3e7e8]">
              {visibleListings.map((listing) => (
                <article key={listing.id} className="grid min-h-16 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-3 py-3 sm:grid-cols-[minmax(0,1fr)_130px_170px_110px_139px] sm:gap-6 sm:py-2">
                  <div className="min-w-0">
                    <Link to={`/u/${encodeURIComponent(listing.seller.username)}?from=${encodeURIComponent(product.slug)}`} className="block truncate text-sm font-semibold hover:text-primary hover:underline">{listing.seller.displayName || listing.seller.username}</Link>
                    <p className="truncate text-[11px] text-muted-foreground">@{listing.seller.username} · {listing.card.variantLabel}</p>
                  </div>
                  <div className="min-w-0"><span className="block text-[10px] font-medium uppercase text-muted-foreground">Condition</span><span className="block truncate text-xs font-semibold">{CONDITION_LABELS[listing.condition]}</span></div>
                  <div className="min-w-0"><span className="block text-[10px] font-medium uppercase text-muted-foreground">Delivery</span><span className="block truncate text-xs font-semibold">—</span></div>
                  <strong className="text-right text-[15px]">{formatListingPrice(listing.price, listing.currency)}</strong>
                  <div className="flex gap-[14px]"><Button type="button" className="h-[31.5px] w-[58.74px] px-0 text-[12.25px]" disabled={addCartItem.isPending || listing.quantityAvailable < 1} aria-label={`เพิ่มสินค้าของ ${listing.seller.displayName || listing.seller.username} ลงรถเข็น`} onClick={() => void addListingToCart(listing)}>{addingListingId === listing.id ? <Loader2 className="size-3.5 animate-spin" /> : "Add"}</Button><Button nativeButton={false} className="h-[31.5px] w-[66px] rounded-full bg-[#22292B] px-0 text-[12.25px] font-normal text-white hover:bg-[#22292B]/80" render={<Link to={`/listings/${listing.id}`} aria-label={`ดูรายละเอียดสินค้าของ ${listing.seller.displayName || listing.seller.username}`} />}>more</Button></div>
                </article>
              ))}
            </div>
          )}
          {listingsQuery.isSuccess && pageCount > 1 && (
            <nav aria-label="หน้าประกาศขาย" className="mt-5 flex items-center justify-between gap-3 border-t pt-4 text-sm">
              <Button variant="outline" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>ก่อนหน้า</Button>
              <span>{currentPage + 1} / {pageCount}</span>
              <Button variant="outline" disabled={currentPage + 1 >= pageCount} onClick={() => setPage(currentPage + 1)}>ถัดไป</Button>
            </nav>
          )}
        </section>
      </main>
    </div>
  );
}
