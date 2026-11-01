import { Layers, Package, Phone, Star, ThumbsUp } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { PublicProfileDto } from "@/features/home/home.types";
import { cn } from "@/lib/utils";
import { getInitials } from "../store.format";

export type StoreHeroProps = {
  profile: PublicProfileDto;
  listingsTotal?: number;
  collectionTotal?: number;
  ratingAvg?: number;
  ratingCount?: number;
  positivePercent?: number | null;
  isNonSeller?: boolean;
};

export function StoreHero({
  profile,
  listingsTotal,
  collectionTotal,
  ratingAvg = 0,
  ratingCount = 0,
  positivePercent = null,
  isNonSeller = false,
}: StoreHeroProps) {
  const displayName = profile.displayName || profile.username;
  const initials = getInitials(displayName);

  return (
    <section
      aria-label="Store profile"
      className="overflow-hidden rounded-2xl border border-border bg-card shadow-2xs sm:rounded-3xl"
    >
      {/* Section 1: Cover Gradient Banner */}
      <div className="relative h-44 w-full overflow-hidden bg-gradient-to-r from-[#0B4D94] via-[#083568] to-[#031B38] sm:h-52">
        {/* Card silhouettes */}
        <div className="pointer-events-none absolute -top-10 right-4 hidden h-64 w-80 overflow-hidden opacity-25 sm:block">
          <div className="relative size-full">
            <div className="absolute top-6 right-24 h-44 w-32 -rotate-12 rounded-xl border-2 border-white/40 bg-white/5 backdrop-blur-xs" />
            <div className="absolute top-2 right-12 h-44 w-32 rotate-6 rounded-xl border-2 border-white/40 bg-white/5 backdrop-blur-xs" />
            <div className="absolute top-8 -right-2 h-44 w-32 rotate-18 rounded-xl border-2 border-white/40 bg-white/5 backdrop-blur-xs" />
          </div>
        </div>
      </div>

      {/* Section 2: Store Info */}
      <div className="bg-card px-5 pb-6 pt-0 sm:px-8 sm:pb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
          <Avatar className="-mt-12 size-24 shrink-0 rounded-full border-4 border-white bg-card shadow-md sm:-mt-14 sm:size-28">
            {profile.avatarUrl ? (
              <AvatarImage src={profile.avatarUrl} alt={displayName} />
            ) : null}
            <AvatarFallback className="bg-primary/10 text-2xl font-bold text-primary sm:text-3xl">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="flex min-w-0 flex-1 flex-col gap-1 pt-3 sm:pt-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="break-words text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {displayName}
              </h1>
              {!isNonSeller && (
                <Badge
                  variant="secondary"
                  className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary hover:bg-primary/15"
                >
                  ผู้ขาย
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground sm:text-base">
              <span>@{profile.username}</span>
              {profile.phone ? (
                <>
                  <span className="text-muted-foreground/60">•</span>
                  <span className="inline-flex items-center gap-1.5">
                    <Phone className="size-3.5 text-muted-foreground" aria-hidden="true" />
                    <span className="sr-only">Phone number : </span>
                    <a
                      href={`tel:${profile.phone.replace(/[^+\d]/g, "")}`}
                      className="font-medium text-foreground hover:underline"
                    >
                      {profile.phone}
                    </a>
                  </span>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Unified Stats Row (Flush at the bottom, divided by clean borders) */}
      <div
        className={cn(
          "border-t border-border bg-[#F8F9FA]",
          isNonSeller
            ? "grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border"
            : "grid grid-cols-2 md:grid-cols-4",
        )}
      >
        {/* Card 1: คะแนนร้านค้า (hidden if not a seller) */}
        {!isNonSeller && (
          <div className="flex items-center gap-3.5 p-4 border-r border-border sm:gap-4 md:px-6 md:py-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#FEF6E7] text-[#F59E0B]">
              <Star className="size-5 fill-[#F59E0B] text-[#F59E0B]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-muted-foreground">คะแนนร้านค้า</p>
              {ratingCount > 0 ? (
                <p className="text-xl font-bold text-foreground sm:text-2xl">
                  {ratingAvg.toFixed(1)}{" "}
                  <span className="text-sm font-normal text-muted-foreground">/ 5</span>
                </p>
              ) : (
                <p className="text-xl font-bold text-foreground sm:text-2xl">—</p>
              )}
              <p className="truncate text-xs text-muted-foreground">
                {ratingCount > 0 ? `จาก ${ratingCount} รีวิวของผู้ซื้อ` : "ยังไม่มีรีวิว"}
              </p>
            </div>
          </div>
        )}

        {/* Card 2: สินค้าที่วางขาย */}
        <div
          className={cn(
            "flex items-center gap-3.5 p-4 sm:gap-4 md:px-6 md:py-4",
            !isNonSeller && "md:border-r md:border-border",
          )}
        >
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#EDF5FD] text-[#0B63C5]">
            <Package className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-muted-foreground">สินค้าที่วางขาย</p>
            <p className="text-xl font-bold text-foreground sm:text-2xl">
              {listingsTotal ?? "—"}{" "}
              <span className="text-sm font-normal text-muted-foreground">รายการ</span>
            </p>
            <p className="truncate text-xs text-muted-foreground">ประกาศที่เปิดขายอยู่ตอนนี้</p>
          </div>
        </div>

        {/* Card 3: รีวิวเชิงบวก (hidden if not a seller) */}
        {!isNonSeller && (
          <div className="flex items-center gap-3.5 p-4 border-t border-r border-border sm:gap-4 md:border-t-0 md:px-6 md:py-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#EDF5FD] text-[#0B63C5]">
              <ThumbsUp className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-muted-foreground">รีวิวเชิงบวก</p>
              {positivePercent !== null ? (
                <p className="text-xl font-bold text-foreground sm:text-2xl">
                  {positivePercent}%
                </p>
              ) : (
                <p className="text-xl font-bold text-foreground sm:text-2xl">—</p>
              )}
              <p className="truncate text-xs text-muted-foreground">
                {positivePercent !== null ? "ให้ 4–5 ดาว" : "ยังไม่มีรีวิว"}
              </p>
            </div>
          </div>
        )}

        {/* Card 4: คอลเลกชันสาธารณะ */}
        <div
          className={cn(
            "flex items-center gap-3.5 p-4 sm:gap-4 md:px-6 md:py-4",
            !isNonSeller && "border-t border-border md:border-t-0",
          )}
        >
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#EDF5FD] text-[#0B63C5]">
            <Layers className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-muted-foreground">คอลเลกชันสาธารณะ</p>
            <p className="text-xl font-bold text-foreground sm:text-2xl">
              {collectionTotal ?? "—"}{" "}
              <span className="text-sm font-normal text-muted-foreground">ใบ</span>
            </p>
            <p className="truncate text-xs text-muted-foreground">ไม่จำเป็นต้องวางขาย</p>
          </div>
        </div>
      </div>
    </section>
  );
}
