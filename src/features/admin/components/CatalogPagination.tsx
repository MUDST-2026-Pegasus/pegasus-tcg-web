import { Button } from "@/components/ui/button";

import { formatCount } from "../catalog.format";
import { useTranslate } from "@/lib/i18n";

type CatalogPaginationProps = {
  /** เริ่มที่ 1 */
  page: number;
  totalPages: number;
  disabled: boolean;
  onPageChange: (page: number) => void;
};

/** ท้ายตารางการ์ด — "หน้า 1 จาก 1,053" กับปุ่มก่อนหน้า/ถัดไป ตามดีไซน์ */
export function CatalogPagination({
  page,
  totalPages,
  disabled,
  onPageChange,
}: CatalogPaginationProps) {
  const { t } = useTranslate("admin");
  const lastPage = Math.max(totalPages, 1);

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
      <p className="text-xs text-muted-foreground">
        {t("catalog.pagination.page", "หน้า {page} จาก {last}", { page: formatCount(page), last: formatCount(lastPage) })}
      </p>
      <nav aria-label={t("catalog.pagination.label", "เปลี่ยนหน้า")} className="flex items-center gap-2">
        <Button
          variant="outline"
          className="rounded-md px-2.5"
          disabled={disabled || page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          {t("actions.previous", "ก่อนหน้า", { ns: "common" })}
        </Button>
        <Button
          variant="outline"
          className="rounded-md px-2.5"
          disabled={disabled || page >= lastPage}
          onClick={() => onPageChange(page + 1)}
        >
          {t("actions.next", "ถัดไป", { ns: "common" })}
        </Button>
      </nav>
    </div>
  );
}
