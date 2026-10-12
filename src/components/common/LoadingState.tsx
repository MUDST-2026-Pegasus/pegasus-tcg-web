import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

type LoadingStateProps = {
  /** ข้อความใต้ spinner — เว้นว่างได้ถ้าบริบทรอบ ๆ บอกอยู่แล้วว่ากำลังโหลดอะไร */
  label?: string;
  className?: string;
};

/**
 * ตัวรอโหลดแบบกลาง ๆ สำหรับหน้าที่ยังไม่มี skeleton เป็นของตัวเอง
 *
 * ถ้าหน้านั้นมี skeleton ที่วางตรงกับ layout จริงอยู่แล้ว ให้ใช้ตัวนั้นแทน
 * — ภาพไม่กระโดดตอนข้อมูลมาถึง (ส่งเข้า `loading` ของ `QueryBoundary` ได้เลย)
 */
export function LoadingState({ label, className }: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-busy="true"
      className={cn(
        "flex min-h-[40svh] w-full flex-col items-center justify-center gap-3",
        className,
      )}
    >
      <Spinner className="size-8 text-muted-foreground" />
      {label && <p className="text-sm text-muted-foreground">{label}</p>}
    </div>
  );
}
