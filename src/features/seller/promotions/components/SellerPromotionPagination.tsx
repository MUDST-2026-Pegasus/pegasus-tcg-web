import { Button } from "@/components/ui/button";
import { Pagination, PaginationContent, PaginationItem } from "@/components/ui/pagination";

export function SellerPromotionPagination({
  page, totalPages, onPageChange, label,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  label: string;
}) {
  if (totalPages <= 1) return null;
  return (
    <Pagination aria-label={label} className="justify-end">
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
