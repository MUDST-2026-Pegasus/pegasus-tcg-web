import { Skeleton } from "@/components/ui/skeleton";

/** วางตรงกับ OrderDetailContent — หัว, คอลัมน์ซ้าย 3 การ์ด, คอลัมน์ขวา 3 การ์ด */
export function OrderDetailSkeleton() {
  return (
    <div className="flex flex-col gap-5" aria-busy="true" aria-label="กำลังโหลดคำสั่งซื้อ">
      <Skeleton className="h-3 w-64" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-3 w-96" />
      </div>
      <div className="flex flex-col gap-5 lg:flex-row">
        <div className="flex flex-1 flex-col gap-4">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-56 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
        <div className="flex w-full flex-col gap-4 lg:w-80">
          <Skeleton className="h-36 rounded-xl" />
          <Skeleton className="h-44 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
