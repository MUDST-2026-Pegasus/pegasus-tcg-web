import type { ComponentProps } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const productTitleWidths = ["w-36", "w-40", "w-32", "w-36", "w-40"];

function HomeSkeleton(props: Omit<ComponentProps<typeof Skeleton>, "tone">) {
  return <Skeleton tone="contrast" {...props} />;
}

function SkeletonSectionHeader({
  description = false,
}: {
  description?: boolean;
}) {
  return (
    <div className="flex min-h-[34px] items-start justify-between gap-4">
      <div>
        <HomeSkeleton className="h-[34px] w-52" />
        {description ? <HomeSkeleton className="mt-1 h-4 w-64" /> : null}
      </div>
      <HomeSkeleton className="h-8 w-16" />
    </div>
  );
}

function ProductCardSkeleton({ titleWidth }: { titleWidth: string }) {
  return (
    <div className="h-[260px] w-[225px] rounded-xl bg-background p-4 ring-1 ring-foreground/5">
      <HomeSkeleton className="h-[104px] w-full rounded-lg" />
      <HomeSkeleton className="mt-3.5 h-[18px] w-16 rounded-full" />
      <HomeSkeleton className={cn("mt-2.5 h-[42px]", titleWidth)} />
      <HomeSkeleton className="mt-3.5 h-6 w-20" />
    </div>
  );
}

function ProductRailSkeleton({
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
          {productTitleWidths.map((titleWidth, index) => (
            <ProductCardSkeleton key={index} titleWidth={titleWidth} />
          ))}
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

      <section
        aria-hidden="true"
        className="h-[600px] bg-background lg:h-[740px]"
      >
        <HomeSkeleton className="h-[380px] w-full rounded-none lg:h-[520px]" />
        <div className="flex h-[220px] flex-col items-center justify-center gap-3 px-6 pb-8">
          <HomeSkeleton className="h-4 w-32" />
          <HomeSkeleton className="h-12 w-[min(520px,80vw)]" />
          <HomeSkeleton className="h-5 w-[min(440px,70vw)]" />
          <div className="flex gap-3">
            <HomeSkeleton className="h-10 w-36 rounded-full" />
            <HomeSkeleton className="h-10 w-32 rounded-full" />
          </div>
        </div>
      </section>

      <section
        aria-hidden="true"
        className="bg-secondary px-4 py-7 sm:px-6 lg:h-[486px] lg:px-8"
      >
        <div className="mx-auto max-w-[1216px]">
          <SkeletonSectionHeader />
          <div className="mt-[18px] flex gap-4 overflow-hidden">
            {Array.from({ length: 5 }, (_, index) => (
              <div
                key={index}
                className="h-[371px] w-[380px] shrink-0 overflow-hidden rounded-xl bg-background ring-1 ring-foreground/5"
              >
                <HomeSkeleton className="h-[272px] w-full rounded-none" />
                <div className="flex h-[99px] items-center justify-center">
                  <HomeSkeleton className="h-[34px] w-40" />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex justify-center gap-2">
            <HomeSkeleton className="h-1.5 w-4 rounded-[3px]" />
            <HomeSkeleton className="h-1.5 w-4 rounded-[3px]" />
          </div>
        </div>
      </section>

      <ProductRailSkeleton />
      <ProductRailSkeleton description />

      <section
        aria-hidden="true"
        className="bg-background px-4 py-7 sm:px-6 lg:h-[260px] lg:px-8 lg:pt-7 lg:pb-5"
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

      <section
        aria-hidden="true"
        className="bg-secondary px-4 py-7 sm:px-6 lg:h-[638px] lg:px-8"
      >
        <div className="mx-auto max-w-[1216px]">
          <SkeletonSectionHeader />
          <div className="mt-[18px] grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-[repeat(5,225px)]">
            {Array.from({ length: 10 }, (_, index) => (
              <ProductCardSkeleton
                key={index}
                titleWidth={productTitleWidths[index % productTitleWidths.length]}
              />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
