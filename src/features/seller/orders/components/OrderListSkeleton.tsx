import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslate } from "@/lib/i18n";

/** วางตรงกับหัวการ์ด `OrderCard` ตอนพับ — ภาพไม่กระโดดตอนข้อมูลมาถึง */
export function OrderListSkeleton({ rows = 4 }: { rows?: number }) {
  const { t } = useTranslate("seller");
  return (
    <div className="flex flex-col gap-3.5" aria-busy="true" aria-label={t("orders.loading", "กำลังโหลดคำสั่งซื้อ")}>
      {Array.from({ length: rows }, (_, index) => (
        <Card
          key={index}
          className="flex-row items-center gap-3.5 rounded-xl border border-border px-5 py-4 shadow-none ring-0"
        >
          <div className="flex flex-1 flex-col gap-1.5">
            <Skeleton className="h-3.5 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-2.5 w-10" />
          </div>
          <Skeleton className="size-6 rounded-md" />
        </Card>
      ))}
    </div>
  );
}
