import { Skeleton } from "@/components/ui/skeleton";

/** วางตรงกับ DashboardContent — หัวหน้า, ยอดขาย + สิ่งที่ต้องทำ, สถิติ 4 ใบ, ออเดอร์ + สต็อก */
export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="กำลังโหลดแดชบอร์ด">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-3 w-80" />
      </div>

      <div className="flex flex-col gap-4 lg:flex-row">
        <Skeleton className="h-56 flex-1 rounded-2xl" />
        <Skeleton className="h-56 w-full rounded-xl lg:w-96" />
      </div>

      <div className="flex flex-wrap gap-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-28 min-w-48 flex-1 rounded-xl" />
        ))}
      </div>

      <div className="flex flex-col gap-4 lg:flex-row">
        <Skeleton className="h-72 flex-1 rounded-xl" />
        <Skeleton className="h-72 w-full rounded-xl lg:w-80" />
      </div>
    </div>
  );
}
