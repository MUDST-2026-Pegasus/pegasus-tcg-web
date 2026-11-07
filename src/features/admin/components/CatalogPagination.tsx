import { translate, useLanguage } from "@/lib/language";
import { Button } from "@/components/ui/button";

import { formatCount } from "../catalog.format";

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
  useLanguage();
  const lastPage = Math.max(totalPages, 1);

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
      <p className="text-xs text-muted-foreground">
        {translate("หน้า", "Page") + " "}{formatCount(page)} {" " + translate("จาก", "of") + " "}{formatCount(lastPage)}
      </p>
      <nav aria-label={translate("เปลี่ยนหน้า", "Change page")} className="flex items-center gap-2">
        <Button
          variant="outline"
          className="rounded-md px-2.5"
          disabled={disabled || page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          {translate("ก่อนหน้า", "Previous")}</Button>
        <Button
          variant="outline"
          className="rounded-md px-2.5"
          disabled={disabled || page >= lastPage}
          onClick={() => onPageChange(page + 1)}
        >
          {translate("ถัดไป", "Next")}</Button>
      </nav>
    </div>
  );
}
