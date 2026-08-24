import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
};

function SectionHeader({
  title,
  actionLabel = "ดูทั้งหมด",
  description,
}: SectionHeaderProps) {
  return (
    <div className="flex min-h-7 items-start justify-between gap-4">
      <div className="min-w-0">
        <h2 className="text-xl font-semibold text-foreground sm:text-2xl">
          {title}
        </h2>
        {description ? (
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <Button
        type="button"
        variant="link"
        size="xs"
        className="shrink-0 cursor-pointer transition-transform hover:-translate-y-0.5"
      >
        {actionLabel}
      </Button>
    </div>
  );
}

function ProductCard({
  product,
  layout,
  rank,
}: {
  product: HomeProduct;
  layout: "rail" | "grid";
  rank?: number;
}) {
  return (
    <div className="relative h-full">
      <button
        type="button"
        aria-label={`${product.name} ราคา ${currencyFormatter.format(product.price)}`}
        className="group block h-full cursor-pointer rounded-lg text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <Card
          className={cn(
            "h-full gap-0 rounded-lg border border-border py-0 shadow-none ring-0 transition-[transform,box-shadow,border-color] group-hover:-translate-y-1 group-hover:border-ring group-hover:shadow-md",
            layout === "rail" ? "w-[292px]" : "w-full",
          )}
        >
          <div
            className={cn(
              "overflow-hidden rounded-lg bg-muted",
              layout === "rail" ? "h-[222px]" : "aspect-square",
            )}
          >
            <img
              src={product.image}
              alt={product.imageAlt}
              className="size-full object-contain"
            />
          </div>
          <CardContent className="flex min-h-[146px] flex-1 flex-col justify-between gap-4 px-4 pt-[18px] pb-4">
            <div className="flex min-w-0 flex-col items-start gap-3">
              <Badge
                variant="secondary"
                className="h-auto rounded-sm bg-primary-foreground px-2 py-1 text-[10px] leading-[15px] font-semibold text-foreground"
              >
                {product.type}
              </Badge>
              <p className="line-clamp-2 min-h-10 text-sm leading-5 text-foreground">
                {product.name}
              </p>
            </div>
            <p className="text-lg leading-6 font-semibold text-primary">
              {currencyFormatter.format(product.price)}
            </p>
          </CardContent>
        </Card>
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
    <section aria-label="โปรโมชั่นแนะนำ" className="bg-background px-4 pb-3 sm:px-6 lg:px-8">
      <Carousel
        setApi={setApi}
        opts={{ align: "start", loop: slides.length > 1 }}
        className="mx-auto max-w-[1216px]"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onFocusCapture={() => setIsPaused(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            setIsPaused(false);
          }
        }}
      >
        <CarouselContent className="cursor-grab py-0 active:cursor-grabbing">
          {slides.map((slide, index) => (
            <CarouselItem
              key={slide.id}
              className={cn(
                "basis-[min(332px,calc(100vw-2rem))]",
                index === 0 && "sm:basis-[min(720px,calc(100vw-4rem))]",
              )}
            >
              <button
                type="button"
                aria-label={`เลือกโปรโมชัน ${slide.title}`}
                className="group block w-full cursor-pointer rounded-xl text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <Card
                  className={cn(
                    "h-[292px] gap-4 rounded-xl border border-border bg-card p-5 shadow-none ring-0 transition-[transform,box-shadow,border-color] group-hover:-translate-y-1 group-hover:border-ring group-hover:shadow-md sm:p-7",
                    index === 0 && "bg-muted",
                  )}
                >
                  <div
                    className={cn(
                      "grid h-full min-w-0 items-start gap-4",
                      index === 0
                        ? "grid-cols-1 sm:grid-cols-[minmax(0,1fr)_220px]"
                        : "grid-cols-[minmax(0,1fr)_120px]",
                    )}
                  >
                    <div
                      className={cn(
                        "z-10 flex min-w-0 flex-col gap-2.5 rounded-lg bg-background",
                        index === 0 && "p-1.5",
                      )}
                    >
                      <p className="text-[11px] font-semibold text-primary">
                        {slide.eyebrow}
                      </p>
                      {index === 0 ? (
                        <h1 className="truncate text-xl font-bold text-foreground sm:text-[28px]">
                          {slide.title}
                        </h1>
                      ) : (
                        <h2 className="truncate text-xl font-bold text-foreground">
                          {slide.title}
                        </h2>
                      )}
                      <p className="line-clamp-2 text-[13px] text-muted-foreground">
                        {slide.description}
                      </p>
                    </div>
                    <img
                      src={slide.image}
                      alt={slide.imageAlt}
                      className={cn(
                        "self-start rounded-lg object-contain",
                        index === 0 ? "hidden size-[220px] sm:block" : "size-[120px]",
                      )}
                    />
                  </div>
                </Card>
              </button>
            </CarouselItem>
          ))}
        </CarouselContent>
        <div className="mt-2.5 flex items-center justify-center gap-1.5" aria-label="เลือกสไลด์">
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              aria-label={`ไปยังสไลด์ ${index + 1}`}
              aria-current={current === index ? "true" : undefined}
              onClick={() => api?.scrollTo(index)}
              className={cn(
                "h-[3px] cursor-pointer rounded-sm transition-[width,background-color,transform] hover:scale-y-[2]",
                current === index ? "w-5 bg-foreground" : "w-3 bg-border",
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
    <section className="px-4 py-7 sm:px-6 lg:px-8" aria-labelledby="browse-by-game-title">
      <div className="mx-auto max-w-[1216px]">
        <div id="browse-by-game-title">
          <SectionHeader title="เลือกเกมที่คุณเล่น" />
        </div>
        <div className="mt-[18px] flex gap-4 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {games.map((game) => (
            <button
              key={game.id}
              type="button"
              className="group flex h-40 w-[138px] shrink-0 cursor-pointer flex-col items-center gap-2.5 rounded-xl outline-none transition-transform hover:-translate-y-1 focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <span className="flex size-[104px] items-center justify-center overflow-hidden rounded-full bg-muted transition-[box-shadow,transform] group-hover:scale-105 group-hover:shadow-md group-hover:ring-2 group-hover:ring-primary/20">
                <img src={game.image} alt={game.imageAlt} className="size-[82px] object-contain" />
              </span>
              <span className="w-full text-center text-sm text-foreground">{game.name}</span>
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
  muted = false,
  spacious = false,
}: {
  title: string;
  products: (HomeProduct | TrendingProduct)[];
  description?: string;
  muted?: boolean;
  spacious?: boolean;
}) {
  return (
    <section
      className={cn("px-4 py-7 sm:px-6 lg:px-8", muted && "bg-muted/50")}
      aria-label={title}
    >
      <div className="mx-auto max-w-[1216px]">
        <SectionHeader title={title} description={description} />
        <Carousel opts={{ align: "start", dragFree: true }} className="mt-[18px]">
          <CarouselContent className={spacious ? "-ml-6" : undefined}>
            {products.map((product) => (
              <CarouselItem
                key={product.id}
                className={cn(
                  "basis-[min(292px,calc(100vw-3rem))]",
                  spacious && "pl-6",
                )}
              >
                <ProductCard
                  product={product}
                  layout="rail"
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

function CategoryGrid({ categories }: { categories: ProductCategory[] }) {
  return (
    <section className="px-4 py-7 sm:px-6 lg:px-8" aria-labelledby="category-title">
      <div className="mx-auto max-w-[1216px]">
        <div id="category-title">
          <SectionHeader title="เลือกตามประเภทสินค้า" />
        </div>
        <div className="mt-[18px] flex gap-4 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              className="group w-56 shrink-0 cursor-pointer rounded-xl text-left outline-none transition-transform hover:-translate-y-1 focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <Card className="h-[218px] gap-4 rounded-xl border border-border py-0 pb-4 shadow-none ring-0 transition-[box-shadow,border-color] group-hover:border-ring group-hover:shadow-md">
                <img
                  src={category.image}
                  alt={category.imageAlt}
                  className="h-40 w-full object-contain"
                />
                <CardHeader className="px-4">
                  <CardTitle className="text-center">{category.name}</CardTitle>
                </CardHeader>
              </Card>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function ExploreGrid({ products }: { products: HomeProduct[] }) {
  return (
    <section className="px-4 py-7 sm:px-6 lg:px-8" aria-labelledby="explore-title">
      <div className="mx-auto max-w-[1216px]">
        <div id="explore-title">
          <SectionHeader
            title="Explore More"
            actionLabel="ดูสินค้าทั้งหมด"
          />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} layout="grid" />
          ))}
        </div>
      </div>
    </section>
  );
}

export function HomeContent({ data }: { data: HomeData }) {
  return (
    <div className="bg-background">
      <HeroCarousel slides={data.heroSlides} />
      <BrowseByGame games={data.games} />
      <ProductRail title="ดูล่าสุด" products={data.recentlyViewed} muted spacious />
      <ProductRail title="มาแรง" products={data.trending} muted spacious />
      <CategoryGrid categories={data.categories} />
      <ProductRail
        title="สินค้าจาก Pegasus"
        description="คัดเลือก ตรวจสอบ และจัดส่งโดยทีม Pegasus"
        products={data.pegasusProducts}
      />
      <ExploreGrid products={data.exploreMore} />
    </div>
  );
}
