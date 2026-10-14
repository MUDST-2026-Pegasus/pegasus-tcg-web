import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * ชิ้นส่วน skeleton ที่หลายหน้าใช้ร่วมกัน + skeleton ระดับหน้าสำหรับตอนเปลี่ยน route
 *
 * หน้าไหนมี skeleton ที่วางตรงกับ layout ของตัวเองอยู่แล้ว ให้ใช้ตัวนั้นก่อน
 * ตัวในไฟล์นี้เป็นโครงกลาง ๆ สำหรับหน้าที่ยังไม่มี
 */

type SkeletonBlockProps = { className?: string };

/** การ์ดสินค้า: รูป + ป้าย + ชื่อสองบรรทัด + ราคา (ทรงเดียวกับ ItemCard) */
export function ItemCardSkeleton({
  className,
  imageClassName,
}: SkeletonBlockProps & { imageClassName?: string }) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3.5 rounded-xl bg-card px-5 py-4 ring-1 ring-foreground/5",
        className,
      )}
    >
      <Skeleton className={cn("aspect-video w-full rounded-lg", imageClassName)} />
      <Skeleton className="h-5 w-20 rounded-full" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-4/5 rounded-md" />
        <Skeleton className="h-4 w-1/2 rounded-md" />
      </div>
      <Skeleton className="h-5 w-24 rounded-md" />
    </div>
  );
}

/** ตารางการ์ดสินค้า — ส่ง `className` ของ grid ให้ตรงกับหน้าจริง */
export function ItemGridSkeleton({
  count = 6,
  className = "grid gap-6 sm:grid-cols-2 lg:grid-cols-3",
  itemClassName,
  imageClassName,
}: {
  count?: number;
  className?: string;
  itemClassName?: string;
  imageClassName?: string;
}) {
  return (
    <div className={className} aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <ItemCardSkeleton
          key={i}
          className={itemClassName}
          imageClassName={imageClassName}
        />
      ))}
    </div>
  );
}

/** แถวรายการ: ข้อความสองบรรทัดซ้าย + ช่องเล็กขวา (ใช้กับ list ประกาศขาย / คิวงาน) */
export function ListRowsSkeleton({
  rows = 5,
  className,
}: SkeletonBlockProps & { rows?: number }) {
  return (
    <div className={cn("divide-y divide-border", className)} aria-hidden="true">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-4 py-3.5">
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-2/5 rounded-md" />
            <Skeleton className="h-3 w-1/4 rounded-md" />
          </div>
          <Skeleton className="hidden h-4 w-20 rounded-md sm:block" />
          <Skeleton className="h-8 w-20 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

/** ข้อความย่อหน้า n บรรทัด บรรทัดสุดท้ายสั้นลง */
export function TextLinesSkeleton({
  lines = 3,
  className,
}: SkeletonBlockProps & { lines?: number }) {
  return (
    <div className={cn("flex flex-col gap-2.5", className)} aria-hidden="true">
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton
          key={i}
          className={cn("h-3.5 rounded-md", i === lines - 1 ? "w-3/5" : "w-full")}
        />
      ))}
    </div>
  );
}

/** หัวโปรไฟล์: avatar + ชื่อ + @username + ตัวเลขด้านขวา */
export function ProfileHeaderSkeleton({ className }: SkeletonBlockProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-6 rounded-xl border bg-card p-6 sm:p-8",
        className,
      )}
      aria-hidden="true"
    >
      <Skeleton className="size-20 shrink-0 rounded-full" />
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <Skeleton className="h-7 w-48 max-w-full rounded-md" />
        <Skeleton className="h-4 w-28 rounded-md" />
      </div>
      <Skeleton className="hidden h-7 w-40 rounded-md sm:block" />
    </div>
  );
}

/** หัวเรื่อง section: ชื่อ + คำอธิบาย */
export function HeadingSkeleton({
  className,
  withDescription = true,
}: SkeletonBlockProps & { withDescription?: boolean }) {
  return (
    <div className={cn("flex flex-col gap-2.5", className)} aria-hidden="true">
      <Skeleton className="h-8 w-56 max-w-full rounded-lg" />
      {withDescription && <Skeleton className="h-4 w-80 max-w-full rounded-md" />}
    </div>
  );
}

/** หน้ารายละเอียด: รูปซ้าย + ข้อมูลขวา */
export function DetailSkeleton({ className }: SkeletonBlockProps) {
  return (
    <div className={cn("grid gap-8 md:grid-cols-2", className)} aria-hidden="true">
      <div className="flex flex-col gap-3">
        <Skeleton className="aspect-[3/4] w-full rounded-xl" />
        <div className="flex gap-3">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="size-20 rounded-lg" />
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-5">
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
        <Skeleton className="h-9 w-4/5 rounded-lg" />
        <Skeleton className="h-4 w-1/3 rounded-md" />
        <Skeleton className="h-10 w-40 rounded-lg" />
        <TextLinesSkeleton lines={4} />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-14 rounded-xl" />
          <Skeleton className="h-14 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

/** การ์ดขาว ๆ ที่มีหัวข้อ + เนื้อหาเป็นบรรทัด (ฟอร์ม / สรุปยอด) */
export function PanelSkeleton({
  className,
  rows = 4,
}: SkeletonBlockProps & { rows?: number }) {
  return (
    <div
      className={cn("flex flex-col gap-5 rounded-2xl border bg-card p-6", className)}
      aria-hidden="true"
    >
      <Skeleton className="h-6 w-40 rounded-md" />
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex flex-col gap-2">
          <Skeleton className="h-3.5 w-24 rounded-md" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      ))}
    </div>
  );
}

/** แถวการ์ดตัวเลขสรุปบนหน้า dashboard */
export function StatCardsSkeleton({
  count = 4,
  className,
}: SkeletonBlockProps & { count?: number }) {
  return (
    <div
      className={cn("grid gap-4 sm:grid-cols-2 xl:grid-cols-4", className)}
      aria-hidden="true"
    >
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex flex-col gap-3 rounded-2xl border bg-card p-5">
          <Skeleton className="h-3.5 w-24 rounded-md" />
          <Skeleton className="h-8 w-28 rounded-lg" />
          <Skeleton className="h-3 w-20 rounded-md" />
        </div>
      ))}
    </div>
  );
}

/** ตาราง: แถบหัว + แถวข้อมูล */
export function TableSkeleton({
  rows = 6,
  columns = 5,
  className,
}: SkeletonBlockProps & { rows?: number; columns?: number }) {
  return (
    <div
      className={cn("overflow-hidden rounded-2xl border bg-card", className)}
      aria-hidden="true"
    >
      <div className="flex gap-4 border-b bg-muted/40 px-5 py-3.5">
        {Array.from({ length: columns }, (_, i) => (
          <Skeleton key={i} tone="contrast" className="h-3.5 flex-1 rounded-md" />
        ))}
      </div>
      {Array.from({ length: rows }, (_, r) => (
        <div key={r} className="flex items-center gap-4 border-b px-5 py-4 last:border-b-0">
          {Array.from({ length: columns }, (_, c) => (
            <Skeleton
              key={c}
              className={cn("h-4 flex-1 rounded-md", c === 0 && "flex-[2]")}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/** การ์ดสินค้าในตะกร้า / รายการคำสั่งซื้อ: รูปซ้าย + ข้อความ + ราคาขวา */
export function ProductRowsSkeleton({
  rows = 3,
  className,
}: SkeletonBlockProps & { rows?: number }) {
  return (
    <div className={cn("flex flex-col gap-4", className)} aria-hidden="true">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-6 rounded-xl border bg-card p-6">
          <Skeleton className="h-32 w-24 shrink-0 rounded-lg" />
          <div className="flex min-w-0 flex-1 flex-col gap-2.5">
            <Skeleton className="h-6 w-3/5 rounded-md" />
            <Skeleton className="h-4 w-2/5 rounded-md" />
            <Skeleton className="h-4 w-1/3 rounded-md" />
          </div>
          <Skeleton className="hidden h-7 w-24 rounded-md sm:block" />
        </div>
      ))}
    </div>
  );
}

/** หัวข้อ + ฟอร์มซ้าย + การ์ดสรุปขวา (ไม่มี container ของหน้า — วางใน layout หลังบ้านได้เลย) */
export function FormBodySkeleton({ className }: SkeletonBlockProps) {
  return (
    <div className={cn("flex flex-col gap-6", className)} aria-hidden="true">
      <HeadingSkeleton />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex flex-col gap-6">
          <PanelSkeleton rows={3} />
          <PanelSkeleton rows={2} />
        </div>
        <PanelSkeleton rows={4} className="h-fit" />
      </div>
    </div>
  );
}

/* ---------- skeleton ทั้งหน้า (ใช้ตอนโหลดโค้ดของหน้าหลังเปลี่ยน route) ---------- */

function PageStatus({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div role="status" aria-busy="true" aria-label={label} className={className}>
      {children}
    </div>
  );
}

/** หน้าฝั่งผู้ซื้อทั่วไป: หัวข้อ + ตารางการ์ดสินค้า */
export function CatalogPageSkeleton({ label = "กำลังโหลดหน้า" }: { label?: string }) {
  return (
    <PageStatus
      label={label}
      className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-10"
    >
      <HeadingSkeleton />
      <ItemGridSkeleton count={8} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4" />
    </PageStatus>
  );
}

/** หน้ารายละเอียดสินค้า / ประกาศขาย */
export function DetailPageSkeleton({ label = "กำลังโหลดรายละเอียด" }: { label?: string }) {
  return (
    <PageStatus
      label={label}
      className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-5 py-8"
    >
      <Skeleton className="h-4 w-56 rounded-md" />
      <DetailSkeleton />
      <PanelSkeleton rows={2} />
    </PageStatus>
  );
}

/** หน้าโปรไฟล์ร้าน / นักสะสม: ปุ่มกลับ + หัวโปรไฟล์ + ตารางการ์ด */
export function ProfilePageSkeleton({ label = "กำลังโหลดโปรไฟล์" }: { label?: string }) {
  return (
    <PageStatus
      label={label}
      className="min-h-[580px] bg-muted/60 px-5 py-8 sm:px-8 sm:py-12 lg:px-12"
    >
      <div className="mx-auto flex w-full max-w-[1344px] flex-col gap-8">
        <Skeleton className="h-[38px] w-40 rounded-lg" />
        <ProfileHeaderSkeleton />
        <HeadingSkeleton />
        <ItemGridSkeleton />
      </div>
    </PageStatus>
  );
}

/** หน้าฟอร์ม / checkout: เนื้อหาซ้าย + สรุปขวา */
export function FormPageSkeleton({ label = "กำลังโหลดหน้า" }: { label?: string }) {
  return (
    <PageStatus
      label={label}
      className="mx-auto w-full max-w-6xl px-5 py-10"
    >
      <FormBodySkeleton />
    </PageStatus>
  );
}

/** หน้าบทความ (About / ข้อตกลง / นโยบาย) */
export function ArticlePageSkeleton({ label = "กำลังโหลดหน้า" }: { label?: string }) {
  return (
    <PageStatus
      label={label}
      className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-5 py-12"
    >
      <Skeleton className="h-56 w-full rounded-2xl" />
      <HeadingSkeleton />
      <TextLinesSkeleton lines={5} />
      <TextLinesSkeleton lines={4} />
    </PageStatus>
  );
}

/** หน้า login / register — การ์ดกลางจอ */
export function AuthPageSkeleton() {
  return (
    <PageStatus
      label="กำลังโหลด"
      className="relative z-10 flex w-full max-w-md flex-col gap-5 rounded-2xl border bg-card p-8 shadow-sm"
    >
      <Skeleton className="mx-auto h-8 w-40 rounded-lg" />
      <Skeleton className="mx-auto h-4 w-56 rounded-md" />
      {Array.from({ length: 2 }, (_, i) => (
        <div key={i} className="flex flex-col gap-2">
          <Skeleton className="h-3.5 w-20 rounded-md" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      ))}
      <Skeleton className="h-11 w-full rounded-lg" />
    </PageStatus>
  );
}

/** หน้าหลังบ้าน (admin / seller): หัวข้อ + การ์ดตัวเลข + ตาราง */
export function DashboardPageSkeleton({ label = "กำลังโหลดหน้า" }: { label?: string }) {
  return (
    <PageStatus label={label} className="flex flex-col gap-6">
      <HeadingSkeleton />
      <StatCardsSkeleton />
      <TableSkeleton />
    </PageStatus>
  );
}

/** หน้าบัญชีผู้ใช้: เมนูซ้าย (AccountSidebar) + เนื้อหาขวา */
export function AccountPageSkeleton({ label = "กำลังโหลดบัญชี" }: { label?: string }) {
  return (
    <PageStatus label={label} className="bg-muted/60 px-4 py-10 sm:px-6 lg:px-12">
      <div className="mx-auto grid max-w-[1440px] gap-8 lg:grid-cols-[280px_1fr]">
        <div className="flex h-fit flex-col gap-3 rounded-xl border bg-card p-6">
          <div className="flex items-center gap-3">
            <Skeleton className="size-12 rounded-full" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-28 rounded-md" />
              <Skeleton className="h-3 w-20 rounded-md" />
            </div>
          </div>
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-9 w-full rounded-lg" />
          ))}
        </div>
        <div className="flex min-w-0 flex-col gap-6">
          <HeadingSkeleton />
          <ProductRowsSkeleton rows={2} />
        </div>
      </div>
    </PageStatus>
  );
}
