import { Link, useParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";
import { CONDITION_LABELS, productHref } from "../catalog.mappers";
import { useListingDetail } from "../catalog.queries";

export function ListingDetailPage() {
  const { listingId } = useParams<{ listingId: string }>();
  const id = Number(listingId);
  const query = useListingDetail(id);

  if (!listingId || !Number.isSafeInteger(id) || id <= 0) {
    return <div role="alert" className="p-10 text-center">ไม่พบประกาศขายนี้</div>;
  }
  if (query.isPending) {
    return <div role="status" className="p-10 text-center">กำลังโหลดประกาศขาย...</div>;
  }
  if (query.isError) {
    const notFound = query.error instanceof ApiError && query.error.status === 404;
    return <div role="alert" className="space-y-4 p-10 text-center"><p>{notFound ? "ไม่พบประกาศขายนี้" : "โหลดประกาศขายไม่สำเร็จ"}</p>{!notFound && <Button onClick={() => void query.refetch()}>ลองใหม่</Button>}</div>;
  }

  const { listing, photoUrls } = query.data;
  const sellerName = listing.seller.displayName || listing.seller.username;
  const price = new Intl.NumberFormat("th-TH", { style: "currency", currency: listing.currency }).format(listing.price);
  const photos = photoUrls.length ? photoUrls : [listing.primaryPhotoUrl || listing.card.officialImageUrl].filter((url): url is string => Boolean(url));

  return <main className="mx-auto max-w-5xl space-y-6 px-5 py-8">
    <nav aria-label="Breadcrumb" className="flex flex-wrap gap-2 text-sm text-muted-foreground"><Link to={productHref(listing.card.productSlug)} className="hover:underline">{listing.card.productName}</Link><span>/</span><span>ประกาศขายของ {sellerName}</span></nav>
    <div className="grid gap-8 md:grid-cols-2">
      <div className="space-y-3">{photos.length ? photos.map((url, index) => <img key={`${url}-${index}`} src={url} alt={`${listing.card.productName} ภาพที่ ${index + 1}`} className="w-full rounded-xl border bg-muted object-contain" />) : <div className="flex min-h-80 items-center justify-center rounded-xl border bg-muted text-muted-foreground">ยังไม่มีรูปสินค้า</div>}</div>
      <section className="space-y-5">
        <div><h1 className="text-3xl font-bold">{listing.card.productName}</h1><p className="mt-2 text-sm text-muted-foreground">{listing.card.variantLabel} · {CONDITION_LABELS[listing.condition]}</p></div>
        <p className="text-3xl font-bold text-primary">{price}</p>
        <div className="rounded-xl border p-4"><p className="text-sm text-muted-foreground">ผู้ขาย</p><Link to={`/u/${encodeURIComponent(listing.seller.username)}`} className="font-semibold hover:underline">{sellerName}</Link></div>
        <p>จำนวนที่มี: {listing.quantityAvailable}</p>
        {listing.publicNote && <div><h2 className="font-semibold">รายละเอียดจากผู้ขาย</h2><p className="mt-1 whitespace-pre-wrap text-sm">{listing.publicNote}</p></div>}
        {listing.gradingCompany && <p>เกรด: {listing.gradingCompany}{listing.gradeValue != null ? ` ${listing.gradeValue}` : ""}</p>}
      </section>
    </div>
  </main>;
}
