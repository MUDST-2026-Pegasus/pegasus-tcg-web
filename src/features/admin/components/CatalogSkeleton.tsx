import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/** ตารางการ์ดระหว่างโหลด — วางตรงกับ `CatalogProductGrid` (รูปจัตุรัส + ท้ายการ์ดสูง 146px) */
export function CatalogGridSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="grid grid-cols-2 items-start gap-3 md:grid-cols-3 xl:grid-cols-4"
    >
      {Array.from({ length: 8 }, (_, index) => (
        <Card
          key={index}
          className="w-full gap-0 rounded-lg border border-border p-0 shadow-none ring-0"
        >
          <Skeleton className="aspect-square w-full rounded-lg" />
          <div className="flex h-[146px] flex-col justify-between px-4 pt-[18px] pb-4">
            <div className="flex flex-col gap-3">
              <Skeleton className="h-[23px] w-16 rounded-[4px]" />
              <Skeleton className="h-4 w-full" />
            </div>
            <Skeleton className="h-6 w-20" />
          </div>
        </Card>
      ))}
    </div>
  );
}

/** คอลัมน์ซ้ายระหว่างรอรายชื่อเกม — วางตรงกับ `CatalogFilterPanel` */
export function CatalogFilterPanelSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="flex w-full flex-col gap-4 lg:w-[236px] lg:shrink-0"
    >
      <Card className="gap-3 rounded-xl border border-border p-4 shadow-none ring-0">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-3 w-28" />
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton key={index} className="h-8 w-full rounded-lg" />
        ))}
      </Card>
      <Card className="gap-3 rounded-xl border border-border p-4 shadow-none ring-0">
        <Skeleton className="h-4 w-28" />
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-4 w-36" />
        ))}
      </Card>
      <Skeleton className="h-[104px] w-full rounded-xl" />
    </div>
  );
}
