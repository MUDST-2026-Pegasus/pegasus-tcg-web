import { useEffect, useRef, useState } from "react";

import { Search } from "lucide-react";

import { EmptyState, QueryBoundary } from "@/components/common";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { formatBaht, formatCount } from "../catalog.format";
import {
  ORDER_COLUMN_META,
  formatItemCount,
  orderContextLabel,
  partyName,
} from "../orders.format";
import { useAdminOrders } from "../orders.queries";
import type { AdminOrderSummary, OrderBoardColumn } from "../orders.types";
import { CatalogPagination } from "./CatalogPagination";
import { ORDER_TONE_BADGE } from "./orders.styles";

const PAGE_SIZE = 20;
const SEARCH_DELAY_MS = 300;

type OrderListSheetProps = {
  /** คอลัมน์ที่กด "ดูเพิ่มเติม" — `null` = ปิด */
  column: OrderBoardColumn | null;
  onClose: () => void;
  onSelect: (order: AdminOrderSummary) => void;
};

/** ทุกคำสั่งซื้อของคอลัมน์หนึ่ง แบ่งหน้า ค้นด้วยเลขคำสั่งซื้อหรือชื่อผู้ใช้ได้ */
export function OrderListSheet({ column, onClose, onSelect }: OrderListSheetProps) {
  // จำคอลัมน์ล่าสุดไว้ระหว่างเลื่อนปิด ไม่งั้นเนื้อหาหายก่อนหน้าต่างออกพ้นจอ
  const [shown, setShown] = useState(column);
  if (column !== null && column !== shown) {
    setShown(column);
  }

  return (
    <Sheet
      open={column !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent className="gap-0 data-[side=right]:w-full data-[side=right]:sm:max-w-xl">
        {shown ? (
          <OrderListPanel
            key={shown.key}
            column={shown}
            enabled={column !== null}
            onSelect={onSelect}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function OrderListPanel({
  column,
  enabled,
  onSelect,
}: {
  column: OrderBoardColumn;
  enabled: boolean;
  onSelect: (order: AdminOrderSummary) => void;
}) {
  const meta = ORDER_COLUMN_META[column.key];
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  function handleSearchInput(value: string) {
    setSearch(value);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setQ(value.trim());
      setPage(0);
    }, SEARCH_DELAY_MS);
  }

  const orders = useAdminOrders(
    { statuses: column.statuses, q, sort: meta.sort, page, size: PAGE_SIZE },
    enabled,
  );

  return (
    <>
      <SheetHeader className="pr-14">
        <SheetTitle className="text-lg font-semibold">{meta.title}</SheetTitle>
        <SheetDescription>
          ทั้งหมด {formatCount(column.count)} รายการ · กดรายการเพื่อดูรายละเอียด
        </SheetDescription>
      </SheetHeader>

      <div className="flex flex-col gap-4 overflow-y-auto px-4 pb-6">
        <div className="relative">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={search}
            onChange={(event) => handleSearchInput(event.target.value)}
            placeholder="ค้นหาเลขคำสั่งซื้อ หรือชื่อผู้ซื้อ/ผู้ขาย"
            aria-label="ค้นหาคำสั่งซื้อ"
            className="pl-8"
          />
        </div>

        <QueryBoundary
          query={orders}
          loading={<OrderListSkeleton />}
          errorTitle="โหลดคำสั่งซื้อไม่สำเร็จ"
          isEmpty={(result) => result.items.length === 0}
          empty={
            <EmptyState
              title={q ? "ไม่พบคำสั่งซื้อที่ค้นหา" : "ยังไม่มีคำสั่งซื้อในสถานะนี้"}
            />
          }
        >
          {(result) => (
            <div
              className={cn(
                "flex flex-col gap-3",
                orders.isPlaceholderData && "opacity-60",
              )}
            >
              <ul className="flex flex-col divide-y rounded-[10px] border">
                {result.items.map((order) => (
                  <li key={order.sellerOrderId}>
                    <button
                      type="button"
                      onClick={() => onSelect(order)}
                      className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none"
                    >
                      <div className="flex min-w-0 flex-col gap-0.5">
                        <span className="truncate text-sm font-medium">
                          {order.sellerOrderNumber}
                        </span>
                        <span className="truncate text-xs text-muted-foreground">
                          {partyName(order.seller)} → {partyName(order.buyer)} ·{" "}
                          {formatItemCount(order.itemCount)}
                        </span>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <span className="text-sm font-medium">
                          {formatBaht(order.grandTotal)}
                        </span>
                        <Badge
                          className={cn(
                            "rounded-[5px] px-2 text-[10px] font-medium",
                            ORDER_TONE_BADGE[meta.tone],
                          )}
                        >
                          {orderContextLabel(column.key, order)}
                        </Badge>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
              <CatalogPagination
                page={result.page + 1}
                totalPages={result.totalPages}
                disabled={orders.isPlaceholderData}
                onPageChange={(next) => setPage(next - 1)}
              />
            </div>
          )}
        </QueryBoundary>
      </div>
    </>
  );
}

function OrderListSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-2">
      {Array.from({ length: 6 }, (_, index) => (
        <Skeleton key={index} className="h-14 rounded-md" />
      ))}
    </div>
  );
}
