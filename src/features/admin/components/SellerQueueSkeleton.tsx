import { Skeleton } from "@/components/ui/skeleton";

/** โครงรอโหลดของคิว — วางตรงกับการ์ดจริงเพื่อให้ภาพไม่กระโดดตอนข้อมูลมาถึง */
export function SellerQueueSkeleton() {
  return (
    <div className="flex w-full flex-col gap-3 lg:w-[420px] lg:shrink-0">
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-20" />
      </div>

      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="flex flex-col gap-3 rounded-xl border border-border bg-background p-4"
          >
            <div className="flex items-center gap-3">
              <Skeleton className="size-[38px] rounded-full" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-3 w-40" />
              </div>
            </div>
            <Skeleton className="h-5 w-20 rounded-[5px]" />
          </div>
        ))}
      </div>
    </div>
  );
}
