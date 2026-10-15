import { useQuery } from "@tanstack/react-query";
import { Link, useLocation, useParams, useSearchParams } from "react-router-dom";

import { ItemCard } from "@/components/common/ItemCard";
import { ProfilePageSkeleton } from "@/components/common/PageSkeletons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { api, isApiError, type PageResponse } from "@/lib/api";
import { CONDITION_LABELS, productHref } from "../catalog.mappers";
import type { CardCondition } from "../catalog.types";

type PublicCollectionItem = {
  id: number;
  card: {
    productName: string;
    productSlug: string;
    variantLabel: string;
    officialImageUrl: string | null;
  };
  condition: CardCondition;
  quantity: number;
  photoUrl: string | null;
};

type CollectorNavigationState = {
  displayName?: string | null;
  avatarUrl?: string | null;
};

async function getPublicCollection(username: string, signal?: AbortSignal) {
  const items: PublicCollectionItem[] = [];
  let page = 0;
  while (true) {
    const result = await api.get<PageResponse<PublicCollectionItem>>(
      `/users/${encodeURIComponent(username)}/collection`,
      { auth: false, signal, query: { page, size: 100 } },
    );
    items.push(...result.items);
    page += 1;
    if (page >= result.totalPages || result.items.length === 0) return items;
  }
}

export function CollectorProfilePage() {
  const { username } = useParams<{ username: string }>();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const state = location.state as CollectorNavigationState | null;
  const displayName = typeof state?.displayName === "string" && state.displayName.trim() ? state.displayName : username ?? "";
  const avatarUrl = typeof state?.avatarUrl === "string" ? state.avatarUrl : null;
  const fromSlug = searchParams.get("from");
  const backHref = fromSlug ? productHref(fromSlug) : "/products";

  const collection = useQuery({
    queryKey: ["public-collection", username],
    queryFn: ({ signal }) => getPublicCollection(username!, signal),
    enabled: Boolean(username),
    retry: (count, error) => !(isApiError(error) && error.status === 404) && count < 2,
  });

  if (!username) return <main className="bg-muted/60 p-12 text-center"><h1 className="text-2xl font-bold">ไม่พบผู้ใช้</h1></main>;
  if (collection.isPending) return <ProfilePageSkeleton label="กำลังโหลดโปรไฟล์นักสะสม" />;
  if (collection.isError) {
    const notFound = isApiError(collection.error) && collection.error.status === 404;
    return <main role="alert" className="min-h-[580px] bg-muted/60 p-12 text-center"><h1 className="text-2xl font-bold">{notFound ? "ไม่พบโปรไฟล์นักสะสม" : "โหลดโปรไฟล์ไม่สำเร็จ"}</h1>{!notFound && <Button className="mt-5" onClick={() => void collection.refetch()}>ลองใหม่</Button>}</main>;
  }

  const items = collection.data;
  const cardCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const initials = displayName.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();

  return (
    <main className="min-h-[580px] bg-[#f1f3f3] px-5 py-8 font-sans sm:px-8 sm:py-12 lg:px-12">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-8">
        <div><Button variant="outline" render={<Link to={backHref} />}>{fromSlug ? "Back to card" : "Back to products"}</Button></div>

        <section aria-label="Collector profile" className="grid grid-cols-[80px_minmax(0,1fr)] items-center gap-5 rounded-xl border border-[#e3e7e8] bg-white p-6 sm:flex sm:gap-6 sm:p-8">
          <Avatar className="size-20 shrink-0">
            {avatarUrl && <AvatarImage src={avatarUrl} alt="" />}
            <AvatarFallback className="bg-[#f1f3f3] text-sm text-muted-foreground">{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h1 className="break-all text-xl font-bold leading-7 sm:text-2xl sm:leading-8">{displayName}</h1>
            <p className="mt-2 break-all text-base text-muted-foreground">@{username}</p>
          </div>
          <p className="col-start-2 text-xl font-semibold text-primary sm:ml-auto sm:shrink-0">{cardCount} {cardCount === 1 ? "card" : "cards"}</p>
        </section>

        <section aria-labelledby="collection-heading" className="space-y-6">
          <div>
            <h2 id="collection-heading" className="text-xl font-semibold leading-7">Collection highlights</h2>
            <p className="mt-2 text-sm text-muted-foreground">A selection of cards from {displayName}’s public collection.</p>
          </div>
          {items.length === 0 ? (
            <p className="rounded-xl border bg-white p-8 text-center text-sm text-muted-foreground">ยังไม่มีรายการสะสมที่เปิดเป็นสาธารณะ</p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 [&_a]:w-full">
              {items.slice(0, 6).map((item) => (
                <ItemCard
                  key={item.id}
                  href={productHref(item.card.productSlug)}
                  imageSrc={item.photoUrl ?? item.card.officialImageUrl ?? undefined}
                  imageAlt={item.card.productName}
                  badge={CONDITION_LABELS[item.condition]}
                  title={item.card.productName}
                  className="w-full [&_img]:object-contain"
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
