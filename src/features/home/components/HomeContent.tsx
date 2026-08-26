import { useEffect, useState } from "react";

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
};

function SectionHeader({
  title,
  actionLabel = "ดูทั้งหมด",
  description,
}: SectionHeaderProps) {
  return (
    <div className="flex min-h-7 items-start justify-between gap-4">
      <div className="min-w-0">
        <h2 className={cn("text-xl font-semibold text-foreground sm:text-2xl")}>
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

function HomeProductCard({
  product,
  rank,
}: {
  product: HomeProduct;
  rank?: number;
}) {
  return (
    <div className="relative h-full">
      <button
        type="button"
        aria-label={`${product.name} ราคา ${currencyFormatter.format(product.price)}`}
        className="block h-full cursor-pointer rounded-xl text-left outline-none transition-transform hover:-translate-y-1 focus-visible:ring-3 focus-visible:ring-ring/50"
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
      className="h-[310px] overflow-hidden bg-secondary px-4 pb-3 sm:px-6 lg:px-8"
    >
      <Carousel
        setApi={setApi}
        opts={{
          align: "center",
          loop: slides.length > 1,
          slidesToScroll: 1,
        }}
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
        <CarouselContent className="cursor-grab active:cursor-grabbing">
          {slides.map((slide, index) => (
            <CarouselItem
              key={slide.id}
              className="basis-[min(696px,calc(100vw-2rem))]"
            >
              <button
                type="button"
                aria-label={`เลือกโปรโมชัน ${slide.title}`}
                className="group block w-full cursor-pointer rounded-xl text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <Card
                  className={cn(
                    "h-[272px] gap-4 rounded-xl border border-border p-5 shadow-none ring-0 transition-[box-shadow,border-color] group-hover:border-primary/40 group-hover:shadow-md sm:p-6",
                    current === index ? "bg-muted" : "bg-card",
                  )}
                >
                  <div className="grid h-full min-w-0 grid-cols-[minmax(0,1fr)_112px] items-start gap-4 sm:grid-cols-[minmax(0,1fr)_200px]">
                    <div
                      className={cn(
                        "z-10 flex min-w-0 flex-col gap-2.5 rounded-lg p-1.5",
                        current === index && "bg-background",
                      )}
                    >
                      <p className="text-[11px] font-semibold text-primary">
                        {slide.eyebrow}
                      </p>
                      {index === 0 ? (
                        <h1 className="truncate text-xl font-bold text-foreground sm:text-[26px]">
                          {slide.title}
                        </h1>
                      ) : (
                        <h2 className="truncate text-xl font-bold text-foreground sm:text-[26px]">
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
                      className="size-28 self-start rounded-lg object-contain sm:size-[200px]"
                    />
                  </div>
                </Card>
              </button>
            </CarouselItem>
          ))}
        </CarouselContent>
        <div
          className="mt-2.5 flex items-center justify-center gap-1.5"
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
    <section
      className="bg-background px-4 py-7 sm:px-6 lg:px-8"
      aria-labelledby="browse-by-game-title"
    >
      <div className="mx-auto max-w-[1216px]">
        <div id="browse-by-game-title">
          <SectionHeader title="เลือกเกมที่คุณเล่น" />
        </div>
        <div className="mt-[18px] flex gap-4 overflow-x-auto px-1 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
}: {
  title: string;
  products: (HomeProduct | TrendingProduct)[];
  description?: string;
}) {
  return (
    <section className="px-4 py-7 sm:px-6 lg:px-8" aria-label={title}>
      <div className="mx-auto max-w-[1216px]">
        <SectionHeader title={title} description={description} />
        <Carousel
          opts={{ align: "start", dragFree: true }}
          className="mt-[18px]"
        >
          <CarouselContent className="py-2">
            {products.map((product) => (
              <CarouselItem
                key={product.id}
                className="basis-[min(240px,calc(100vw-2rem))]"
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

function CategoryGrid({ categories }: { categories: ProductCategory[] }) {
  return (
    <section
      className="px-4 py-7 sm:px-6 lg:px-8"
      aria-labelledby="category-title"
    >
      <div className="mx-auto max-w-[1216px]">
        <div id="category-title">
          <SectionHeader title="เลือกตามประเภทสินค้า" />
        </div>
        <div className="mt-[18px] flex gap-4 overflow-x-auto py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              className="group w-56 shrink-0 cursor-pointer rounded-xl text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <Card className="h-[218px] gap-4 rounded-xl border border-border py-0 pb-4 shadow-none ring-0 transition-[box-shadow,border-color] group-hover:border-primary/40 group-hover:shadow-md">
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
    <section
      className="px-4 py-7 sm:px-6 lg:px-8"
      aria-labelledby="explore-title"
    >
      <div className="mx-auto max-w-[1216px]">
        <div id="explore-title">
          <SectionHeader title="Explore More" actionLabel="ดูสินค้าทั้งหมด" />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-[repeat(5,224px)]">
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
      <BrowseByGame games={data.games} />
      <ProductRail title="ดูล่าสุด" products={data.recentlyViewed} />
      <ProductRail title="มาแรง" products={data.trending} />
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
