import { useState } from "react";
import { ArrowRight, BadgeCheck, Star } from "lucide-react";
import { Link } from "react-router-dom";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { getInitials } from "@/features/store/store.format";

import type { RecommendedShopDto } from "../home.types";
import { useTranslate } from "@/lib/i18n";

export function ShopCard({ shop }: { shop: RecommendedShopDto }) {
  const { t } = useTranslate("buyer");
  const name = shop.displayName || shop.username;
  const [failedBannerUrl, setFailedBannerUrl] = useState<string | null>(null);
  const bannerUrl = shop.bannerUrl && shop.bannerUrl !== failedBannerUrl ? shop.bannerUrl : null;

  return (
    <Link
      to={`/u/${encodeURIComponent(shop.username)}`}
      aria-label={t("home.shop.visitAria", "เข้าชมร้าน {name}", { name })}
      className="group block w-[280px] shrink-0 overflow-hidden rounded-2xl bg-card text-left shadow-[0_0_0_1px_rgba(9,11,12,0.06)] outline-none transition-[box-shadow] hover:shadow-[0_8px_18px_-4px_rgba(8,26,51,0.16),0_0_0_1px_rgba(0,88,188,0.45)] focus-visible:ring-3 focus-visible:ring-primary/50"
    >
      <div className="h-16 bg-gradient-to-r from-[#0B4D94] via-[#083568] to-[#031B38]">
        {bannerUrl && <img src={bannerUrl} alt={t("home.shop.bannerAlt", "แบนเนอร์ร้าน {name}", { name })} loading="lazy" className="size-full object-cover object-center" onError={() => setFailedBannerUrl(bannerUrl)} />}
      </div>
      <div className="relative px-4 pt-9 pb-4">
        <Avatar className="absolute -top-7 left-4 size-14 border-[3px] border-white bg-[#e5effb]">
          {shop.avatarUrl ? <AvatarImage src={shop.avatarUrl} alt={t("home.shop.avatarAlt", "รูปโปรไฟล์ร้าน {name}", { name })} /> : null}
          <AvatarFallback className="bg-[#e5effb] text-base font-bold text-primary">
            {getInitials(name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex items-center gap-1">
          <span className="min-w-0 flex-1 truncate text-base font-semibold text-foreground" title={name}>{name}</span>
          <BadgeCheck aria-label={t("home.shop.verified", "ร้านยืนยันแล้ว")} className="size-4 shrink-0 fill-primary text-white" />
        </div>
        <p className="truncate text-xs text-muted-foreground">@{shop.username}</p>
        <div className="mt-3 flex h-5 items-center gap-1 overflow-hidden whitespace-nowrap text-xs text-muted-foreground">
          {shop.ratingCount === 0 ? (
            <span className="rounded-full bg-[#e5effb] px-2 py-0.5 font-medium text-primary">{t("home.shop.new", "ร้านใหม่")}</span>
          ) : (
            <>
              <Star aria-hidden="true" className="size-3.5 shrink-0 fill-amber-500 text-amber-500" />
              <span className="font-semibold text-foreground">{shop.ratingAvg.toFixed(1)}</span>
              <span>{t("home.shop.reviews", "({count} รีวิว)", { count: shop.ratingCount })}</span>
            </>
          )}
          <span aria-hidden="true">·</span>
          <span>{t("home.shop.listings", "{count} สินค้า", { count: shop.activeListingCount })}</span>
        </div>
        <div className="mt-3 flex gap-2" aria-label={t("home.shop.previews", "ตัวอย่างสินค้า")}>
          {Array.from({ length: 3 }, (_, index) => {
            const preview = shop.previews[index];
            return (
              <div key={preview?.listingId ?? `empty-${index}`} className="h-[77px] min-w-0 flex-1 overflow-hidden rounded-lg bg-muted">
                {preview?.imageUrl ? (
                  <img src={preview.imageUrl} alt={t("home.shop.previewAlt", "ตัวอย่างสินค้าร้าน {name} รายการที่ {index}", { name, index: index + 1 })} className="size-full object-cover" />
                ) : null}
              </div>
            );
          })}
        </div>
        <span className="mt-3 flex items-center gap-1 text-sm font-medium text-primary group-hover:underline">
          {t("home.shop.visit", "เข้าชมร้าน")} <ArrowRight aria-hidden="true" className="size-4" />
        </span>
      </div>
    </Link>
  );
}

export function ShopCardSkeleton() {
  return (
    <div aria-hidden="true" className="w-[280px] shrink-0 overflow-hidden rounded-2xl bg-card shadow-[0_0_0_1px_rgba(9,11,12,0.06)]">
      <Skeleton className="h-16 rounded-none" />
      <div className="relative space-y-3 px-4 pt-9 pb-4">
        <Skeleton className="absolute -top-7 left-4 size-14 rounded-full border-[3px] border-white" />
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-36" />
        <div className="flex gap-2">{[0, 1, 2].map((index) => <Skeleton key={index} className="h-[77px] min-w-0 flex-1 rounded-lg" />)}</div>
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  );
}
