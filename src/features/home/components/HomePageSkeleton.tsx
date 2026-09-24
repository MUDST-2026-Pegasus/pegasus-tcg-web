import type { ComponentProps } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const productTitleWidths = ["w-36", "w-40", "w-32", "w-36", "w-40"];

function HomeSkeleton(props: Omit<ComponentProps<typeof Skeleton>, "tone">) {
  return <Skeleton tone="contrast" {...props} />;
}

function SkeletonSectionHeader({
  description = false,
  showAction = true,
}: {
  description?: boolean;
  showAction?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4",
        description ? "h-11" : "h-7",
      )}
    >
      <div>
        <HomeSkeleton className="h-8 w-52" />
        {description ? <HomeSkeleton className="h-3 w-64" /> : null}
      </div>
      {showAction ? <HomeSkeleton className="h-7 w-14" /> : null}
    </div>
  );
}

function ProductCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "h-[260px] w-[225px] rounded-xl bg-background p-4 ring-1 ring-foreground/5",
        className,
      )}
    >
      <HomeSkeleton className="h-[104px] w-full rounded-lg" />
      <HomeSkeleton className="mt-3.5 h-[18px] w-16 rounded-full" />
      <HomeSkeleton className="mt-2.5 h-[42px] w-4/5" />
      <HomeSkeleton className="mt-3.5 h-6 w-20" />
    </div>
  );
}

export function ProductRailSkeleton({
  description = false,
}: {
  description?: boolean;
}) {
  return (
    <section
      aria-hidden="true"
      className={cn(
        "bg-secondary px-4 py-7 sm:px-6 lg:px-8",
        description ? "lg:h-[400px]" : "lg:h-[390px]",
      )}
    >
      <div className="mx-auto max-w-[1216px]">
        <SkeletonSectionHeader description={description} />
        <div className="mt-[18px] flex gap-4 overflow-hidden">
          {productTitleWidths.map((_, index) => (
            <ProductCardSkeleton key={index} className="shrink-0" />
          ))}
        </div>
      </div>
    </section>
  );
}

export function HeroSkeleton() {
  return (
    <section aria-hidden="true" className="bg-background">
      <div className="flex flex-col lg:h-[360px] lg:flex-row">
        <div className="order-2 flex min-h-[320px] flex-col justify-center gap-[14px] px-6 py-10 sm:px-12 lg:order-1 lg:h-full lg:w-[500px] lg:shrink-0">
          <HomeSkeleton className="h-4 w-32" />
          <HomeSkeleton className="h-[78px] w-full max-w-[340px]" />
          <HomeSkeleton className="h-10 w-full max-w-[404px]" />
          <div className="flex gap-2.5">
            <HomeSkeleton className="h-11 w-[148px] rounded-lg" />
            <HomeSkeleton className="h-11 w-[126px] rounded-lg" />
          </div>
        </div>
        <HomeSkeleton className="order-1 h-[260px] flex-1 rounded-none lg:order-2 lg:h-full" />
      </div>
      <div className="my-2.5 flex h-2 items-start justify-center gap-2.5">
        {Array.from({ length: 4 }, (_, index) => (
          <HomeSkeleton
            key={index}
            className={cn(
              "h-1.5 rounded-[3px]",
              index === 0 ? "w-8" : "w-4",
            )}
          />
        ))}
      </div>
    </section>
  );
}

export function ProductGridSkeleton({ explore = false }: { explore?: boolean }) {
  return (
    <section
      aria-hidden="true"
      className={cn(
        "bg-secondary px-4 py-7 sm:px-6 lg:px-8",
        explore ? "lg:h-[638px]" : "lg:h-[642px]",
      )}
    >
      <div className="mx-auto max-w-[1216px]">
        <SkeletonSectionHeader />
        <div
          className={cn(
            "grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-[repeat(5,225.347px)]",
            explore ? "mt-6 lg:gap-x-[14.653px]" : "mt-[18px]",
          )}
        >
          {Array.from({ length: 10 }, (_, index) => (
            <ProductCardSkeleton key={index} className="w-full" />
          ))}
        </div>
      </div>
    </section>
  );
}

export function GamesSkeleton() {
  return (
    <section
      aria-hidden="true"
      className="bg-background px-4 py-7 sm:px-6 lg:h-[260px] lg:px-8"
    >
      <div className="mx-auto max-w-[1216px]">
        <SkeletonSectionHeader />
        <div className="mt-[18px] flex gap-4 overflow-hidden">
          {Array.from({ length: 8 }, (_, index) => (
            <div
              key={index}
              className="flex h-40 w-[138px] shrink-0 flex-col items-center gap-2.5"
            >
              <HomeSkeleton className="size-[104px] rounded-full" />
              <HomeSkeleton className="h-5 w-24" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FeaturedSkeleton() {
  return (
    <section
      aria-hidden="true"
      className="bg-secondary px-4 py-7 sm:px-6 lg:h-[473px] lg:px-8"
    >
      <div className="mx-auto max-w-[1216px]">
        <SkeletonSectionHeader showAction={false} />
        <div className="mt-[18px] flex gap-[29px] overflow-hidden">
          {Array.from({ length: 3 }, (_, index) => (
            <div
              key={index}
              className="h-[371px] w-[380.8px] shrink-0 overflow-hidden rounded-[20px] bg-background ring-1 ring-foreground/5"
            >
              <HomeSkeleton className="h-[272px] w-full rounded-none" />
              <div className="flex h-[99px] items-center justify-center">
                <HomeSkeleton className="h-10 w-40" />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-2.5 flex justify-center gap-2.5">
          <HomeSkeleton className="h-1.5 w-8 rounded-[3px]" />
          <HomeSkeleton className="h-1.5 w-4 rounded-[3px]" />
          <HomeSkeleton className="h-1.5 w-4 rounded-[3px]" />
        </div>
      </div>
    </section>
  );
}

export function HomePageSkeleton() {
  return (
    <main
      aria-busy="true"
      aria-label="กำลังโหลดหน้าแรก"
      className="bg-secondary font-sans"
    >
      <span className="sr-only" role="status" aria-live="polite">
        กำลังโหลดข้อมูลหน้าแรก
      </span>
      <HeroSkeleton />
      <ProductGridSkeleton />
      <GamesSkeleton />
      <ProductRailSkeleton />
      <FeaturedSkeleton />
      <ProductRailSkeleton description />
      <ProductGridSkeleton explore />
    </main>
  );
}
