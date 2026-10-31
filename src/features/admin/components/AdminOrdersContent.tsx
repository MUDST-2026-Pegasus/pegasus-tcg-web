import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";

import { Clock } from "lucide-react";

import { QueryBoundary } from "@/components/common";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { orderAlertNotice } from "../orders.format";
import { getAdminOrders } from "../orders.api";
import { useOrderBoard } from "../orders.queries";
import type { AdminOrderSummary, OrderBoardColumn } from "../orders.types";
import { OrderBoardSkeleton } from "./OrderBoardSkeleton";
import { OrderDetailSheet } from "./OrderDetailSheet";
import { OrderKanbanColumn } from "./OrderKanbanColumn";
import { OrderListSheet } from "./OrderListSheet";

/**
 * ภาพรวมคำสั่งซื้อทั้งแพลตฟอร์ม — Kanban 5 คอลัมน์จาก `/admin/orders/board`
 * กดการ์ดเปิดรายละเอียด, "ดูเพิ่มเติม" เปิดรายการเต็มของคอลัมน์นั้น
 */
export function AdminOrdersContent() {
  const board = useOrderBoard();
  const [listColumn, setListColumn] = useState<OrderBoardColumn | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [params] = useSearchParams();
  const searchedOrder = params.get("q")?.trim() || "";
  const orderMatches = useQuery({
    queryKey: ["admin-orders", "promotion-order", searchedOrder],
    queryFn: () => getAdminOrders({ statuses: [], q: searchedOrder, sort: "NEWEST", page: 0, size: 20 }),
    enabled: searchedOrder.length > 0,
  });

  const disputes = board.data?.columns.find((column) => column.key === "DISPUTED");

  function openOrder(order: AdminOrderSummary) {
    setSelectedId(order.sellerOrderId);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* หัวหน้า: ชื่อหน้า + ปุ่มการทำงาน */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-[26px] leading-tight font-bold tracking-[-0.5px] text-foreground">
            ภาพรวมคำสั่งซื้อ
          </h1>
          <p className="text-[13px] text-muted-foreground">
            ติดตามคำสั่งซื้อทั้งแพลตฟอร์มตามสถานะ · เงินของผู้ซื้อพักไว้กับแพลตฟอร์มจนกว่าผู้ซื้อจะได้รับสินค้า
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* backend ยังไม่มี endpoint ส่งออก ปิดไว้พร้อมบอกเหตุผล */}
          <Tooltip>
            <TooltipTrigger render={<span className="inline-flex" />}>
              <Button variant="outline" className="rounded-md px-2.5" disabled>
                ส่งออก CSV
              </Button>
            </TooltipTrigger>
            <TooltipContent>ยังส่งออกเป็นไฟล์ไม่ได้ในตอนนี้</TooltipContent>
          </Tooltip>
          <Button
            className="rounded-md px-2.5"
            disabled={!disputes}
            onClick={() => disputes && setListColumn(disputes)}
          >
            จัดการข้อพิพาท
          </Button>
        </div>
      </div>

      {searchedOrder && <div className="rounded-xl border bg-card p-4 text-sm">
        <h2 className="font-semibold">คำสั่งซื้อ {searchedOrder}</h2>
        {orderMatches.isPending && <p className="mt-2 text-muted-foreground">กำลังค้นหาคำสั่งซื้อ...</p>}
        {orderMatches.isError && <p role="alert" className="mt-2 text-destructive">ค้นหาคำสั่งซื้อไม่สำเร็จ <button onClick={() => void orderMatches.refetch()}>ลองอีกครั้ง</button></p>}
        {orderMatches.data && <div className="mt-2 grid gap-2">{orderMatches.data.items.filter((item) => item.orderNumber === searchedOrder).map((item) => <button key={item.sellerOrderId} type="button" className="rounded-lg border p-3 text-left hover:bg-muted" onClick={() => setSelectedId(item.sellerOrderId)}>{item.sellerOrderNumber} · {item.seller.displayName} · {item.status}</button>)}{!orderMatches.data.items.some((item) => item.orderNumber === searchedOrder) && <p className="text-muted-foreground">ไม่พบคำสั่งซื้อหมายเลขนี้</p>}</div>}
      </div>}

      <QueryBoundary
        query={board}
        loading={<OrderBoardSkeleton />}
        errorTitle="โหลดภาพรวมคำสั่งซื้อไม่สำเร็จ"
      >
        {({ columns, alerts }) => {
          const notice = orderAlertNotice(alerts);
          return (
            <>
              {/* แถบเตือนสีพีช — โทนเดียวกับ badge "รอชำระเงิน" ซ่อนเมื่อไม่มีอะไรต้องเตือน */}
              {notice ? (
                <div
                  role="status"
                  className="flex items-start gap-4 rounded-[10px] bg-[#fdf0dd] px-4 py-3.5 text-[#b45309]"
                >
                  <Clock aria-hidden="true" className="mt-0.5 size-6 shrink-0" />
                  <div className="flex flex-col gap-0.5 text-xs">
                    <p className="font-medium">{notice.title}</p>
                    <p className="text-[#b45309]/85">{notice.description}</p>
                  </div>
                </div>
              ) : null}

              {/* Kanban 5 คอลัมน์ — บนจอเล็กพับเป็น 1–2 คอลัมน์เพื่อให้ยังอ่านได้ */}
              <div className="grid grid-cols-1 items-start gap-[14.8px] sm:grid-cols-2 xl:grid-cols-5">
                {columns.map((column) => (
                  <OrderKanbanColumn
                    key={column.key}
                    column={column}
                    onSelect={openOrder}
                    onShowMore={setListColumn}
                  />
                ))}
              </div>
            </>
          );
        }}
      </QueryBoundary>

      <OrderListSheet
        column={listColumn}
        onClose={() => setListColumn(null)}
        onSelect={openOrder}
      />
      <OrderDetailSheet
        sellerOrderId={selectedId}
        onClose={() => setSelectedId(null)}
      />
    </div>
  );
}
