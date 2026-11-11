import { Link, useParams } from "react-router-dom";

import { ItemCard, QueryBoundary } from "@/components/common";
import { HeadingSkeleton, ItemGridSkeleton, ProfileHeaderSkeleton } from "@/components/common/PageSkeletons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/features/auth/auth.queries";
import { PublicSellerReviews } from "@/features/finance/PublicSellerReviews";

import { usePublicCollection } from "../collection.queries";
import { usePageTitle } from "@/hooks/use-page-title";
import { useTranslate } from "@/lib/i18n";

export function PublicCollectionPage() {
  const { t } = useTranslate("buyer");
  const { username = "" } = useParams();
  const { user } = useAuth();
  const isOwn = user?.username.toLowerCase() === username.toLowerCase();
  const collection = usePublicCollection(username);
  const cards = collection.data?.pages.flatMap((page) => page.items) ?? [];
  const total = collection.data?.pages[0]?.totalItems ?? 0;
  const name = isOwn ? user.displayName : username;
  usePageTitle(name && t("collection.public.pageTitle", "คอลเลกชันของ {name}", { name }));
  // The collection endpoint carries no owner profile, so only your own picture is known here.
  const avatarUrl = isOwn ? user.avatarUrl : null;

  return <main className="min-h-[580px] bg-muted/60 px-4 py-12 font-sans sm:px-8 lg:px-12">
    <div className="mx-auto flex max-w-[1440px] flex-col gap-8">
      <Button variant="outline" className="self-start" render={<Link to={isOwn ? "/account/collection" : "/search"} />}>{isOwn ? t("collection.public.backToMine", "กลับไปคอลเลกชันของฉัน") : t("collection.public.backToProducts", "กลับหน้าสินค้า")}</Button>
      <QueryBoundary query={collection} errorTitle={t("collection.public.loadFailed", "โหลดคอลเลกชันนี้ไม่สำเร็จ")} errorRetryLabel={t("collection.tryAgain", "ลองอีกครั้ง")}
        loading={<div role="status" aria-busy="true" aria-label={t("collection.public.loading", "กำลังโหลดคอลเลกชัน")} className="flex flex-col gap-8">
          <ProfileHeaderSkeleton /><HeadingSkeleton /><ItemGridSkeleton className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3" />
        </div>}>
        {() => <>
          <Card className="rounded-xl shadow-none"><CardContent className="flex flex-wrap items-center gap-6 p-8">
            <Avatar className="size-20">{avatarUrl && <AvatarImage src={avatarUrl} alt={name} />}<AvatarFallback>{name.slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
            <div className="flex-1"><h1 className="text-2xl font-bold">{name}</h1><p className="text-muted-foreground">@{username}</p></div>
            <p className="text-xl font-semibold text-primary">{t("product.cardCount", "{count, plural, other {# ใบ}}", { count: total })}</p>
          </CardContent></Card>
          <div><h2 className="text-xl font-semibold">{isOwn ? t("collection.public.ownTitle", "คอลเลกชันสาธารณะ") : t("collection.public.title", "การ์ดเด่นในคอลเลกชัน")}</h2>
            <p className="text-sm text-muted-foreground">{isOwn ? t("collection.public.ownHint", "การ์ดที่คุณเปิดเป็นสาธารณะ") : t("collection.public.hint", "การ์ดจากคอลเลกชันของ @{username}", { username: username ?? "" })}</p></div>
          {cards.length ? <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {cards.map((item) => <ItemCard key={item.id} imageSrc={item.photoUrl ?? item.card.officialImageUrl ?? undefined}
              imageAlt={item.card.productName} badge={item.card.variantLabel} title={item.card.productName}
              className="w-full [&_img]:object-contain" />)}
          </div> : <p className="rounded-xl border bg-card p-8 text-center text-muted-foreground">{t("collection.public.empty", "ยังไม่มีการ์ดที่เปิดเป็นสาธารณะ")}</p>}
          {collection.hasNextPage ? <Button variant="outline" className="self-center" disabled={collection.isFetchingNextPage}
            onClick={() => void collection.fetchNextPage()}>{t("collection.loadMore", "โหลดเพิ่ม")}</Button> : null}
        </>}
      </QueryBoundary>
      <PublicSellerReviews username={username} />
    </div>
  </main>;
}
