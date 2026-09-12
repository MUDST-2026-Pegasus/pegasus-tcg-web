import { useCallback, useEffect, useState } from "react";

import { ItemCard } from "@/components/common/ItemCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import type {
  GameCategory,
  HeroSlide,
  HomeData,
  HomeProduct,
  ProductCategory,
  TrendingProduct,
} from "@/features/home/home.types";
import { cn } from "@/lib/utils";

const currencyFormatter = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
  maximumFractionDigits: 0,
});

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
  description?: string;
  showAction?: boolean;
};

function SectionHeader({
  title,
  actionLabel = "View All",
  description,
  showAction = true,
}: SectionHeaderProps) {
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
      {showAction ? (
        <Button
          type="button"
          variant="link"
          size="sm"
          className="h-7 shrink-0 cursor-pointer px-0 text-sm font-normal"
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
  return (
    <div className="relative h-[260px] min-w-0">
      <button
        type="button"
        aria-label={`${product.name} ราคา ${currencyFormatter.format(product.price)}`}
        className="block h-full w-full cursor-pointer rounded-xl text-left outline-none transition-[filter] hover:drop-shadow-md focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <ItemCard
          imageSrc={product.image}
          imageAlt={product.imageAlt}
          badge={product.type}
          title={product.name}
          price={currencyFormatter.format(product.price)}
          className="h-full w-full [&_img]:object-contain"
        />
      </button>
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
          <Button
            type="button"
            size="lg"
            className="h-11 w-[148px] cursor-pointer rounded-lg"
          >
            Shop New Releases
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="h-11 w-[126px] cursor-pointer rounded-lg"
          >
            Explore Cards
          </Button>
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
  const { current, scrollTo, setApi, setIsPaused } = useHomeCarousel(
    slides.length,
    HERO_CAROUSEL_INTERVAL_MS,
  );

  return (
    <section aria-label="โปรโมชั่นแนะนำ" className="overflow-hidden bg-background">
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
          label="เลือกโปรโมชั่น"
          itemLabel="ไปยังโปรโมชั่น"
          onSelect={scrollTo}
          className="my-2.5"
        />
      </Carousel>
    </section>
  );
}

function NewReleases({ products }: { products: HomeProduct[] }) {
  return (
    <section
      className="bg-secondary px-4 py-7 sm:px-6 lg:h-[642px] lg:px-8"
      aria-labelledby="new-releases-title"
    >
      <div className="mx-auto max-w-[1216px]">
        <div id="new-releases-title">
          <SectionHeader title="New Releases" />
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
  return (
    <section
      className="bg-background px-4 py-7 sm:px-6 lg:h-[260px] lg:px-8"
      aria-labelledby="browse-by-game-title"
    >
      <div className="mx-auto max-w-[1216px]">
        <div id="browse-by-game-title">
          <SectionHeader title="Shop by Game" />
        </div>
        <div className="mt-[18px] flex gap-4 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {games.map((game) => (
            <button
              key={game.id}
              type="button"
              className="group flex h-40 w-[138px] shrink-0 cursor-pointer flex-col items-center gap-2.5 rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <span className="flex size-[104px] items-center justify-center overflow-hidden rounded-full bg-muted transition-shadow group-hover:shadow-md group-hover:ring-2 group-hover:ring-primary/30">
                <img
                  src={game.image}
                  alt={game.imageAlt}
                  className="size-[82px] object-contain"
                />
              </span>
              <span className="w-full text-center text-sm text-foreground">
                {game.name}
              </span>
            </button>
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
}: {
  title: string;
  products: (HomeProduct | TrendingProduct)[];
  description?: string;
  actionLabel?: string;
}) {
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
          <SectionHeader title="Featured" showAction={false} />
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
                <button
                  type="button"
                  className="group h-[371px] w-full min-w-0 cursor-pointer rounded-[20px] text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
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
                </button>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
        <CarouselPagination
          ids={categories.map((category) => category.id)}
          current={current}
          label="เลือกหมวดหมู่สินค้า"
          itemLabel="ไปยังหมวดหมู่"
          onSelect={scrollTo}
          className="mt-2.5"
        />
      </div>
    </section>
  );
}

function ExploreGrid({ products }: { products: HomeProduct[] }) {
  return (
    <section
      className="bg-secondary px-4 py-7 sm:px-6 lg:h-[638px] lg:px-8"
      aria-labelledby="explore-title"
    >
      <div className="mx-auto max-w-[1216px]">
        <div id="explore-title">
          <SectionHeader title="More to Explore" actionLabel="more" />
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

export function HomeContent({ data }: { data: HomeData }) {
  return (
    <div className="bg-secondary font-sans">
      <HeroCarousel slides={data.heroSlides} />
      <NewReleases products={data.newReleases} />
      <BrowseByGame games={data.games} />
      <ProductRail title="Trending Now" products={data.trending} />
      <FeaturedCategories categories={data.categories} />
      <ProductRail
        title="Pegasus Picks"
        description="Curated, verified, and shipped by Pegasus."
        actionLabel="Shop Pegasus"
        products={data.pegasusProducts}
      />
      <ExploreGrid products={data.exploreMore} />
    </div>
  );
}
