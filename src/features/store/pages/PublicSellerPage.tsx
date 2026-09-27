import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";

import { EmptyState, ErrorState } from "@/components/common";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CONDITION_LABELS, productHref } from "@/features/catalog/catalog.mappers";
import { getStorefront } from "@/features/home/home.api";
import { isApiError } from "@/lib/api";

export function PublicSellerPage() {
  const { username } = useParams<{ username: string }>();
  const [page, setPage] = useState(0);
  const listings = useQuery({
    queryKey: ["storefront", username, page],
    queryFn: ({ signal }) => getStorefront(username!, 100, page, signal),
    enabled: Boolean(username),
    placeholderData: keepPreviousData,
    retry: (count, error) => !(isApiError(error) && error.status === 404) && count < 2,
  });

  if (!username) return <EmptyState title="ไม่พบชื่อผู้ขาย" />;
  if (listings.isPending) return <main role="status" className="p-10 text-center">กำลังโหลดร้านค้า...</main>;
  if (listings.isError) {
    return isApiError(listings.error) && listings.error.status === 404
      ? <EmptyState title="ไม่พบผู้ขายรายนี้" />
      : <ErrorState error={listings.error} onRetry={() => void listings.refetch()} />;
  }

  const name = listings.data.items[0]?.seller.displayName || username;
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 space-y-6 px-5 py-10">
      <div>
        <h1 className="text-3xl font-bold">{name}</h1>
        <p className="mt-1 text-muted-foreground">@{username}</p>
      </div>
      <h2 className="text-xl font-semibold">สินค้าที่กำลังขาย</h2>
      {listings.data.items.length === 0 ? (
        <EmptyState title="ยังไม่มีประกาศขาย" description="ผู้ขายรายนี้ยังไม่มีสินค้าที่เปิดขายอยู่" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {listings.data.items.map((listing) => (
            <Card key={listing.id} className="py-0 shadow-none">
              <CardContent className="flex gap-4 p-4">
                {listing.primaryPhotoUrl || listing.card.officialImageUrl ? (
                  <img src={listing.primaryPhotoUrl || listing.card.officialImageUrl || ""} alt={listing.card.productName} className="h-28 w-20 shrink-0 object-contain" />
                ) : <div className="h-28 w-20 shrink-0 rounded bg-muted" />}
                <div className="min-w-0 space-y-2">
                  <h3 className="font-semibold">{listing.card.productName}</h3>
                  <p className="text-sm text-muted-foreground">{listing.card.variantLabel} · {CONDITION_LABELS[listing.condition]}</p>
                  <p className="font-bold">{new Intl.NumberFormat("th-TH", { style: "currency", currency: listing.currency }).format(listing.price)}</p>
                  <Button size="sm" variant="outline" render={<Link to={productHref(listing.card.productSlug)} />}>ดูสินค้า</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {listings.data.totalPages > 1 && (
        <nav aria-label="หน้าร้านผู้ขาย" className="flex items-center justify-center gap-4">
          <Button variant="outline" disabled={page === 0 || listings.isPlaceholderData} onClick={() => setPage(page - 1)}>ก่อนหน้า</Button>
          <span>{page + 1} / {listings.data.totalPages}</span>
          <Button variant="outline" disabled={page + 1 >= listings.data.totalPages || listings.isPlaceholderData} onClick={() => setPage(page + 1)}>ถัดไป</Button>
        </nav>
      )}
    </main>
  );
}
