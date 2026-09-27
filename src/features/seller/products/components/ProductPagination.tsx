import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** จำนวนปุ่มเลขหน้าที่โชว์พร้อมกัน — หน้าปัจจุบันอยู่กลางเท่าที่ทำได้ */
const WINDOW = 5;

function pageWindow(current: number, total: number): number[] {
  const count = Math.min(WINDOW, total);
  const start = Math.max(
    1,
    Math.min(current - Math.floor(WINDOW / 2), total - count + 1),
  );
  return Array.from({ length: count }, (_, index) => start + index);
}

type ProductPaginationProps = {
  /** เริ่มที่ 1 */
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  rowsOnPage: number;
  disabled: boolean;
  onPageChange: (page: number) => void;
};

/** แถบท้ายตาราง — บรรทัดสรุปจำนวนกับปุ่มเปลี่ยนหน้า เลขทั้งหมดมาจาก backend */
export function ProductPagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  rowsOnPage,
  disabled,
  onPageChange,
}: ProductPaginationProps) {
  const from = rowsOnPage === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = (page - 1) * pageSize + rowsOnPage;

  return (
    <div className="flex items-center justify-between gap-4 border-t border-gray-100 px-5 py-3.5">
      <p className="text-xs text-gray-500">
        แสดง {from}–{to} จาก {totalItems} รายการ
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

          {pageWindow(page, totalPages).map((number) => (
            <button
              key={number}
              type="button"
              aria-current={number === page ? "page" : undefined}
              disabled={disabled}
              onClick={() => onPageChange(number)}
              className={cn(
                "flex size-7 cursor-pointer items-center justify-center rounded-md text-xs font-medium disabled:cursor-default",
                number === page
                  ? "bg-teal-600 text-white"
                  : "border border-zinc-200 bg-white text-gray-700 hover:bg-gray-50",
              )}
            >
              {number}
            </button>
          ))}

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
