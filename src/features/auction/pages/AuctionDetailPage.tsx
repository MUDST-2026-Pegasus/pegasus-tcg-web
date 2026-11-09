import { useState } from "react";
import { Heart } from "lucide-react";
import { Link, useParams } from "react-router-dom";

import { ErrorState } from "@/components/common";
import { DetailPageSkeleton } from "@/components/common/PageSkeletons";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { CONDITION_LABELS } from "@/features/catalog/catalog.mappers";
import { useProductDetail } from "@/features/catalog/catalog.queries";
import {
  CardAttributesCard,
  CardEffectsCard,
  ProductBadges,
  ProductGallery,
  TrustStrip,
  type GalleryImage,
} from "@/features/catalog/components/ProductDetailSections";
import { ApiError } from "@/lib/api";

import { useAuction } from "../auction.queries";
import type { AuctionDetail, BidPlaced } from "../auction.types";
import { resolveBidPanelState } from "../bid-panel.state";
import { useCountdown } from "../useCountdown";
import { AuctionRules } from "../components/AuctionRules";
import { BidHistory } from "../components/BidHistory";
import { BidPanel } from "../components/BidPanel";
import { BidStatusBanner } from "../components/BidStatusBanner";
import { ConfirmBidDialog } from "../components/ConfirmBidDialog";
import { ConfirmBuyNowDialog } from "../components/ConfirmBuyNowDialog";
import { SellerNote } from "../components/SellerNote";
import { usePageTitle } from "@/hooks/use-page-title";
import { intlLocale } from "@/lib/i18n";

/** `/auctions/:auctionId` — หน้ารายละเอียดการประมูล ตาม Figma B2 (2291:7862) + สถานะ B3/B4 [TCG-629 · TCG-630] */
export function AuctionDetailPage() {
  const { auctionId } = useParams<{ auctionId: string }>();
  const id = auctionId && /^\d+$/.test(auctionId) ? Number(auctionId) : null;
  const auction = useAuction(id);
  usePageTitle(auction.data?.item.card.productName);

  if (id === null || (auction.isError && auction.error instanceof ApiError && auction.error.status === 404)) {
    return (
      <div className="flex-1 space-y-4 p-8 text-center">
        <h1 className="text-xl font-bold">ไม่พบการประมูลนี้</h1>
        <p className="text-muted-foreground">การประมูลอาจถูกนำออก หรือ URL ไม่ถูกต้อง</p>
        <Link to="/auctions" className="inline-block underline">กลับหน้ารวมการประมูล</Link>
      </div>
    );
  }
  if (auction.isPending) return <DetailPageSkeleton label="กำลังโหลดการประมูล" />;
  if (auction.isError) {
    return (
      <div className="flex-1 p-8">
        <ErrorState error={auction.error} onRetry={() => void auction.refetch()} />
      </div>
    );
  }
  return <AuctionDetailContent key={auction.data.id} auction={auction.data} />;
}

/** "1.2k" สำหรับยอดขายของร้าน */
function compactCount(count: number): string {
  return count >= 1000 ? `${(count / 1000).toLocaleString(intlLocale(), { maximumFractionDigits: 1 })}k` : String(count);
}

function AuctionDetailContent({ auction }: { auction: AuctionDetail }) {
  const { item, seller } = auction;
  const [selectedImageId, setSelectedImageId] = useState<GalleryImage["id"] | null>(null);
  const [confirmAmount, setConfirmAmount] = useState<number | null>(null);
  const [buyNowOpen, setBuyNowOpen] = useState(false);
  const [lastBid, setLastBid] = useState<BidPlaced | null>(null);
  // นับถอยหลังเองด้วย: ถึง 0 แล้วปิดช่องบิดทันที ไม่ต้องรอ job ปิดประมูลเปลี่ยนสถานะ
  const remaining = useCountdown(auction.status === "LIVE" ? auction.endsAt : null, auction.serverTime);
  const panelState = resolveBidPanelState(auction, undefined, remaining === 0);
  // คุณสมบัติ/ท่าโจมตีดึงจากแคตตาล็อก — โหลดไม่ได้ก็ซ่อนแถวล่างไป ไม่ให้หน้าประมูลพัง
  const product = useProductDetail(item.card.productSlug);

  const gallery: GalleryImage[] = [
    ...auction.photoUrls.map((url, index) => ({ id: `photo-${index}`, url, alt: `${item.card.productName} รูปที่ ${index + 1}` })),
    ...(item.card.officialImageUrl ? [{ id: "official", url: item.card.officialImageUrl, alt: item.card.productName }] : []),
  ];

  const showHistory = () => document.getElementById("bid-history")?.scrollIntoView({ behavior: "smooth" });

  return (
    <div className="flex-1 bg-secondary font-sans text-foreground">
      <main className="mx-auto flex w-full max-w-[1200px] flex-col gap-8 px-5 py-8 sm:px-6 lg:py-10">
        <Breadcrumb>
          <BreadcrumbList className="text-sm">
            <BreadcrumbItem><BreadcrumbLink render={<Link to="/" />}>Home</BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbLink render={<Link to="/auctions" />}>ประมูล</BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>{item.gameName}</BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbPage>{item.card.productName}</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <section className="grid gap-8 lg:grid-cols-[minmax(0,1.03fr)_minmax(390px,.97fr)] lg:gap-12">
          <ProductGallery images={gallery} selectedId={selectedImageId} onSelect={setSelectedImageId} />

          <div className="flex min-w-0 flex-col gap-5">
            <div>
              <ProductBadges game={item.gameName} rarity={item.rarity} />
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{item.card.productName}</h1>
              <p className="mt-2 text-muted-foreground">{[item.setName, item.cardNumber].filter(Boolean).join(" · ")}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                ขายโดย{" "}
                <Link to={`/u/${encodeURIComponent(seller.username)}`} className="font-semibold text-primary hover:underline">
                  {seller.shopName}
                </Link>
                {seller.rating !== null ? <> <span className="text-amber-500">★</span> {seller.rating.toFixed(1)}</> : null}
                {" · "}{compactCount(seller.soldCount)} ขาย · <span className="font-semibold text-foreground">สภาพ {item.condition} ({CONDITION_LABELS[item.condition]})</span>
              </p>
            </div>

            <SellerNote note={auction.sellerNote} />
            {/* หมดเวลาแล้ว: ซ่อนแบนเนอร์ที่มีปุ่ม "บิดอีกครั้ง" จนกว่าสถานะจะเปลี่ยน */}
            {panelState !== "CLOSING" ? (
              <BidStatusBanner auction={auction} lastBid={lastBid} onBid={setConfirmAmount} />
            ) : null}
            <BidPanel
              auction={auction}
              state={panelState}
              onBid={setConfirmAmount}
              onBuyNow={() => setBuyNowOpen(true)}
              onShowHistory={showHistory}
            />
            {/* ยังไม่มี API ติดตามการประมูล — ปุ่มแสดงตามแบบไว้ก่อน */}
            <Button type="button" variant="outline" className="h-11 w-full rounded-full bg-card font-semibold">
              <Heart aria-hidden />
              ติดตามการประมูลนี้
            </Button>
            <TrustStrip />
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <BidHistory auctionId={auction.id} bidCount={auction.bidCount} live={auction.status === "LIVE"} />
          <AuctionRules />
        </section>

        {product.isSuccess ? (
          <section className="grid gap-6 lg:grid-cols-2">
            <CardAttributesCard product={product.data.product} />
            {product.data.product.productType === "SINGLE_CARD" && <CardEffectsCard productId={product.data.product.id} title="Attacks" />}
          </section>
        ) : null}
      </main>

      <ConfirmBidDialog
        auction={auction}
        amount={confirmAmount}
        onOpenChange={(open) => !open && setConfirmAmount(null)}
        onPlaced={setLastBid}
      />
      <ConfirmBuyNowDialog auction={auction} open={buyNowOpen} onOpenChange={setBuyNowOpen} />
    </div>
  );
}
