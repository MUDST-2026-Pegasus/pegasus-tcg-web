import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { useLayoutEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";

import { EmptyState, ErrorState, ItemCard } from "@/components/common";
import {
  HeadingSkeleton,
  ItemGridSkeleton,
  ProfileHeaderSkeleton,
} from "@/components/common/PageSkeletons";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { CONDITION_LABELS, productHref } from "@/features/catalog/catalog.mappers";
import type { CardCondition } from "@/features/catalog/catalog.types";
import { getPublicCollection } from "@/features/collection/collection.api";
import { afterSalesApi } from "@/features/finance/after-sales.api";
import { getPublicProfile, getStorefront } from "@/features/home/home.api";
import { hasErrorCode, isApiError } from "@/lib/api";

import { StoreHero } from "../components/StoreHero";
import { StorePagination } from "../components/StorePagination";
import { StoreReviewsSnippet } from "../components/StoreReviewsSnippet";
import { StoreReviewsTab } from "../components/StoreReviewsTab";
import { StoreTabs } from "../components/StoreTabs";
import { calculatePositivePercent } from "../store.format";

const PAGE_SIZE = 6;
const cardClassName = "w-full [&_img]:object-contain";
const gridClassName = "grid gap-6 sm:grid-cols-2 lg:grid-cols-3 [&>a]:w-full";

function retry(count: number, error: unknown) {
  return !(isApiError(error) && error.status === 404) && count < 2;
}

export function PublicSellerPage() {
  const { username } = useParams<{ username: string }>();
  return username ? (
    <Storefront key={username} username={username} />
  ) : (
    <EmptyState title="ไม่พบชื่อผู้ขาย" />
  );
}

function Storefront({ username }: { username: string }) {
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [username]);

  const [searchParams, setSearchParams] = useSearchParams();
  const [listingPage, setListingPage] = useState(0);
  const [collectionPage, setCollectionPage] = useState(0);

  // 1. Fetch store profile
  const profile = useQuery({
    queryKey: ["public-profile", username],
    queryFn: ({ signal }) => getPublicProfile(username, signal),
    retry,
    staleTime: 0,
    refetchOnMount: "always",
  });

  // 2. Fetch storefront listings
  const listings = useQuery({
    queryKey: ["storefront", username, listingPage, PAGE_SIZE],
    queryFn: ({ signal }) => getStorefront(username, PAGE_SIZE, listingPage, signal),
    placeholderData: keepPreviousData,
    retry,
    staleTime: 0,
    refetchOnMount: "always",
  });

  // 3. Fetch public collection
  const collection = useQuery({
    queryKey: ["store-public-collection", username, collectionPage, PAGE_SIZE],
    queryFn: ({ signal }) => getPublicCollection(username, collectionPage, PAGE_SIZE, signal),
    enabled: profile.isSuccess,
    placeholderData: keepPreviousData,
    retry,
    staleTime: 0,
    refetchOnMount: "always",
  });

  // 4. Fetch public reviews ONCE at page level
  const reviews = useQuery({
    queryKey: ["store", "reviews", username],
    queryFn: () => afterSalesApi.publicReviews(username),
    enabled: !!username && profile.isSuccess,
    retry: false,
    staleTime: 0,
    refetchOnMount: "always",
  });

  const isNonSeller =
    reviews.isError &&
    (hasErrorCode(reviews.error, "SELLER_NOT_FOUND") ||
      (isApiError(reviews.error) && reviews.error.status === 404));

  // Determine active tab
  const rawTab = searchParams.get("tab");
  const availableTabs = ["products", "collection", ...(isNonSeller ? [] : ["reviews"])];
  const activeTab = availableTabs.includes(rawTab ?? "") ? rawTab! : "products";

  const handleTabChange = (value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value === "products") {
      next.delete("tab");
    } else {
      next.set("tab", value);
    }
    setSearchParams(next, { preventScrollReset: true });
  };

  const from = searchParams.get("from");
  const backHref = from ? productHref(from) : "/products";
  const displayName = profile.data?.displayName || username;

  const listingsTotal = listings.data?.totalItems;
  const collectionTotal = collection.data?.totalItems;
  const ratingCount = reviews.data?.summary?.ratingCount ?? 0;
  const ratingAvg = reviews.data?.summary?.ratingAvg ?? 0;
  const count4 = reviews.data?.summary?.count4 ?? 0;
  const count5 = reviews.data?.summary?.count5 ?? 0;
  const positivePercent = calculatePositivePercent(count4, count5, ratingCount);

  return (
    <main className="min-h-[580px] bg-[#F8F9FA] px-4 py-6 font-sans sm:px-8 sm:py-10 lg:px-12">
      <div className="mx-auto flex w-full max-w-[1344px] flex-col gap-6 sm:gap-8">
        {/* Back Link */}
        <div>
          <Button
            variant="outline"
            className="h-[38px] rounded-lg bg-background px-3 text-sm text-foreground"
            nativeButton={false}
            render={
              <Link
                to={backHref}
                role="link"
                aria-label={from ? "Back to product detail" : "Back to products"}
              />
            }
          >
            <ArrowLeft className="mr-1.5 size-4" />
            <span>กลับไปหน้ารายการสินค้า</span>
            <span className="sr-only">
              {from ? "Back to product detail" : "Back to products"}
            </span>
          </Button>
        </div>

        {profile.isPending ? (
          <div
            role="status"
            aria-busy="true"
            aria-label="กำลังโหลดร้านค้า"
            className="flex flex-col gap-8"
          >
            <ProfileHeaderSkeleton />
            <HeadingSkeleton />
            <ItemGridSkeleton className={gridClassName} />
          </div>
        ) : profile.isError ? (
          isApiError(profile.error) && profile.error.status === 404 ? (
            <EmptyState title="ไม่พบผู้ขายรายนี้" />
          ) : (
            <ErrorState
              error={profile.error}
              onRetry={() => void profile.refetch()}
            />
          )
        ) : (
          <>
            {/* Hero & 4 Stat Cards */}
            <StoreHero
              profile={profile.data}
              listingsTotal={listingsTotal}
              collectionTotal={collectionTotal}
              ratingAvg={ratingAvg}
              ratingCount={ratingCount}
              positivePercent={positivePercent}
              isNonSeller={isNonSeller}
            />

            {/* Underline Tabs */}
            <Tabs
              value={activeTab}
              onValueChange={handleTabChange}
              className="gap-6 sm:gap-8"
            >
              <StoreTabs
                activeTab={activeTab}
                listingsTotal={listingsTotal}
                collectionTotal={collectionTotal}
                ratingCount={ratingCount}
                isNonSeller={isNonSeller}
              />

              {/* Products Tab */}
              <TabsContent value="products" className="space-y-6 sm:space-y-8 outline-none">
                {/* Review Snippet Card (hidden if ratingCount === 0 or non-seller) */}
                {!isNonSeller && ratingCount > 0 && (
                  <StoreReviewsSnippet
                    summary={reviews.data?.summary ?? null}
                    reviews={reviews.data?.reviews ?? []}
                    onViewAll={() => handleTabChange("reviews")}
                  />
                )}

                {/* Products Grid & Title */}
                <div className="space-y-6">
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-bold text-foreground">
                        สินค้าที่วางขาย
                      </h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        เลือกสินค้าเพื่อดูรายละเอียดและสั่งซื้อจาก {displayName}
                      </p>
                    </div>
                    {listings.data && (
                      <p className="text-sm text-muted-foreground">
                        {listings.data.totalItems > 0
                          ? `แสดง ${listingPage * PAGE_SIZE + 1}–${Math.min(
                              (listingPage + 1) * PAGE_SIZE,
                              listings.data.totalItems,
                            )} จาก ${listings.data.totalItems} รายการ`
                          : "แสดง 0 รายการ"}
                      </p>
                    )}
                  </div>

                  {listings.isPending ? (
                    <div
                      role="status"
                      aria-busy="true"
                      aria-label="กำลังโหลดสินค้า"
                    >
                      <ItemGridSkeleton className={gridClassName} />
                    </div>
                  ) : listings.isError ? (
                    <ErrorState
                      error={listings.error}
                      onRetry={() => void listings.refetch()}
                    />
                  ) : listings.data.items.length === 0 ? (
                    <EmptyState
                      title="ยังไม่มีประกาศขาย"
                      description="ร้านนี้ยังไม่มีสินค้าที่เปิดขายอยู่"
                    />
                  ) : (
                    <div className={gridClassName} aria-busy={listings.isFetching}>
                      {listings.data.items.map((listing) => (
                        <ItemCard
                          key={listing.id}
                          href={productHref(listing.card.productSlug)}
                          imageSrc={
                            listing.primaryPhotoUrl ??
                            listing.card.officialImageUrl ??
                            undefined
                          }
                          imageAlt={listing.card.productName}
                          title={listing.card.productName}
                          badge={
                            CONDITION_LABELS[listing.condition] ?? listing.condition
                          }
                          price={new Intl.NumberFormat("th-TH", {
                            style: "currency",
                            currency: listing.currency,
                            maximumFractionDigits: 2,
                            minimumFractionDigits: 0,
                          }).format(listing.price)}
                          className={cardClassName}
                        />
                      ))}
                    </div>
                  )}

                  {listings.data && (
                    <StorePagination
                      page={listingPage}
                      totalPages={listings.data.totalPages}
                      pending={listings.isFetching}
                      onChange={setListingPage}
                    />
                  )}
                </div>
              </TabsContent>

              {/* Collection Tab */}
              <TabsContent value="collection" className="space-y-6 sm:space-y-8 outline-none">
                <div className="space-y-6">
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-bold text-foreground">
                        คอลเลกชัน
                      </h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        การ์ดในคอลเลกชันสาธารณะของ {displayName} รายการเหล่านี้ไม่จำเป็นต้องวางขาย
                      </p>
                    </div>
                    {collection.data && (
                      <p className="text-sm text-muted-foreground">
                        {collection.data.totalItems > 0
                          ? `แสดง ${collectionPage * PAGE_SIZE + 1}–${Math.min(
                              (collectionPage + 1) * PAGE_SIZE,
                              collection.data.totalItems,
                            )} จาก ${collection.data.totalItems} รายการ`
                          : "แสดง 0 รายการ"}
                      </p>
                    )}
                  </div>

                  {collection.isPending ? (
                    <div
                      role="status"
                      aria-busy="true"
                      aria-label="กำลังโหลดคอลเลกชัน"
                    >
                      <ItemGridSkeleton className={gridClassName} />
                    </div>
                  ) : collection.isError ? (
                    <ErrorState
                      error={collection.error}
                      onRetry={() => void collection.refetch()}
                    />
                  ) : collection.data.items.length === 0 ? (
                    <EmptyState title="ยังไม่มีคอลเลกชันสาธารณะ" />
                  ) : (
                    <div className={gridClassName} aria-busy={collection.isFetching}>
                      {collection.data.items.map((item) => (
                        <ItemCard
                          key={item.id}
                          href={productHref(item.card.productSlug)}
                          imageSrc={
                            item.photoUrl ?? item.card.officialImageUrl ?? undefined
                          }
                          imageAlt={item.card.productName}
                          title={item.card.productName}
                          badge={
                            CONDITION_LABELS[item.condition as CardCondition] ??
                            item.condition
                          }
                          className={cardClassName}
                        />
                      ))}
                    </div>
                  )}

                  {collection.data && (
                    <StorePagination
                      page={collectionPage}
                      totalPages={collection.data.totalPages}
                      pending={collection.isFetching}
                      onChange={setCollectionPage}
                    />
                  )}
                </div>
              </TabsContent>

              {/* Reviews Tab */}
              {!isNonSeller && (
                <TabsContent value="reviews" className="outline-none">
                  <StoreReviewsTab
                    summary={reviews.data?.summary ?? null}
                    reviews={reviews.data?.reviews ?? []}
                    positivePercent={positivePercent}
                    isPending={reviews.isPending}
                    isError={reviews.isError}
                    error={reviews.error}
                    onRetry={() => void reviews.refetch()}
                  />
                </TabsContent>
              )}
            </Tabs>
          </>
        )}
      </div>
    </main>
  );
}
