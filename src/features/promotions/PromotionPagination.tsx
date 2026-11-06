import { Button } from "@/components/ui/button";
import { Pagination, PaginationContent, PaginationItem } from "@/components/ui/pagination";
import { cn } from "@/lib/utils";

/** ก่อนหน้า / หน้า x / y / ถัดไป — ใช้ทั้งหน้าโค้ดร้านและ sheet การใช้โค้ดของแอดมิน */
export function PromotionPagination({
  page, totalPages, onPageChange, label, className,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  label: string;
  className?: string;
}) {
  if (totalPages <= 1) return null;
  return (
    <Pagination aria-label={label} className={cn("justify-end", className)}>
      <PaginationContent>
        <PaginationItem>
          <Button variant="outline" size="sm" disabled={page === 0}
            onClick={() => onPageChange(page - 1)}>ก่อนหน้า</Button>
        </PaginationItem>
        <PaginationItem className="px-2 text-xs text-muted-foreground">
          หน้า {page + 1} / {totalPages}
        </PaginationItem>
        <PaginationItem>
          <Button variant="outline" size="sm" disabled={page + 1 >= totalPages}
            onClick={() => onPageChange(page + 1)}>ถัดไป</Button>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
