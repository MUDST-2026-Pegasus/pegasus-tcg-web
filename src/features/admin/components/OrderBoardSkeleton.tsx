import { Skeleton } from "@/components/ui/skeleton";

/** โครงเดียวกับ board จริง: 5 คอลัมน์ คอลัมน์ละ 3 การ์ด ภาพไม่กระโดดตอนข้อมูลมา */
export function OrderBoardSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="กำลังโหลดคำสั่งซื้อ"
      className="grid grid-cols-1 items-start gap-[14.8px] sm:grid-cols-2 xl:grid-cols-5"
    >
      {Array.from({ length: 5 }, (_, column) => (
        <div key={column} className="flex flex-col gap-2.5">
          <Skeleton className="mx-3 my-2.5 h-4 w-24" />
          {Array.from({ length: 3 }, (_, card) => (
            <Skeleton key={card} className="h-[116px] rounded-[10px]" />
          ))}
        </div>
      ))}
    </div>
  );
}
