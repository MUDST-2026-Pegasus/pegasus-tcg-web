import { translate, useLanguage } from "@/lib/language";
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
  useLanguage();
  return (
    <div className="flex items-center justify-between gap-4 pt-1">
      <p className="text-xs text-gray-500">
        {translate("ทั้งหมด", "All") + " "}{totalItems} {" " + translate("คำสั่งซื้อ", "Orders")}{totalPages > 1 ? ` · หน้า ${page} จาก ${totalPages}` : null}
      </p>

      {totalPages > 1 ? (
        <nav aria-label={translate("เปลี่ยนหน้า", "Change page")} className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="rounded-md px-2.5"
            disabled={disabled || page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            {translate("ก่อนหน้า", "Previous")}</Button>
          <Button
            variant="outline"
            size="sm"
            className="rounded-md px-2.5"
            disabled={disabled || page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            {translate("ถัดไป", "Next")}</Button>
        </nav>
      ) : null}
    </div>
  );
}
