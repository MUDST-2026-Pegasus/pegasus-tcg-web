import { useQuery } from "@tanstack/react-query";

import { afterSalesApi } from "../../after-sales.api";
import type { ReturnEvidenceLink } from "../../after-sales.types";

/**
 * Evidence thumbnail viewer with click-to-preview
 */
export function ReturnEvidenceGrid({
  returnId,
  count,
  onImageClick,
}: {
  returnId: number;
  count: number;
  onImageClick: (link: ReturnEvidenceLink, list: ReturnEvidenceLink[]) => void;
}) {
  const { data: evidence, isLoading } = useQuery({
    queryKey: ["finance", "return-evidence", returnId],
    queryFn: () => afterSalesApi.sellerReturnEvidence(returnId),
    staleTime: 5 * 60 * 1000,
  });

  if (count === 0) return null;

  return (
    <div className="space-y-2 pt-1">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="font-medium text-foreground">หลักฐานจากผู้ซื้อ · {count} ไฟล์</span>
        <span>กดรูปเพื่อดูขนาดเต็ม</span>
      </div>
      {isLoading ? (
        <div className="flex gap-2">
          {Array.from({ length: Math.min(count, 4) }).map((_, i) => (
            <div key={i} className="h-20 w-20 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : (
        <div className="flex flex-wrap gap-2.5">
          {evidence?.map((file) => (
            <button
              key={file.number}
              type="button"
              onClick={() => onImageClick(file, evidence)}
              className="group relative flex h-20 w-20 flex-col items-center justify-center rounded-lg border border-border bg-muted/40 p-1.5 transition-all hover:border-primary hover:shadow-xs focus:outline-hidden"
              aria-label={`เปิดดูหลักฐาน ${file.number}`}
            >
              <img
                src={file.url}
                alt={`หลักฐาน ${file.number}`}
                className="h-12 w-12 rounded object-cover transition-transform group-hover:scale-105"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
              <span className="mt-1 text-[10px] text-muted-foreground group-hover:text-primary">
                หลักฐาน {file.number}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
