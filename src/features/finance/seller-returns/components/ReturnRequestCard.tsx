import { ChevronDown, ChevronUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { formatAgo, formatBahtShort, sellerReturnStatusConfig } from "../../after-sales.format";
import type { ReturnEvidenceLink, SellerReturnRequest } from "../../after-sales.types";
import type { ReturnDraft } from "../return-draft";
import { ReturnDecisionBox } from "./ReturnDecisionBox";
import { ReturnInTransitBox } from "./ReturnInTransitBox";
import { ReturnRequestSummary } from "./ReturnRequestSummary";
import { ReturnStatusCallout } from "./ReturnStatusCallout";

/**
 * One return request as an accordion card; the body depends on the status.
 */
export function ReturnRequestCard({
  item,
  isExpanded,
  isHighlighted,
  onToggle,
  draft,
  isBusy,
  onDraftChange,
  onApprove,
  onReject,
  onReceive,
  onEvidenceClick,
}: {
  item: SellerReturnRequest;
  isExpanded: boolean;
  isHighlighted: boolean;
  onToggle: () => void;
  draft: ReturnDraft;
  isBusy: boolean;
  onDraftChange: (patch: Partial<ReturnDraft>) => void;
  onApprove: () => void;
  onReject: () => void;
  onReceive: () => void;
  onEvidenceClick: (link: ReturnEvidenceLink, list: ReturnEvidenceLink[]) => void;
}) {
  const statusConf = sellerReturnStatusConfig(item.status);

  return (
    <Card
      className={cn(
        "gap-0 overflow-hidden rounded-xl border py-0 ring-0 transition-all duration-200",
        isHighlighted && isExpanded
          ? "border-amber-500/70 shadow-none inset-ring-1 inset-ring-amber-500/30"
          : "border-border shadow-none"
      )}
    >
      {/* Accordion Card Header */}
      <div
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggle();
          }
        }}
        className="flex cursor-pointer items-center justify-between p-4 sm:p-5 transition-colors hover:bg-muted/40 select-none"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm sm:text-base text-foreground tracking-tight">
              RT-{item.id}
            </span>
            <Badge
              variant="outline"
              className={cn(
                "text-[11px] font-medium leading-none",
                statusConf.className
              )}
            >
              {statusConf.label}
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground">
            <span>{item.sellerOrderNumber}</span>
            <span className="mx-1.5">·</span>
            <span className="text-foreground font-medium">
              {item.buyer?.username ?? "buyer"}
            </span>
            <span className="mx-1.5">·</span>
            <span>
              {item.status === "IN_TRANSIT"
                ? `อนุมัติเมื่อ ${formatAgo(item.reviewedAt ?? item.requestedAt)}`
                : `เปิดคำขอเมื่อ ${formatAgo(item.requestedAt)}`}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3.5">
          <div className="text-right">
            <div className="text-base sm:text-lg font-bold text-foreground tracking-tight">
              {formatBahtShort(item.sellerOrderGrandTotal)}
            </div>
            <div className="text-[11px] text-muted-foreground">
              {item.refundAmount && item.resolution === "PARTIAL_REFUND"
                ? `คืนบางส่วน ${formatBahtShort(item.refundAmount)}`
                : "ยอดออเดอร์ย่อย"}
            </div>
          </div>
          <div className="text-muted-foreground hover:text-foreground transition-colors">
            {isExpanded ? (
              <ChevronUp className="size-5" />
            ) : (
              <ChevronDown className="size-5" />
            )}
          </div>
        </div>
      </div>

      {/* Accordion Card Body */}
      {isExpanded && (
        <CardContent className="border-t border-border p-4 sm:p-5 pt-4 space-y-5">
          {/* Case 1: REQUESTED (Decision Box) */}
          {item.status === "REQUESTED" && (
            <>
              <ReturnRequestSummary
                item={item}
                onEvidenceClick={onEvidenceClick}
              />
              <ReturnDecisionBox
                item={item}
                draft={draft}
                isBusy={isBusy}
                onDraftChange={onDraftChange}
                onApprove={onApprove}
                onReject={onReject}
              />
            </>
          )}

          {/* Case 2: IN_TRANSIT */}
          {item.status === "IN_TRANSIT" && (
            <ReturnInTransitBox
              item={item}
              restock={draft.restock}
              isBusy={isBusy}
              onRestockChange={(restock) => onDraftChange({ restock })}
              onReceive={onReceive}
            />
          )}

          {/* Case 3: Other Statuses (Informative Status Callout) */}
          {item.status !== "REQUESTED" && item.status !== "IN_TRANSIT" && (
            <ReturnStatusCallout item={item} />
          )}
        </CardContent>
      )}
    </Card>
  );
}
