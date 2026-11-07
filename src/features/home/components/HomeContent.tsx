import { translate, useLanguage } from "@/lib/language";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { ErrorState, ItemCard } from "@/components/common";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { PriceTag, SaleBadge, isOnSale } from "@/components/sale";
import { formatPrice } from "@/features/catalog/catalog.mappers";
import { FeaturedSalesSection } from "@/features/sale/components/FeaturedSalesSection";
import {
  FeaturedSkeleton,
  GamesSkeleton,
  HeroSkeleton,
  ProductGridSkeleton,
  ProductRailSkeleton,
} from "@/features/home/components/HomePageSkeleton";
import { FALLBACK_HERO_SLIDE } from "@/features/home/home.mappers";
import {
  useExploreMore,
  useFeaturedCategories,
  useGames,
  useHeroSlides,
  useNewReleases,
  usePegasusPicks,
  useTrending,
} from "@/features/home/home.queries";
import type {
  GameCategory,
  HeroSlide,
  HomeProduct,
  ProductCategory,
  TrendingProduct,
} from "@/features/home/home.types";
import { ClaimTicketRail } from "@/features/promotions/ClaimTicketRail";
import { useFeaturedPromotions } from "@/features/promotions/claim.queries";
import { env } from "@/lib/env";
import { AuctionEndingSoonSection } from "./AuctionEndingSoonSection";
import { cn } from "@/lib/utils";

const DEFAULT_CAROUSEL_INTERVAL_MS = 7500;
const HERO_CAROUSEL_INTERVAL_MS = 4000;

function useHomeCarousel(
  itemCount: number,
  intervalMs = DEFAULT_CAROUSEL_INTERVAL_MS,
) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (!api) return;

    const updateCurrent = () => setCurrent(api.selectedScrollSnap());
    updateCurrent();
    api.on("select", updateCurrent);
    api.on("reInit", updateCurrent);

    return () => {
      api.off("select", updateCurrent);
      api.off("reInit", updateCurrent);
    };
  }, [api]);

  useEffect(() => {
    if (!api || itemCount < 2 || isPaused) return;

    const timer = window.setInterval(
      () => api.scrollNext(),
      intervalMs,
    );

    return () => window.clearInterval(timer);
  }, [api, current, intervalMs, isPaused, itemCount]);

  const scrollTo = useCallback(
    (index: number) => api?.scrollTo(index),
    [api],
  );

  return {
    current,
    isPaused,
    scrollTo,
    setApi,
    setIsPaused,
  };
}

function CarouselPagination({
  ids,
  current,
  label,
  itemLabel,
  onSelect,
  className,
}: {
  ids: string[];
  current: number;
  label: string;
  itemLabel: string;
  onSelect: (index: number) => void;
  className?: string;
}) {
  useLanguage();
  return (
    <div
      className={cn(
        "flex h-2 items-start justify-center gap-2.5",
        className,
      )}
      aria-label={label}
    >
      {ids.map((id, index) => (
        <button
          key={id}
          type="button"
          aria-label={`${itemLabel} ${index + 1}`}
          aria-current={current === index ? "true" : undefined}
          onClick={() => onSelect(index)}
          className={cn(
            "h-1.5 cursor-pointer rounded-[3px] transition-[width,background-color,transform] hover:scale-y-125 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
            current === index
              ? "w-8 bg-primary"
              : "w-4 bg-muted-foreground",
          )}
        />
      ))}
    </div>
  );
}

type SectionHeaderProps = {
  title: string;
  actionLabel?: string;
  /** ปลายทางของปุ่มขวามือ; ไม่ส่งมาก็ไม่มีปุ่ม */
  actionHref?: string;
  description?: string;
};

function SectionHeader({
  title,
  actionLabel = translate("ดูทั้งหมด", "View All"),
  actionHref,
  description,
}: SectionHeaderProps) {
  useLanguage();
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4",
        description ? "h-11" : "h-7",
      )}
    >
      <div className="min-w-0">
        <h2 className="text-[28px] leading-8 font-semibold text-foreground">
          {title}
        </h2>
        {description ? (
          <p className="text-[10px] leading-3 text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {actionHref ? (
        <Button
          variant="link"
          size="sm"
          className="h-7 shrink-0 cursor-pointer px-0 text-sm font-normal"
          nativeButton={false}
          render={<Link to={actionHref} />}
        >
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}

function HomeProductCard({
  product,
  rank,
}: {
  product: HomeProduct;
  rank?: number;
}) {
  useLanguage();
  const onSale = isOnSale(product.pricing);
  const price = formatPrice(onSale && product.pricing ? product.pricing.salePrice : product.price);

  return (
    <div className="relative h-[260px] min-w-0">
      <Link
        to={product.href}
        aria-label={translate(`${product.name} ราคา ${price}`, `${product.name}, price ${price}`)}
        className="block h-full w-full cursor-pointer rounded-xl text-left outline-none transition-[filter] hover:drop-shadow-md focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <ItemCard
          imageSrc={product.image}
          imageAlt={product.imageAlt}
          badge={product.type}
          title={product.name}
          price={onSale ? undefined : price}
          footer={onSale ? <PriceTag pricing={product.pricing} /> : undefined}
          className="h-full w-full [&_img]:object-contain"
        />
      </Link>
      {onSale && product.pricing ? (
        <SaleBadge
          type={product.pricing.sale?.type === "FLASH_SALE" ? "flash" : "percent"}
          percent={product.pricing.discountPercent}
          className="absolute top-6 right-7"
        />
      ) : null}
      {rank ? (
        <Badge className="absolute top-2.5 left-2.5 size-[22px] rounded-full bg-foreground p-0 text-[10px] text-background">
          {rank}
        </Badge>
      ) : null}
    </div>
  );
}

function CompactFeature({
  slide,
  isPrimaryHeading,
}: {
  slide: HeroSlide;
  isPrimaryHeading: boolean;
}) {
  useLanguage();
  return (
    <article className="flex flex-col overflow-hidden bg-background lg:h-[360px] lg:flex-row">
      <div className="order-2 flex min-h-[320px] flex-col justify-center gap-[14px] px-6 py-10 sm:px-12 lg:order-1 lg:h-full lg:min-h-0 lg:w-[500px] lg:shrink-0">
        <p className="text-xs font-semibold tracking-[0.08em] text-muted-foreground">
          {slide.eyebrow}
        </p>
        {isPrimaryHeading ? (
          <h1 className="whitespace-pre-line text-4xl leading-[1.08] font-bold tracking-tight text-foreground">
            {slide.title}
          </h1>
        ) : (
          <h2 className="whitespace-pre-line text-4xl leading-[1.08] font-bold tracking-tight text-foreground">
            {slide.title}
          </h2>
        )}
        <p className="max-w-[404px] text-sm leading-[1.45] text-muted-foreground">
          {slide.description}
        </p>
        <div className="flex flex-wrap items-center gap-2.5">
          {slide.primaryAction ? (
            <Button
              size="lg"
              className="h-11 min-w-[148px] cursor-pointer rounded-lg"
              nativeButton={false}
              render={<Link to={slide.primaryAction.href} />}
            >
              {slide.primaryAction.label}
            </Button>
          ) : null}
          {slide.secondaryAction ? (
            <Button
              variant="outline"
              size="lg"
              className="h-11 min-w-[126px] cursor-pointer rounded-lg"
              nativeButton={false}
              render={<Link to={slide.secondaryAction.href} />}
            >
              {slide.secondaryAction.label}
            </Button>
          ) : null}
        </div>
      </div>
      <div className="order-1 h-[260px] overflow-hidden lg:order-2 lg:h-full lg:min-w-0 lg:flex-1">
        <img
          src={slide.image}
          alt={slide.imageAlt}
          className="size-full object-cover"
        />
      </div>
    </article>
  );
}

function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  useLanguage();
  const { current, scrollTo, setApi, setIsPaused } = useHomeCarousel(
    slides.length,
    HERO_CAROUSEL_INTERVAL_MS,
  );

  return (
    <section aria-label={translate("โปรโมชั่นแนะนำ", "Featured promotions")} className="overflow-hidden bg-background">
      <Carousel
        setApi={setApi}
        opts={{ align: "start", loop: slides.length > 1, slidesToScroll: 1 }}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onFocusCapture={() => setIsPaused(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            setIsPaused(false);
          }
        }}
      >
        <CarouselContent className="-ml-0 cursor-grab active:cursor-grabbing">
          {slides.map((slide, index) => (
            <CarouselItem key={slide.id} className="basis-full pl-0">
              <CompactFeature
                slide={slide}
                isPrimaryHeading={index === 0}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPagination
          ids={slides.map((slide) => slide.id)}
          current={current}
          label={translate("เลือกโปรโมชั่น", "Select promotion")}
          itemLabel={translate("ไปยังโปรโมชั่น", "Go to promotion")}
          onSelect={scrollTo}
          className="my-2.5"
        />
      </Carousel>
    </section>
  );
}

function NewReleases({ products }: { products: HomeProduct[] }) {
  useLanguage();
  return (
    <section
      className="bg-secondary px-4 py-7 sm:px-6 lg:h-[642px] lg:px-8"
      aria-labelledby="new-releases-title"
    >
      <div className="mx-auto max-w-[1216px]">
        <div id="new-releases-title">
          <SectionHeader title={translate("สินค้าออกใหม่", "New Releases")} actionHref="/search?sort=newest" />
        </div>
        <div className="mt-[18px] grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-[repeat(5,225.347px)]">
          {products.map((product) => (
            <HomeProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}

function BrowseByGame({ games }: { games: GameCategory[] }) {
  useLanguage();
  return (
    <section
      className="bg-background px-4 py-7 sm:px-6 lg:h-[260px] lg:px-8"
      aria-labelledby="browse-by-game-title"
    >
      <div className="mx-auto max-w-[1216px]">
        <div id="browse-by-game-title">
          <SectionHeader title={translate("เลือกซื้อตามเกม", "Shop by Game")} actionHref="/search" />
        </div>
        <div className="-mx-1 mt-[14px] -mb-1 flex gap-4 overflow-x-auto px-1 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {games.map((game) => (
            <Link
              key={game.id}
              to={game.href}
              className="group flex h-40 w-[138px] shrink-0 cursor-pointer flex-col items-center gap-2.5 rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <span className="flex size-[104px] items-center justify-center overflow-hidden rounded-full bg-muted transition-shadow group-hover:shadow-md group-hover:ring-2 group-hover:ring-primary/30">
                {game.image ? (
                  <img
                    src={game.image}
                    alt={game.imageAlt}
                    className="size-[82px] object-contain"
                  />
                ) : (
                  <span
                    aria-hidden="true"
                    className="text-2xl font-semibold text-muted-foreground"
                  >
                    {game.name.charAt(0)}
                  </span>
                )}
              </span>
              <span className="w-full text-center text-sm text-foreground">
                {game.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductRail({
  title,
  products,
  description,
  actionLabel,
  actionHref,
}: {
  title: string;
  products: (HomeProduct | TrendingProduct)[];
  description?: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  useLanguage();
  return (
    <section
      className={cn(
        "bg-secondary px-4 py-7 sm:px-6 lg:px-8",
        description ? "lg:h-[400px]" : "lg:h-[390px]",
      )}
      aria-label={title}
    >
      <div className="mx-auto max-w-[1216px]">
        <SectionHeader
          title={title}
          description={description}
          actionLabel={actionLabel}
          actionHref={actionHref}
        />
        <Carousel
          opts={{ align: "start", dragFree: true }}
          className="mt-[18px]"
        >
          <CarouselContent className="cursor-grab active:cursor-grabbing">
            {products.map((product) => (
              <CarouselItem
                key={product.id}
                className="basis-[min(241.347px,calc(100vw-2rem))]"
              >
                <HomeProductCard
                  product={product}
                  rank={"rank" in product ? product.rank : undefined}
                />
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    </section>
  );
}

function FeaturedCategories({
  categories,
}: {
  categories: ProductCategory[];
}) {
  useLanguage();
  const { current, scrollTo, setApi, setIsPaused } = useHomeCarousel(
    categories.length,
  );

  return (
    <section
      className="bg-secondary px-4 py-7 sm:px-6 lg:h-[473px] lg:px-8"
      aria-labelledby="featured-title"
    >
      <div className="mx-auto max-w-[1216px]">
        <div id="featured-title">
          <SectionHeader title={translate("แนะนำ", "Featured")} />
        </div>
        <Carousel
          setApi={setApi}
          opts={{
            align: "start",
            loop: categories.length > 3,
            slidesToScroll: 1,
          }}
          className="mt-[18px]"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onFocusCapture={() => setIsPaused(true)}
          onBlurCapture={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) {
              setIsPaused(false);
            }
          }}
        >
          <CarouselContent className="cursor-grab active:cursor-grabbing">
            {categories.map((category) => (
              <CarouselItem
                key={category.id}
                className="basis-[min(396.8px,calc(100vw-2rem))]"
              >
                <Link
                  to={category.href}
                  className="group block h-[371px] w-full min-w-0 cursor-pointer rounded-[20px] text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <Card className="h-full gap-0 rounded-[20px] border border-border py-0 shadow-none ring-0 transition-[box-shadow,border-color] group-hover:border-primary/40 group-hover:shadow-md">
                    <div className="h-[272px] w-full overflow-hidden bg-muted">
                      <img
                        src={category.image}
                        alt={category.imageAlt}
                        className="size-full object-contain"
                      />
                    </div>
                    <CardHeader className="flex flex-1 items-center justify-center px-7">
                      <CardTitle className="text-center text-[28px] leading-[41px] font-medium">
                        {category.name}
                      </CardTitle>
                    </CardHeader>
                  </Card>
                </Link>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
        <CarouselPagination
          ids={categories.map((category) => category.id)}
          current={current}
          label={translate("เลือกหมวดหมู่สินค้า", "Select product category")}
          itemLabel={translate("ไปยังหมวดหมู่", "Go to category")}
          onSelect={scrollTo}
          className="mt-2.5"
        />
      </div>
    </section>
  );
}

function ExploreGrid({ products }: { products: HomeProduct[] }) {
  useLanguage();
  return (
    <section
      className="bg-secondary px-4 py-7 sm:px-6 lg:h-[638px] lg:px-8"
      aria-labelledby="explore-title"
    >
      <div className="mx-auto max-w-[1216px]">
        <div id="explore-title">
          <SectionHeader
            title={translate("สำรวจเพิ่มเติม", "More to Explore")}
            actionLabel={translate("เพิ่มเติม", "more")}
            actionHref="/search"
          />
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-[repeat(5,225.347px)] lg:gap-x-[14.653px]">
          {products.map((product) => (
            <HomeProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * กล่อง error กลาง (`ErrorState`) วางในกรอบเดียวกับ section อื่น — ไม่ใช้ `QueryBoundary`
 * ตรง ๆ เพราะมันวางกล่อง error ชิดขอบจอ ซึ่งหน้าแรกที่แต่ละ section มีระยะของตัวเองรับไม่ได้
 */
function SectionError({
  title,
  query,
}: {
  title: string;
  query: { error: unknown; refetch: () => unknown };
}) {
  useLanguage();
  return (
    <section
      aria-label={title}
      className="bg-secondary px-4 py-7 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-[1216px]">
        <ErrorState
          error={query.error}
          title={translate(`โหลด ${title} ไม่สำเร็จ`, `Unable to load ${title}`)}
          onRetry={() => query.refetch()}
          className="min-h-0 bg-background py-10"
        />
      </div>
    </section>
  );
}

// ---------- sections ที่ผูกกับ API: แต่ละอันมีสถานะโหลด / พัง / ว่าง ของตัวเอง ----------

/** โหลดไม่ขึ้นหรือยังไม่มีสไลด์ ก็ยังมีสไลด์ตั้งต้น หน้าแรกจะไม่เริ่มด้วยช่องว่าง */
function HeroSection() {
  useLanguage();
  const { data, isPending } = useHeroSlides();

  if (isPending) {
    return <HeroSkeleton />;
  }
  return <HeroCarousel slides={data?.length ? data : [FALLBACK_HERO_SLIDE]} />;
}

/** H1 "โค้ดส่วนลด" — ไม่มีโค้ดหรือโหลดไม่ขึ้นก็ซ่อนทั้ง section ไม่ให้กินที่หน้าแรก */
function PromotionsSection() {
  useLanguage();
  const query = useFeaturedPromotions();

  if (!query.data?.length) return null;
  return (
    <section
      className="bg-secondary px-4 pt-7 sm:px-6 lg:px-8"
      aria-labelledby="home-promotions-title"
    >
      <div className="mx-auto max-w-[1216px]">
        <div id="home-promotions-title">
          <SectionHeader
            title={translate("โค้ดส่วนลด", "Discount codes")}
            description={translate("กดเก็บไว้ก่อน แล้วเลือกใช้ได้ในตะกร้า · ใช้คู่กับโค้ดร้านได้", "Save a code now and apply it in your cart · Can be combined with store codes")}
            actionLabel={translate("ดูโค้ดของฉัน", "View my codes")}
            actionHref="/account/coupons"
          />
        </div>
        <ClaimTicketRail codes={query.data} source="HOME" />
      </div>
    </section>
  );
}

function NewReleasesSection() {
  useLanguage();
  const query = useNewReleases();

  if (query.isPending) return <ProductGridSkeleton />;
  if (query.isError) return <SectionError title={translate("สินค้าออกใหม่", "New Releases")} query={query} />;
  if (query.data.length === 0) return null;
  return <NewReleases products={query.data} />;
}

function GamesSection() {
  useLanguage();
  const query = useGames();

  if (query.isPending) return <GamesSkeleton />;
  if (query.isError) return <SectionError title={translate("เลือกซื้อตามเกม", "Shop by Game")} query={query} />;
  if (query.data.length === 0) return null;
  return <BrowseByGame games={query.data} />;
}

function TrendingSection() {
  useLanguage();
  const query = useTrending();

  if (query.isPending) return <ProductRailSkeleton />;
  if (query.isError) return <SectionError title={translate("กำลังเป็นที่นิยม", "Trending Now")} query={query} />;
  if (query.data.length === 0) return null;
  return (
    <ProductRail title={translate("กำลังเป็นที่นิยม", "Trending Now")} actionHref="/search" products={query.data} />
  );
}

function FeaturedSection() {
  useLanguage();
  const query = useFeaturedCategories();

  if (query.isPending) return <FeaturedSkeleton />;
  if (query.isError) return <SectionError title={translate("แนะนำ", "Featured")} query={query} />;
  if (query.data.length === 0) return null;
  return <FeaturedCategories categories={query.data} />;
}

function PegasusPicksSection() {
  useLanguage();
  const query = usePegasusPicks();

  if (query.isPending) return <ProductRailSkeleton description />;
  if (query.isError) return <SectionError title={translate("Pegasus คัดสรร", "Pegasus Picks")} query={query} />;
  if (query.data.length === 0) return null;
  return (
    <ProductRail
      title={translate("Pegasus คัดสรร", "Pegasus Picks")}
      description="Curated, verified, and shipped by Pegasus."
      actionLabel="Shop Pegasus"
      actionHref={`/u/${encodeURIComponent(env.pegasusStoreUsername)}`}
      products={query.data}
    />
  );
}

function ExploreSection() {
  useLanguage();
  const query = useExploreMore();

  if (query.isPending) return <ProductGridSkeleton explore />;
  if (query.isError) return <SectionError title={translate("สำรวจเพิ่มเติม", "More to Explore")} query={query} />;
  if (query.data.length === 0) return null;
  return <ExploreGrid products={query.data} />;
}

export function HomeContent() {
  useLanguage();
  return (
    <div className="bg-secondary font-sans">
      <HeroSection />
      {/* Flash Sale + แบนเนอร์ลดทั้งหมวด (TCG-683) — เหนือแถบโค้ดส่วนลด (PRM-H1) */}
      <FeaturedSalesSection />
      <PromotionsSection />
      <NewReleasesSection />
      <GamesSection />
      <TrendingSection />
      {/* ระบบประมูล [TCG-636] */}
      <AuctionEndingSoonSection />
      <FeaturedSection />
      <PegasusPicksSection />
      <ExploreSection />
    </div>
  );
}
