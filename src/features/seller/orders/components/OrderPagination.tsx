import { Button } from "@/components/ui/button";
import { useTranslate } from "@/lib/i18n";

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
  const { t } = useTranslate("seller");
  return (
    <div className="flex items-center justify-between gap-4 pt-1">
      <p className="text-xs text-gray-500">
        {t("orders.pagination.total", "ทั้งหมด {total} คำสั่งซื้อ", { total: totalItems })}
        {totalPages > 1 ? t("orders.pagination.page", " · หน้า {page} จาก {totalPages}", { page, totalPages }) : null}
      </p>

      {totalPages > 1 ? (
        <nav aria-label={t("orders.pagination.label", "เปลี่ยนหน้า")} className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="rounded-md px-2.5"
            disabled={disabled || page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            {t("actions.previous", "ก่อนหน้า", { ns: "common" })}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="rounded-md px-2.5"
            disabled={disabled || page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            {t("actions.next", "ถัดไป", { ns: "common" })}
          </Button>
        </nav>
      ) : null}
    </div>
  );
}
