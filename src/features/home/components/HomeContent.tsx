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
    <div className="flex min-h-[34px] items-start justify-between gap-4">
      <div className="min-w-0">
        <h2 className="text-[28px] leading-[34px] font-semibold text-foreground">
          {title}
        </h2>
        {description ? (
          <p className="text-xs leading-4 text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {showAction ? (
        <Button
          type="button"
          variant="link"
          size="sm"
          className="shrink-0 cursor-pointer px-0 text-sm"
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
    <div className="relative h-[260px]">
      <button
        type="button"
        aria-label={`${product.name} ราคา ${currencyFormatter.format(product.price)}`}
        className="block h-full cursor-pointer rounded-xl text-left outline-none transition-[filter] hover:drop-shadow-md focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <ItemCard
          imageSrc={product.image}
          imageAlt={product.imageAlt}
          badge={product.type}
          title={product.name}
          price={currencyFormatter.format(product.price)}
          className="h-full"
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

function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
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
    if (!api || slides.length < 2 || isPaused) return;

    const timer = window.setInterval(() => api.scrollNext(), 5000);
    return () => window.clearInterval(timer);
  }, [api, current, isPaused, slides.length]);

  return (
    <section
      aria-label="โปรโมชั่นแนะนำ"
      className="overflow-hidden bg-secondary"
    >
      <Carousel
        setApi={setApi}
        opts={{
          align: "center",
          loop: slides.length > 1,
          slidesToScroll: 1,
        }}
        className="w-full"
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
            <CarouselItem
              key={slide.id}
              className="basis-full pl-0"
            >
              <article
                aria-label={slide.title}
                className="flex h-[600px] w-full flex-col overflow-hidden bg-muted shadow-sm lg:h-[740px]"
              >
                <div
                  className={cn(
                    "flex h-[380px] shrink-0 items-center justify-center overflow-hidden lg:h-[520px]",
                    slide.theme === "release" && "bg-primary-foreground",
                    slide.theme === "collector" && "bg-foreground",
                  )}
                >
                  <img
                    src={slide.image}
                    alt={slide.imageAlt}
                    className={cn(
                      "size-full",
                      slide.theme === "campaign"
                        ? "object-cover"
                        : "object-contain",
                    )}
                  />
                </div>
                <div
                  className={cn(
                    "flex h-[220px] shrink-0 flex-col items-center justify-center gap-2 px-6 pb-8 text-center sm:px-12",
                    slide.theme === "collector"
                      ? "bg-foreground"
                      : slide.theme === "release"
                        ? "bg-primary-foreground"
                        : "bg-background",
                  )}
                >
                  <p className="text-xs font-semibold tracking-[0.08em] text-primary">
                    {slide.eyebrow}
                  </p>
                  {index === 0 ? (
                    <h1
                      className={cn(
                        "text-3xl leading-[0.95] font-bold sm:text-5xl",
                        slide.theme === "collector"
                          ? "text-background"
                          : "text-foreground",
                      )}
                    >
                      {slide.title}
                    </h1>
                  ) : (
                    <h2
                      className={cn(
                        "text-3xl leading-[0.95] font-bold sm:text-5xl",
                        slide.theme === "collector"
                          ? "text-background"
                          : "text-foreground",
                      )}
                    >
                      {slide.title}
                    </h2>
                  )}
                  <p
                    className={cn(
                      "text-sm leading-6",
                      slide.theme === "collector"
                        ? "text-background/70"
                        : "text-muted-foreground",
                    )}
                  >
                    {slide.description}
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <Button type="button" size="lg">
                      Shop New Releases
                    </Button>
                    <Button type="button" variant="outline" size="lg">
                      Explore Cards
                    </Button>
                  </div>
                </div>
              </article>
            </CarouselItem>
          ))}
        </CarouselContent>
        <div
          className="absolute right-0 bottom-2 left-0 flex h-2 items-start justify-center gap-2.5"
          aria-label="เลือกสไลด์"
        >
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              aria-label={`ไปยังสไลด์ ${index + 1}`}
              aria-current={current === index ? "true" : undefined}
              onClick={() => api?.scrollTo(index)}
              className={cn(
                "h-1.5 cursor-pointer rounded-[3px] transition-[width,background-color,transform] hover:scale-y-125",
                current === index
                  ? "w-8 bg-primary"
                  : "w-4 bg-muted-foreground",
              )}
            />
          ))}
        </div>
      </Carousel>
    </section>
  );
}

function BrowseByGame({ games }: { games: GameCategory[] }) {
  return (
    <section
      className="bg-background px-4 py-7 sm:px-6 lg:h-[260px] lg:px-8 lg:pt-7 lg:pb-5"
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
          <CarouselContent>
            {products.map((product) => (
              <CarouselItem
                key={product.id}
                className="basis-[min(241px,calc(100vw-2rem))]"
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

function CategoryCarousel({ categories }: { categories: ProductCategory[] }) {
  const [api, setApi] = useState<CarouselApi>();
  const [currentPage, setCurrentPage] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const pageCount = Math.ceil(categories.length / 3);

  const scrollToPage = useCallback(
    (page: number) => {
      if (!api) return;

      const lastSnapIndex = Math.max(api.scrollSnapList().length, 1) - 1;
      api.scrollTo(Math.min(page * 3, lastSnapIndex));
    },
    [api],
  );

  useEffect(() => {
    if (!api) return;

    const updateCurrentPage = () => {
      setCurrentPage(
        Math.round(api.scrollProgress() * Math.max(pageCount - 1, 0)),
      );
    };

    updateCurrentPage();
    api.on("select", updateCurrentPage);
    api.on("reInit", updateCurrentPage);

    return () => {
      api.off("select", updateCurrentPage);
      api.off("reInit", updateCurrentPage);
    };
  }, [api, pageCount]);

  useEffect(() => {
    if (!api || pageCount < 2 || isPaused) return;

    const timer = window.setInterval(() => {
      scrollToPage(currentPage === pageCount - 1 ? 0 : currentPage + 1);
    }, 7500);

    return () => window.clearInterval(timer);
  }, [api, currentPage, isPaused, pageCount, scrollToPage]);

  return (
    <section
      className="bg-secondary px-4 py-7 sm:px-6 lg:h-[486px] lg:px-8"
      aria-labelledby="category-title"
    >
      <div className="mx-auto max-w-[1216px]">
        <div id="category-title">
          <SectionHeader title="Find by category" showAction={false} />
        </div>
        <Carousel
          setApi={setApi}
          opts={{ align: "start", dragFree: true }}
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
                className="basis-[min(396px,calc(100vw-2rem))]"
              >
                <button
                  type="button"
                  className="group h-[371px] w-full min-w-0 cursor-pointer rounded-xl text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <Card className="h-full gap-0 rounded-xl border border-border py-0 shadow-none ring-0 transition-[box-shadow,border-color] group-hover:border-primary/40 group-hover:shadow-md">
                    <div className="h-[272px] w-full overflow-hidden bg-muted">
                      <img
                        src={category.image}
                        alt={category.imageAlt}
                        className="size-full object-cover"
                      />
                    </div>
                    <CardHeader className="flex flex-1 items-center justify-center px-4">
                      <CardTitle className="text-center text-[28px] leading-[34px] font-semibold">
                        {category.name}
                      </CardTitle>
                    </CardHeader>
                  </Card>
                </button>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
        <div
          className="mt-3 flex justify-center gap-2"
          aria-label="เลือกกลุ่มหมวดหมู่สินค้า"
        >
          {Array.from({ length: pageCount }, (_, page) => (
            <button
              key={page}
              type="button"
              aria-label={`ไปยังหมวดหมู่ชุดที่ ${page + 1}`}
              aria-current={currentPage === page ? "true" : undefined}
              onClick={() => scrollToPage(page)}
              className={cn(
                "h-1.5 w-4 cursor-pointer rounded-[3px] transition-colors hover:opacity-80",
                currentPage === page ? "bg-primary" : "bg-muted-foreground",
              )}
            />
          ))}
        </div>
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
          <SectionHeader title="More to Explore" />
        </div>
        <div className="mt-[18px] grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-[repeat(5,225px)]">
          {products.map((product) => (
            <div key={product.id} className="h-[260px] min-w-0">
              <HomeProductCard product={product} />
            </div>
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
      <CategoryCarousel categories={data.categories} />
      <ProductRail title="Trending Now" products={data.trending} />
      <ProductRail
        title="Pegasus Picks"
        description="Curated, verified, and shipped by Pegasus."
        actionLabel="Shop Pegasus"
        products={data.pegasusProducts}
      />
      <BrowseByGame games={data.games} />
      <ExploreGrid products={data.exploreMore} />
    </div>
  );
}
