import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * โครงที่วางตรงกับ `ProductTable` ตัวจริง ภาพจึงไม่กระโดดตอนข้อมูลมาถึง
 * แก้ตารางจริงเมื่อไหร่ ให้แก้ตัวนี้ตามด้วย
 */
export function ProductTableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <Card
      aria-busy="true"
      className="w-full gap-0 rounded-xl border border-border p-0 shadow-none ring-0"
    >
      <div className="flex h-9 items-center gap-6 border-y border-gray-100 bg-neutral-50 px-5">
        <Skeleton className="size-3.5 rounded-sm" />
        <Skeleton className="h-3 w-16" />
      </div>
      {Array.from({ length: rows }, (_, index) => (
        <div
          key={index}
          className="flex items-center gap-4 border-b border-gray-100 px-5 py-3 last:border-b-0"
        >
          <Skeleton className="size-3.5 rounded-sm" />
          <Skeleton className="size-10 rounded-md" />
          <div className="flex w-60 flex-col gap-1.5">
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-2.5 w-28" />
          </div>
          <Skeleton className="h-3 w-16" />
          <Skeleton className="ml-auto h-5 w-20 rounded-full" />
        </div>
      ))}
    </Card>
  );
}
