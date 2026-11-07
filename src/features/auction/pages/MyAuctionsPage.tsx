import { translate, useLanguage } from "@/lib/language";
import { Gavel, ShieldCheck } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";

import { ProductRowsSkeleton } from "@/components/common/PageSkeletons";
import { Button } from "@/components/ui/button";
import { AccountSidebar } from "@/features/account/components/AccountSidebar";
import { toSidebarUser } from "@/features/account/account.format";
import { useAuth } from "@/features/auth/auth.queries";
import { cn } from "@/lib/utils";

import { MY_AUCTION_TABS, strikeTone, type StrikeTone } from "../auction.format";
import { useMyAuctions } from "../auction.queries";
import type { MyAuctionTab } from "../auction.types";
import { MyAuctionRow } from "../components/MyAuctionRow";
import { StrikeBanner } from "../components/StrikeBanner";

const STRIKE_CHIP: Record<StrikeTone, string> = {
  clear: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  banned: "border-red-200 bg-red-50 text-red-700",
};

function parseTab(raw: string | null): MyAuctionTab {
  return MY_AUCTION_TABS.some((t) => t.key === raw) ? (raw as MyAuctionTab) : "ALL";
}

/** `/account/auctions` — การประมูลของฉัน ฝั่งผู้ซื้อ (Figma W1 + B3-H) [TCG-631 · FE-5] */
export function MyAuctionsPage() {
  useLanguage();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = parseTab(searchParams.get("tab"));
  const { data, isLoading, isError, refetch } = useMyAuctions(tab);

  const selectTab = (next: MyAuctionTab) =>
    setSearchParams(
      (current) => {
        const params = new URLSearchParams(current);
        if (next === "ALL") params.delete("tab");
        else params.set("tab", next);
        return params;
      },
      { replace: true, preventScrollReset: true },
    );

  const neverBid = data !== undefined && data.tabCounts.ALL === 0;

  return (
    <div className="min-h-[956px] bg-muted/60 px-4 py-8 font-sans sm:px-6 lg:px-12">
      <div className="mx-auto grid max-w-[1440px] gap-8 lg:grid-cols-[280px_1fr]">
        <AccountSidebar user={toSidebarUser(user)} />

        <div className="flex min-w-0 flex-col gap-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-foreground">{translate("การประมูลของฉัน", "My auctions")}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{translate("ทุกประมูลที่คุณเคยบิด — ชนะแล้วชำระภายใน 24 ชม.", "All auctions you have bid on — pay within 24 hours after winning")}</p>
            </div>
            {data ? (
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold",
                  STRIKE_CHIP[strikeTone(data.unpaidStrikes, data.strikeLimit)],
                )}
              >
                <ShieldCheck aria-hidden className="size-3.5" />{translate("ไม่ชำระหลังชนะ", "Unpaid auction wins")}{data.unpaidStrikes} / {data.strikeLimit}{translate("ครั้ง", "strikes")}</span>
            ) : null}
          </div>

          {data ? (
            <StrikeBanner
              unpaidStrikes={data.unpaidStrikes}
              strikeLimit={data.strikeLimit}
              bannedUntil={data.bannedUntil}
              lastStrikeCardName={data.lastStrikeCardName}
            />
          ) : null}

          {!neverBid ? (
            <div role="tablist" aria-label={translate("สถานะการประมูล", "Auction status")} className="flex flex-wrap items-center gap-2 pb-1">
              {MY_AUCTION_TABS.map(({ key, label }) => {
                const active = tab === key;
                return (
                  <button
                    key={key}
                    role="tab"
                    type="button"
                    aria-selected={active}
                    onClick={() => selectTab(key)}
                    className={cn(
                      "flex shrink-0 cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors select-none",
                      active
                        ? "border-foreground bg-foreground font-semibold text-background"
                        : "border-border bg-card text-foreground hover:bg-muted",
                    )}
                  >
                    {label}
                    <span className={cn("text-xs", active ? "text-background/80" : "text-muted-foreground")}>
                      {data?.tabCounts[key] ?? 0}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : null}

          {isLoading ? (
            <div role="status" aria-busy="true" aria-label={translate("กำลังโหลดการประมูลของฉัน", "Loading your auctions")}>
              <ProductRowsSkeleton />
            </div>
          ) : isError || !data ? (
            <div role="alert" className="flex flex-col items-center gap-3 rounded-xl border bg-card p-6 py-16">
              <p className="text-sm font-medium text-destructive">{translate("โหลดข้อมูลไม่สำเร็จ", "Unable to load data")}</p>
              <Button variant="outline" size="sm" onClick={() => void refetch()}>{translate("ลองใหม่", "Try again")}</Button>
            </div>
          ) : neverBid ? (
            <EmptyState />
          ) : (
            <div role="tabpanel" className="flex flex-col gap-4">
              {data.page.items.map((auction) => (
                <MyAuctionRow key={auction.id} auction={auction} serverTime={data.serverTime} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** W1 ยังไม่เคยบิด (Figma Empty states) */
function EmptyState() {
  useLanguage();
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border bg-card px-6 py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Gavel aria-hidden className="size-5" />
      </div>
      <div>
        <p className="text-base font-semibold text-foreground">{translate("คุณยังไม่ได้บิดประมูลไหน", "You have not bid on any auctions yet")}</p>
        <p className="mt-1 text-sm text-muted-foreground">{translate("ประมูลที่คุณบิดจะแสดงที่นี่ พร้อมสถานะนำอยู่ / ถูกแซง / ชนะ", "Auctions you bid on appear here with leading / outbid / won status")}</p>
      </div>
      <Button className="rounded-full" nativeButton={false} render={<Link to="/auctions" />}>{translate("ดูประมูลที่เปิดอยู่", "View open auctions")}</Button>
    </div>
  );
}
