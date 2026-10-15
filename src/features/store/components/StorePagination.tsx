import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type StorePaginationProps = {
  page: number;
  totalPages: number;
  pending: boolean;
  onChange: (page: number) => void;
};

export function StorePagination({
  page,
  totalPages,
  pending,
  onChange,
}: StorePaginationProps) {
  if (totalPages <= 1) return null;

  // Generate page numbers (1-indexed for display)
  const pages = Array.from({ length: totalPages }, (_, i) => i);

  return (
    <nav aria-label="Store pages" className="flex items-center justify-center gap-1.5 sm:gap-2 pt-2">
      <Button
        variant="outline"
        size="sm"
        disabled={page === 0 || pending}
        onClick={() => onChange(page - 1)}
        className="h-9 px-3 rounded-lg text-sm text-foreground"
      >
        <span className="sr-only">Previous</span>
        <span>ก่อนหน้า</span>
      </Button>

      {pages.map((p) => {
        const isActive = p === page;
        return (
          <Button
            key={p}
            variant={isActive ? "default" : "outline"}
            size="sm"
            disabled={pending}
            onClick={() => onChange(p)}
            className={cn(
              "h-9 w-9 rounded-lg p-0 text-sm font-medium",
              isActive
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "text-foreground hover:bg-muted",
            )}
            aria-current={isActive ? "page" : undefined}
          >
            {p + 1}
          </Button>
        );
      })}

      <Button
        variant="outline"
        size="sm"
        disabled={page + 1 >= totalPages || pending}
        onClick={() => onChange(page + 1)}
        className="h-9 px-3 rounded-lg text-sm text-foreground"
      >
        <span className="sr-only">Next</span>
        <span>ถัดไป</span>
      </Button>
    </nav>
  );
}
