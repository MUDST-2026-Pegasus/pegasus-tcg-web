import { PublicSellerReviews } from '@/features/finance/PublicSellerReviews';
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useLayoutEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";

import { EmptyState, ErrorState, ItemCard } from "@/components/common";
import { HeadingSkeleton, ItemGridSkeleton, ProfileHeaderSkeleton } from "@/components/common/PageSkeletons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CONDITION_LABELS, productHref } from "@/features/catalog/catalog.mappers";
import type { CardCondition } from "@/features/catalog/catalog.types";
import { getPublicCollection } from "@/features/collection/collection.api";
import { getPublicProfile, getStorefront } from "@/features/home/home.api";
import { isApiError } from "@/lib/api";

const PAGE_SIZE = 6;
const cardClassName = "w-full [&_img]:object-contain";
const tabClassName = "h-[42px] flex-none rounded-lg border-border! bg-background px-5 text-foreground data-active:bg-primary data-active:text-primary-foreground";
const gridClassName = "grid gap-6 sm:grid-cols-2 lg:grid-cols-3 [&>a]:w-full";

function retry(count: number, error: unknown) {
  return !(isApiError(error) && error.status === 404) && count < 2;
}

function Pagination({ page, totalPages, pending, onChange }: {
  page: number; totalPages: number; pending: boolean; onChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;
  return <nav aria-label="Store pages" className="flex items-center justify-center gap-4">
    <Button variant="outline" disabled={page === 0 || pending} onClick={() => onChange(page - 1)}>Previous</Button>
    <span className="text-sm">{page + 1} / {totalPages}</span>
    <Button variant="outline" disabled={page + 1 >= totalPages || pending} onClick={() => onChange(page + 1)}>Next</Button>
  </nav>;
}

export function PublicSellerPage() {
  const { username } = useParams<{ username: string }>();
  return username ? <Storefront key={username} username={username} /> : <EmptyState title="ไม่พบชื่อผู้ขาย" />;
}

function Storefront({ username }: { username: string }) {
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [username]);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = ["collection", "reviews"].includes(searchParams.get("tab") ?? "") ? searchParams.get("tab")! : "products";
  const [listingPage, setListingPage] = useState(0);
  const [collectionPage, setCollectionPage] = useState(0);
  const profile = useQuery({
    queryKey: ["public-profile", username],
    queryFn: ({ signal }) => getPublicProfile(username, signal), retry,
    staleTime: 0, refetchOnMount: "always",
  });
  const listings = useQuery({
    queryKey: ["storefront", username, listingPage, PAGE_SIZE],
    queryFn: ({ signal }) => getStorefront(username, PAGE_SIZE, listingPage, signal),
    placeholderData: keepPreviousData, retry,
    staleTime: 0, refetchOnMount: "always",
  });
  const collection = useQuery({
    queryKey: ["store-public-collection", username, collectionPage, PAGE_SIZE],
    queryFn: ({ signal }) => getPublicCollection(username, collectionPage, PAGE_SIZE, signal),
    enabled: profile.isSuccess, placeholderData: keepPreviousData, retry,
    staleTime: 0, refetchOnMount: "always",
  });
  const from = searchParams.get("from");
  const backHref = from ? productHref(from) : "/products";
  const displayName = profile.data?.displayName || username;
  const initials = displayName.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  const forSale = listings.data?.totalItems;
  const collected = collection.data?.totalItems;

  return <main className="min-h-[580px] bg-muted px-5 py-8 font-sans sm:px-8 sm:py-12 lg:px-12">
    <div className="mx-auto flex w-full max-w-[1344px] flex-col gap-8">
      <div><Button variant="outline" className="h-[38px] rounded-lg bg-background px-3" nativeButton={false} render={<Link to={backHref} role="link" />}>{from ? "Back to product detail" : "Back to products"}</Button></div>
      {profile.isPending ? <div role="status" aria-busy="true" aria-label="กำลังโหลดร้านค้า" className="flex flex-col gap-8"><ProfileHeaderSkeleton /><HeadingSkeleton /><ItemGridSkeleton className={gridClassName} /></div> : profile.isError ? (
        isApiError(profile.error) && profile.error.status === 404
          ? <EmptyState title="ไม่พบผู้ขายรายนี้" />
          : <ErrorState error={profile.error} onRetry={() => void profile.refetch()} />
      ) : <>
        <section aria-label="Store profile" className="grid grid-cols-[80px_minmax(0,1fr)] items-center gap-6 rounded-xl border bg-card p-6 sm:flex sm:flex-wrap sm:p-8">
          <Avatar className="size-20 shrink-0">
            {profile.data.avatarUrl && <AvatarImage src={profile.data.avatarUrl} alt="" />}
            <AvatarFallback className="bg-muted text-sm text-muted-foreground">{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1"><h1 className="break-words text-2xl font-bold leading-8">{displayName}</h1><p className="mt-2 break-all text-base text-muted-foreground">@{username}</p></div>
          {profile.data.phone && <p className="col-span-2 break-words text-sm text-muted-foreground sm:mx-4">Phone number : <a className="font-medium text-foreground hover:underline" href={`tel:${profile.data.phone.replace(/[^+\d]/g, "")}`}>{profile.data.phone}</a></p>}
          <p className="col-span-2 text-xl font-semibold leading-7 text-primary sm:ml-auto">{forSale ?? "—"} for sale · {collected ?? "—"} collected</p>
        </section>
        <Tabs value={activeTab} onValueChange={(value) => {
          const next = new URLSearchParams(searchParams);
          if (value === "products") next.delete("tab"); else next.set("tab", value);
          setSearchParams(next, { preventScrollReset: true });
        }} className="gap-8">
          <TabsList aria-label="Store inventory" className="h-auto! max-w-full flex-wrap justify-start gap-3 rounded-none bg-transparent p-0">
            <TabsTrigger value="products" className={tabClassName}>Products for sale ({forSale ?? "—"})</TabsTrigger>
            <TabsTrigger value="collection" className={tabClassName}>Collection ({collected ?? "—"})</TabsTrigger>
            <TabsTrigger value="reviews" className={tabClassName}>รีวิวร้านค้า</TabsTrigger>
          </TabsList>
          <TabsContent value="products" className="space-y-8">
            <div><h2 className="text-xl font-semibold leading-7">Products for sale</h2><p className="mt-2 text-sm leading-5 text-muted-foreground">Browse listings from {displayName}. Choose a product to see its details.</p></div>
            {listings.isPending ? <div role="status" aria-busy="true" aria-label="กำลังโหลดสินค้า"><ItemGridSkeleton className={gridClassName} /></div> : listings.isError ? <ErrorState error={listings.error} onRetry={() => void listings.refetch()} /> : listings.data.items.length === 0 ? <EmptyState title="ยังไม่มีประกาศขาย" description="ร้านนี้ยังไม่มีสินค้าที่เปิดขายอยู่" /> : (
              <div className={gridClassName} aria-busy={listings.isFetching}>{listings.data.items.map((listing) => <ItemCard
                key={listing.id} href={productHref(listing.card.productSlug)}
                imageSrc={listing.primaryPhotoUrl ?? listing.card.officialImageUrl ?? undefined}
                imageAlt={listing.card.productName}
                title={listing.card.productName} badge={CONDITION_LABELS[listing.condition] ?? listing.condition}
                price={new Intl.NumberFormat("th-TH", { style: "currency", currency: listing.currency, maximumFractionDigits: 2, minimumFractionDigits: 0 }).format(listing.price)}
                className={cardClassName}
              />)}</div>
            )}
            {listings.data && <Pagination page={listingPage} totalPages={listings.data.totalPages} pending={listings.isFetching} onChange={setListingPage} />}
          </TabsContent>
          <TabsContent value="collection" className="space-y-8">
            <div><h2 className="text-xl font-semibold leading-7">Store collection</h2><p className="mt-2 text-sm leading-5 text-muted-foreground">Cards in {displayName}’s public collection. These items are not necessarily for sale.</p></div>
            {collection.isPending ? <div role="status" aria-busy="true" aria-label="กำลังโหลดคอลเลกชัน"><ItemGridSkeleton className={gridClassName} /></div> : collection.isError ? <ErrorState error={collection.error} onRetry={() => void collection.refetch()} /> : collection.data.items.length === 0 ? <EmptyState title="ยังไม่มีคอลเลกชันสาธารณะ" /> : (
              <div className={gridClassName} aria-busy={collection.isFetching}>{collection.data.items.map((item) => <ItemCard
                key={item.id} href={productHref(item.card.productSlug)}
                imageSrc={item.photoUrl ?? item.card.officialImageUrl ?? undefined}
                imageAlt={item.card.productName}
                title={item.card.productName} badge={CONDITION_LABELS[item.condition as CardCondition] ?? item.condition}
                className={cardClassName}
              />)}</div>
            )}
            {collection.data && <Pagination page={collectionPage} totalPages={collection.data.totalPages} pending={collection.isFetching} onChange={setCollectionPage} />}
          </TabsContent>
          <TabsContent value="reviews"><PublicSellerReviews username={username}/></TabsContent>
        </Tabs>
      </>}
    </div>
  </main>;
}
