import type { ComponentProps } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const gameLabelWidths = ["w-16", "w-20", "w-14", "w-0", "w-24", "w-16"];
const latestTitleWidths = ["w-42", "w-44", "w-36", "w-42", "w-46"];
const latestDetailWidths = ["w-28", "w-36", "w-28", "w-32", "w-28"];
const priceWidths = ["w-[75px]", "w-14", "w-[75px]", "w-28", "w-[75px]"];
const trendingTitleWidths = ["w-42", "w-36", "w-44", "w-42", "w-36"];

function HomeSkeleton(props: Omit<ComponentProps<typeof Skeleton>, "tone">) {
  return <Skeleton tone="contrast" {...props} />;
}

function SkeletonSectionHeader({ titleWidth }: { titleWidth: string }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <HomeSkeleton className={cn("h-8", titleWidth)} />
      <HomeSkeleton className="h-5 w-24" />
    </div>
  );
}

function ProductSkeleton({
  imageClassName,
  titleWidth,
  detailWidth,
  priceWidth,
}: {
  imageClassName: string;
  titleWidth: string;
  detailWidth?: string;
  priceWidth: string;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <HomeSkeleton className={imageClassName} />
      <HomeSkeleton className={cn("h-5 max-w-full", titleWidth)} />
      {detailWidth ? (
        <HomeSkeleton className={cn("h-4 max-w-full", detailWidth)} />
      ) : null}
      <div className="pt-1">
        <HomeSkeleton className={cn("h-5 max-w-full", priceWidth)} />
      </div>
    </div>
  );
}

export function HomePageSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="กำลังโหลดหน้าแรก"
      className="bg-secondary py-8"
    >
      <span className="sr-only" role="status" aria-live="polite">
        กำลังโหลดข้อมูลหน้าแรก
      </span>

      <div className="mx-auto flex max-w-[1280px] flex-col items-center gap-8">
        <div className="w-full px-4 sm:px-6 lg:px-12">
          <HomeSkeleton className="h-[500px] w-full" />
        </div>

        <section className="w-full px-4 sm:px-6 lg:px-12" aria-hidden="true">
          <div className="flex flex-col gap-6">
            <HomeSkeleton className="h-8 w-48" />
            <div className="flex gap-6 overflow-hidden pb-4">
              {gameLabelWidths.map((labelWidth, index) => (
                <div
                  key={index}
                  className="flex shrink-0 flex-col items-center gap-3"
                >
                  <HomeSkeleton className="size-24 rounded-full" />
                  {labelWidth === "w-0" ? null : (
                    <HomeSkeleton className={cn("h-4", labelWidth)} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="w-full px-4 sm:px-6 lg:px-12" aria-hidden="true">
          <div className="flex flex-col gap-6">
            <SkeletonSectionHeader titleWidth="w-40" />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {latestTitleWidths.map((titleWidth, index) => (
                <ProductSkeleton
                  key={index}
                  imageClassName="aspect-[3/4] w-full"
                  titleWidth={titleWidth}
                  detailWidth={latestDetailWidths[index]}
                  priceWidth={priceWidths[index]}
                />
              ))}
            </div>
          </div>
        </section>

        <div className="w-full px-4 sm:px-6 lg:px-12" aria-hidden="true">
          <HomeSkeleton className="h-[200px] w-full" />
        </div>

        <section className="w-full px-4 sm:px-6 lg:px-12" aria-hidden="true">
          <div className="flex flex-col gap-6">
            <SkeletonSectionHeader titleWidth="w-48" />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {trendingTitleWidths.map((titleWidth, index) => (
                <ProductSkeleton
                  key={index}
                  imageClassName="aspect-square w-full"
                  titleWidth={titleWidth}
                  priceWidth={priceWidths[index]}
                />
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
