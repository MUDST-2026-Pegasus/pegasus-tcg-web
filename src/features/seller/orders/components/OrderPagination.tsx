import { Button } from "@/components/ui/button";

type OrderPaginationProps = {
  /** เริ่มที่ 1 */
  page: number;
  totalPages: number;
  totalItems: number;
  disabled: boolean;
  onPageChange: (page: number) => void;
};

/** ก่อนหน้า / ถัดไป — เลขทั้งหมดมาจาก backend หน้าเดียวไม่ต้องโชว์ปุ่ม */
export function OrderPagination({
  page,
  totalPages,
  totalItems,
  disabled,
  onPageChange,
}: OrderPaginationProps) {
  return (
    <div className="flex items-center justify-between gap-4 pt-1">
      <p className="text-xs text-gray-500">
        ทั้งหมด {totalItems} คำสั่งซื้อ
        {totalPages > 1 ? ` · หน้า ${page} จาก ${totalPages}` : null}
      </p>

      {totalPages > 1 ? (
        <nav aria-label="เปลี่ยนหน้า" className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="rounded-md px-2.5"
            disabled={disabled || page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            ก่อนหน้า
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="rounded-md px-2.5"
            disabled={disabled || page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            ถัดไป
          </Button>
        </nav>
      ) : null}
    </div>
  );
}
