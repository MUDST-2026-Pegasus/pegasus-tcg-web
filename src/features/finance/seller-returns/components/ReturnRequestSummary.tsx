import { Image as ImageIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "@/components/ui/item";

import { formatBahtShort, returnReasonLabel } from "../../after-sales.format";
import type { ReturnEvidenceLink, SellerReturnRequest } from "../../after-sales.types";
import { ReturnEvidenceGrid } from "./ReturnEvidenceGrid";

/**
 * REQUESTED card body: buyer's reason, the cards asked back, and evidence.
 */
export function ReturnRequestSummary({
  item,
  onEvidenceClick,
}: {
  item: SellerReturnRequest;
  onEvidenceClick: (link: ReturnEvidenceLink, list: ReturnEvidenceLink[]) => void;
}) {
  return (
    <>
      {/* Reason & Description */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-foreground">
            เหตุผลจากผู้ซื้อ
          </span>
          <Badge
            variant="destructive"
            className="bg-destructive/10 text-destructive border-destructive/20 text-[11px] font-medium"
          >
            {returnReasonLabel(item.reasonCode)}
          </Badge>
        </div>
        {item.description && (
          <p className="text-xs sm:text-sm text-muted-foreground bg-muted/40 rounded-lg p-3 border border-border leading-relaxed italic">
            "{item.description}"
          </p>
        )}
      </div>

      {/* Items to return */}
      <div className="space-y-2">
        <div className="text-xs font-semibold text-foreground">
          สินค้าที่ขอคืน · {item.items?.length ?? 0} รายการ
        </div>
        <div className="divide-y divide-border rounded-lg border border-border bg-card">
          {item.items && item.items.length > 0 ? (
            item.items.map((cardItem) => (
              <Item
                key={cardItem.returnItemId}
                className="flex-nowrap gap-3 rounded-none p-3"
              >
                <ItemMedia className="size-11 shrink-0 items-center justify-center rounded-md border border-border bg-muted/30 overflow-hidden shadow-2xs">
                    {cardItem.imageUrl ? (
                      <img
                        src={cardItem.imageUrl}
                        alt={cardItem.cardName}
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <ImageIcon className="size-5 text-muted-foreground" />
                    )}
                  </ItemMedia>
                <ItemContent className="min-w-0 gap-0.5">
                  <ItemTitle className="line-clamp-none text-xs text-foreground sm:text-sm">
                      {cardItem.cardName}
                      {cardItem.variantLabel ? ` — ${cardItem.variantLabel}` : ""}
                    </ItemTitle>
                  <ItemDescription className="text-[11px]">
                      {cardItem.conditionCode} · คืน {cardItem.quantityReturned} จาก{" "}
                      {cardItem.quantityOrdered} ใบ
                    </ItemDescription>
                </ItemContent>
                <ItemActions className="shrink-0 text-right text-xs font-semibold text-foreground sm:text-sm">
                  {formatBahtShort(cardItem.unitPrice * cardItem.quantityReturned)}
                </ItemActions>
              </Item>
            ))
          ) : (
            <div className="p-3 text-xs text-muted-foreground">
              ไม่พบรายการสินค้าที่ระบุคืน
            </div>
          )}
        </div>
      </div>

      {/* Evidence Grid */}
      {item.evidenceKeys && item.evidenceKeys.length > 0 && (
        <ReturnEvidenceGrid
          returnId={item.id}
          count={item.evidenceKeys.length}
          onImageClick={onEvidenceClick}
        />
      )}
    </>
  );
}
